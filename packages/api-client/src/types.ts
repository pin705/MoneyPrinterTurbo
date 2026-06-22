import type { TaskStateValue } from "@mpt/shared";

/** Envelope shared by every backend response (app/models/schema.py BaseResponse). */
export interface BaseResponse<T> {
  status: number;
  message?: string;
  data: T;
}

export interface TaskResponseData {
  task_id: string;
}

/** GET /api/v1/tasks/{task_id} → data. */
export interface TaskQueryData {
  task_id?: string;
  state: TaskStateValue;
  progress?: number;
  videos?: string[];
  combined_videos?: string[];
  script?: string;
  terms?: string[];
  audio_file?: string;
  audio_duration?: number;
  subtitle_path?: string;
  materials?: string[];
  cross_post_results?: Record<string, unknown>[];
}

export interface ScriptData {
  video_script: string;
}

export interface TermsData {
  video_terms: string[];
}

export interface SocialMetadataData {
  title: string;
  caption: string;
  hashtags: string[];
}

export interface GenerateScriptInput {
  video_subject: string;
  video_language?: string;
  paragraph_number?: number;
  video_script_prompt?: string;
  custom_system_prompt?: string;
}

export interface GenerateTermsInput {
  video_subject: string;
  video_script: string;
  amount?: number;
}

/** The editable [app] section of config.toml (flexible key/value bag). */
export type AppConfig = Record<string, unknown>;

export interface ConfigData {
  app: AppConfig;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
