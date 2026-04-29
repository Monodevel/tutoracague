# Análisis integral de TutorAcague para continuar implementación del modo “Profesor”

## 1) Estado actual del sistema

### Backend
- API en FastAPI con routers separados por dominio (`study`, `practice`, `tutor`, `voice`, `study_tutor`, etc.).
- Persistencia en SQLite con SQLModel.
- Flujo de tutoría ya dividido en dos caminos:
  - **Tutor simple por lección** (`/api/tutor/explain`) usando `AiTutorService`.
  - **Tutor con RAG por tema** (`/api/study-tutor/ask`) usando `LlmTutorService` + `RagService`.
- Motor TTS implementado con Piper (`/api/voice/speak`), con caché local de audio.

### Frontend
- Aplicación React/Vite con navegación por páginas (estudio, práctica, progreso, configuración).
- UI orientada a dispositivo dedicado (layout de panel lateral + topbar + panel derecho).
- Hay hooks para voz:
  - `usePiperSpeech` (backend TTS Piper).
  - `useSpeech` (SpeechSynthesis del navegador, fallback).

### Contenidos
- Existe seeding inicial y pipeline de generación/importación de contenido.
- Hay importador de paquete JSON para lecciones/preguntas, pero **sin firma/cifrado/validación criptográfica**.

## 2) Hallazgos clave frente a tu objetivo

### Objetivo: “modelo profesor” (enseñar, profundizar, preguntar, cuestionarios)
Ya hay base parcial:
- Prompt pedagógico con acciones (`simplify`, `deepen`, `compare`, etc.).
- Generación de preguntas por lección en `AiTutorService`.
- Sesión guiada por pasos en `SessionOrchestrator`.

Faltantes estructurales para un “profesor completo”:
1. **Máquina pedagógica de estado** (plan de clase por objetivo, nivel, tiempo y desempeño).
2. **Evaluación adaptativa continua** (no solo correcto/incorrecto, sino dominio por competencia).
3. **Unificación de tutoría + práctica + sesión en un mismo ciclo** (explica → comprueba → remedia → profundiza).
4. **Contrato de respuesta estricto en JSON** para acciones docentes (explicación, preguntas, rúbrica, retroalimentación).

### Objetivo: voz como interfaz principal
- Está resuelto TTS (salida).
- **No está implementado STT** (entrada de voz del usuario).
- Se requiere VAD, cancelación de eco, wake/speak flow y manejo robusto offline para dispositivo cerrado.

### Objetivo: actualizaciones comerciales por paquetes TAUP cifrados/validados
- Hoy hay importación de contenido JSON sin validación criptográfica.
- Falta diseño de:
  - formato `.taup`;
  - firma del emisor;
  - cifrado de payload;
  - control de versión y migraciones;
  - política de instalación y rollback;
  - auditoría local/notificación de cambios.

## 3) Riesgos técnicos actuales

1. **Modelo configurado inconsistente con tu requerimiento**:
   - Actualmente `qwen2.5:0.5b`, no `qwen2.5:05.b` (según tu mensaje).
2. **Prompt con contradicción**:
   - en `LlmTutorService` dice usar solo RAG, pero también menciona “puedes buscar en internet”.
3. **RAG por keywords**:
   - sin embeddings; puede degradar precisión pedagógica al escalar contenido.
4. **Falta control de superficie UI para hardware de baja potencia**:
   - hay restos de estilos plantilla en `App.css` que no aportan al producto final.

## 4) Roadmap propuesto (priorizado)

### Fase A (corto plazo, 1-2 semanas): Profesor funcional consistente
1. Unificar configuración de modelo en un solo punto (env/config).
2. Crear `TeacherOrchestratorService`:
   - Entrada: tema, objetivo, nivel, tiempo, historial.
   - Salida JSON: `teaching_plan`, `explanation`, `check_questions`, `rubric`, `next_action`.
3. Definir acciones docentes mínimas:
   - `teach`, `deepen`, `check_understanding`, `quiz`, `feedback`, `remediate`, `close_session`.
4. Forzar respuestas estructuradas JSON del LLM y validarlas con pydantic.

### Fase B (voz y UX de dispositivo, 2-3 semanas)
1. Integrar STT offline (faster-whisper / whisper.cpp / Vosk) vía servicio local.
2. Flujo conversacional por turnos:
   - TTS habla → micrófono abierto → STT transcribe → tutor responde.
3. Modo kiosk:
   - pantalla limpia, navegación limitada, recuperación automática tras error.
4. Metas de rendimiento en notebook/Raspberry:
   - latencia objetivo por turno, consumo RAM, timeout de inferencia.

### Fase C (TAUP seguro + negocio, 3-5 semanas)
1. Especificar formato TAUP:
   - `manifest.json` + `payload.enc` + `signature.sig`.
2. Firma Ed25519 del paquete + validación en dispositivo.
3. Cifrado de contenido (ej. XChaCha20-Poly1305) con clave de dispositivo.
4. Instalador transaccional:
   - precheck, backup, apply, verify, rollback.
5. Registro de cambios visible para usuario:
   - mejoras software, mejoras de contenido, versión instalada, fecha.

## 5) Recomendaciones concretas para tu siguiente implementación

1. **Primero cerrar el contrato del “Profesor”** (JSON y acciones pedagógicas), antes de sumar más UI.
2. **Agregar STT como microservicio local** y exponer `/api/voice/listen` por streaming o chunks.
3. **Diseñar TAUP antes de monetizar actualizaciones**: sin cadena de confianza, el modelo de negocio queda vulnerable.
4. **Evitar ensuciar interfaz**:
   - consolidar componentes actuales y eliminar estilos heredados no usados.

## 6) Entregables sugeridos para el próximo sprint

- Documento de contrato de `TeacherResponse` (schemas).
- Servicio `teacher_orchestrator.py` + router `/api/teacher/session/*`.
- PoC STT offline con prueba end-to-end voz→texto→LLM→voz.
- Especificación técnica TAUP v1 y verificador de firma.

## 7) Decisiones de arquitectura que conviene cerrar ya

1. ¿Modelo único (`qwen2.5:0.5b`) o perfiles por hardware (`0.5b/1.5b/3b`)?
2. ¿STT embebido en backend FastAPI o daemon separado?
3. ¿Actualizaciones TAUP por archivo físico, red local o backend licenciado?
4. ¿Política de contenido: solo oficial validado o también contenido recomendado marcado?

---

Este análisis deja al proyecto listo para entrar a una implementación orientada al “profesor real”, con prioridad en consistencia pedagógica, voz bidireccional y seguridad de actualizaciones.
