export interface UserProfile {
  id: number;
  full_name: string;
  birth_date: string;
  email: string;
  initial_setup_completed: boolean;

  daily_study_minutes: number;
  preferred_study_time: string;
  voice_enabled: boolean;
  voice_mode: string;
  notifications_enabled: boolean;
  offline_mode: boolean;
  study_mode: string;
}

export interface UserProfileCreate {
  full_name: string;
  birth_date: string;
  email: string;
  initial_setup_completed: boolean;

  daily_study_minutes: number;
  preferred_study_time: string;
  voice_enabled: boolean;
  voice_mode: string;
  notifications_enabled: boolean;
  offline_mode: boolean;
  study_mode: string;
}

export interface StudyTopic {
  id: number;
  study_area_id: number;
  name: string;
  description: string;
  order: number;
}

export interface StudyArea {
  id: number;
  name: string;
  description: string;
  weight_percentage: number;
  order: number;
  topics: StudyTopic[];
}

export interface DeviceStatus {
  online: boolean;
  wifi: string;
  bluetooth: {
    available: boolean;
    connected: boolean;
    device_name: string | null;
  };
  audio: {
    available: boolean;
    active_device: string;
  };
  ai: {
    available: boolean;
    status: string;
  };
  license: {
    status: string;
    label: string;
  };
  update: {
    installed_version: string;
    installed_label: string;
    installed_at: string;
    status: string;
  };
  time: string;
  date: string;
  day_name: string;
}

export interface Lesson {
  id: number;
  study_topic_id: number;
  title: string;
  content: string;
  official_source: string;
  source_reference: string;
  order: number;
  is_official_content: boolean;
}

export interface StudyTopicDetail extends StudyTopic {
  lessons: Lesson[];
}

export interface PracticeOption {
  label: string;
  text: string;
}

export interface PracticeQuestion {
  id: string;
  topic_id: number;
  lesson_id: number;
  question: string;
  options: PracticeOption[];
  correct_option: string;
  explanation: string;
  source: string;
  source_reference: string;
  source_fragment: string;
  bloom_level: string;
}

export interface PracticeGenerateRequest {
  topic_id: number;
  question_count: number;
}

export interface PracticeGenerateResponse {
  topic_id: number;
  topic_name: string;
  source_mode: string;
  questions: PracticeQuestion[];
}

export interface PracticeAnswerRequest {
  question: PracticeQuestion;
  selected_option: string;
}

export interface PracticeAnswerResponse {
  is_correct: boolean;
  correct_option: string;
  selected_option: string;
  explanation: string;
  source: string;
  source_reference: string;
  source_fragment: string;
}

export interface TutorExplainRequest {
  topic_id: number;
  lesson_id: number;
}

export interface TutorExplainResponse {
  topic_id: number;
  lesson_id: number;
  explanation: string;
  source: string;
  source_reference: string;
}

export interface PracticeResultCreate {
  topic_id: number;
  topic_name: string;
  source_mode: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  score_percentage: number;
}

export interface PracticeResultRead {
  id: number;
  topic_id: number;
  topic_name: string;
  source_mode: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  score_percentage: number;
  created_at: string;
}

export interface ProgressSummary {
  total_sessions: number;
  average_score: number;
  best_score: number;
  last_score: number;
  weakest_topics: {
    topic_id: number;
    topic_name: string;
    sessions: number;
    average_score: number;
  }[];
  recent_results: PracticeResultRead[];
}

export type TeachingStepType =
  | "objective"
  | "explanation"
  | "check_understanding"
  | "reinforcement"
  | "summary";

export interface TeachingStep {
  id: string;
  type: TeachingStepType;
  title: string;
  text: string;
  question?: string;
  expected_answer?: string;
  source_fragment?: string;
}

export interface TeachingSession {
  topic_id: number;
  topic_name: string;
  lesson_id: number;
  lesson_title: string;
  source: string;
  source_reference: string;
  steps: TeachingStep[];
}

export interface StudySessionStartRequest {
  topic_id: number;
  duration_minutes: number;
}

export interface StudySessionStep {
  id: string;
  order: number;
  phase: string;
  title: string;
  tutor_message: string;
  expected_user_action: string;
  requires_response: boolean;
  question?: string | null;
  source: string;
  source_reference: string;
  source_fragment: string;
}

export interface StudySessionStartResponse {
  session_id: string;
  topic_id: number;
  topic_name: string;
  lesson_id: number | null;
  lesson_title: string | null;
  duration_minutes: number;
  current_step_index: number;
  total_steps: number;
  step: StudySessionStep;
}

export interface StudySessionAnswerRequest {
  session_id: string;
  step_id: string;
  answer: string;
}

export interface StudySessionAnswerResponse {
  is_acceptable: boolean;
  conceptual_accuracy: number;
  depth: number;
  source_alignment: number;
  clarity: number;
  feedback: string;
  follow_up_question?: string | null;
  can_continue: boolean;
}

export interface StudySessionNextRequest {
  session_id: string;
}

export interface StudySessionNextResponse {
  session_id: string;
  current_step_index: number;
  total_steps: number;
  finished: boolean;
  step: StudySessionStep | null;
}

export interface StudySessionFinishRequest {
  session_id: string;
}

export interface StudySessionFinishResponse {
  session_id: string;
  status: string;
  message: string;
}

export interface MapLayer {
  id: string;
  name: string;
  type: string;
  file_url?: string | null;
  default_visible: boolean;
  opacity: number;
}

export interface MapMarker {
  id: string;
  label: string;
  x: number;
  y: number;
  description: string;
}

export interface VisualResource {
  id: string;
  topic_id: number;
  title: string;
  description: string;
  type: string;
  base_image_url: string;
  source: string;
  source_reference: string;
  layers: MapLayer[];
  markers: MapMarker[];
}

export interface StudyTutorRequest {
  topic_id: number;
  action: string;
  user_message: string;
  level: string;
}

export interface StudyTutorSource {
  title: string;
  source_reference: string;
  source_fragment: string;
}

export interface StudyTutorResponse {
  answer: string;
  topic_id: number;
  topic_name: string;
  action: string;
  source_used: StudyTutorSource[];
  suggested_actions: string[];
  requires_validation: boolean;
}

export interface StudyCatalogTopic {
  id: number;
  name: string;
  description: string;
  order: number;
  lessons_count: number;
  rag_chunks_count: number;
  has_content: boolean;
  has_rag: boolean;
}

export interface StudyCatalogArea {
  id: number;
  name: string;
  description: string;
  order: number;
  topics: StudyCatalogTopic[];
}