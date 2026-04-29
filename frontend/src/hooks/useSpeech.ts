import { useCallback, useEffect, useState } from "react";

interface UseSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const lang = options.lang ?? "es-CL";
  const rate = options.rate ?? 0.95;
  const pitch = options.pitch ?? 1;
  const volume = options.volume ?? 1;

  useEffect(() => {
    function loadVoices() {
      const availableVoices = window.speechSynthesis?.getVoices?.() ?? [];
      setVoices(availableVoices);
    }

    loadVoices();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const getPreferredVoice = useCallback(() => {
    if (!voices.length) return null;

    const spanishVoice =
      voices.find((voice) => voice.lang === "es-CL") ??
      voices.find((voice) => voice.lang === "es-ES") ??
      voices.find((voice) => voice.lang.startsWith("es")) ??
      null;

    return spanishVoice;
  }, [voices]);

  const stop = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) {
        console.warn("SpeechSynthesis no está disponible en este navegador.");
        return;
      }

      const cleanText = text.trim();

      if (!cleanText) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      const voice = getPreferredVoice();

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [getPreferredVoice, lang, pitch, rate, volume]
  );

  const pause = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.resume();
    setIsPaused(false);
  }, []);

  return {
    voices,
    isSpeaking,
    isPaused,
    speak,
    stop,
    pause,
    resume,
  };
}