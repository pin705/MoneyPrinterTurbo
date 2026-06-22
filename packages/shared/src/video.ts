// Mirrors app/models/schema.py — keep in sync with the Python backend contract.

export type VideoConcatMode = "random" | "sequential";

export type VideoTransitionMode =
  | "Shuffle"
  | "FadeIn"
  | "FadeOut"
  | "SlideIn"
  | "SlideOut"
  | null;

export type VideoAspect = "16:9" | "9:16" | "1:1";

export const ASPECT_RESOLUTION: Record<VideoAspect, [number, number]> = {
  "16:9": [1920, 1080],
  "9:16": [1080, 1920],
  "1:1": [1080, 1080],
};

export interface MaterialInfo {
  provider: string;
  url: string;
  duration: number;
}

/** Request body for POST /api/v1/videos — mirrors VideoParams in schema.py. */
export interface VideoParams {
  video_subject: string;
  video_script?: string;
  video_terms?: string | string[] | null;
  video_aspect?: VideoAspect;
  video_concat_mode?: VideoConcatMode;
  video_transition_mode?: VideoTransitionMode;
  video_clip_duration?: number;
  match_materials_to_script?: boolean;
  video_count?: number;
  video_source?: string;
  video_materials?: MaterialInfo[] | null;
  custom_audio_file?: string | null;
  video_language?: string;

  voice_name?: string;
  voice_volume?: number;
  voice_rate?: number;
  bgm_type?: string;
  bgm_file?: string;
  bgm_volume?: number;

  subtitle_enabled?: boolean;
  subtitle_position?: "top" | "bottom" | "center" | "custom";
  custom_position?: number;
  font_name?: string;
  text_fore_color?: string;
  text_background_color?: boolean | string;
  rounded_subtitle_background?: boolean;

  font_size?: number;
  stroke_color?: string;
  stroke_width?: number;
  n_threads?: number;
  paragraph_number?: number;
  video_script_prompt?: string;
  custom_system_prompt?: string;
}

/** Backend task states — mirrors app/models/const.py. */
export const TaskState = {
  FAILED: -1,
  COMPLETE: 1,
  PROCESSING: 4,
} as const;
export type TaskStateValue = (typeof TaskState)[keyof typeof TaskState];

/** Defaults aligned with the Streamlit UI + schema.py. */
export const DEFAULT_VIDEO_PARAMS: VideoParams = {
  video_subject: "",
  video_script: "",
  video_terms: "",
  video_aspect: "9:16",
  video_concat_mode: "random",
  video_transition_mode: null,
  video_clip_duration: 3,
  match_materials_to_script: false,
  video_count: 1,
  video_source: "pexels",
  video_language: "",
  voice_name: "",
  voice_volume: 1.0,
  voice_rate: 1.0,
  bgm_type: "random",
  bgm_file: "",
  bgm_volume: 0.2,
  subtitle_enabled: true,
  subtitle_position: "bottom",
  custom_position: 70.0,
  font_name: "",
  text_fore_color: "#FFFFFF",
  text_background_color: true,
  rounded_subtitle_background: false,
  font_size: 60,
  stroke_color: "#000000",
  stroke_width: 1.5,
  paragraph_number: 1,
  video_script_prompt: "",
  custom_system_prompt: "",
};
