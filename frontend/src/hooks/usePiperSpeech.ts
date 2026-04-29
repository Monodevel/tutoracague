import { useCallback, useRef, useState } from "react";

interface VoiceSpeakResponse {
  audio_url: string;
}

const API_BASE_URL = "http://127.0.0.1:8000";

export function usePiperSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setIsSpeaking(false);
    setIsLoadingVoice(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      const cleanText = text.trim();

      if (!cleanText) {
        setVoiceError("No hay texto para reproducir.");
        return;
      }

      try {
        stop();

        setVoiceError("");
        setIsLoadingVoice(true);

        const response = await fetch(`${API_BASE_URL}/api/voice/speak`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: cleanText,
          }),
        });

        if (!response.ok) {
          let detail = "No fue posible generar la voz.";

          try {
            const errorData = await response.json();
            detail = errorData?.detail ?? detail;
          } catch {
            // Mantener mensaje genérico.
          }

          throw new Error(detail);
        }

        const data = (await response.json()) as VoiceSpeakResponse;

        if (!data.audio_url) {
          throw new Error("El backend no entregó la URL del audio generado.");
        }

        const audioUrl = data.audio_url.startsWith("http")
          ? data.audio_url
          : `${API_BASE_URL}${data.audio_url}`;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          setIsLoadingVoice(false);
        };

        audio.onended = () => {
          setIsSpeaking(false);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setIsLoadingVoice(false);
          audioRef.current = null;
          setVoiceError("No fue posible reproducir el audio generado.");
        };

        await audio.play();
      } catch (error) {
        setIsSpeaking(false);
        setIsLoadingVoice(false);
        audioRef.current = null;

        if (error instanceof Error) {
          setVoiceError(error.message);
        } else {
          setVoiceError("No fue posible generar la voz.");
        }
      }
    },
    [stop]
  );

  return {
    speak,
    stop,
    isSpeaking,
    isLoadingVoice,
    voiceError,
  };
}