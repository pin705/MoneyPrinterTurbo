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

export interface BatchResultData {
  batch_id: string;
  task_ids: string[];
  queued: number;
  requested: number;
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
  /** Epoch seconds the task was first created (server-side). */
  created_at?: number;
  /** Folder name this task is filed under, or null/undefined when unsorted. */
  folder?: string | null;
}

export interface TaskListData {
  tasks: TaskQueryData[];
  total: number;
  page: number;
  page_size: number;
}

export interface FolderInfo {
  name: string;
  count: number;
}

export interface FolderListData {
  folders: FolderInfo[];
}

/** Server-side query for the library list. */
export interface ListTasksQuery {
  q?: string;
  /** "complete" | "processing" | "failed" */
  status?: string;
  /** "newest" | "oldest" */
  sort?: string;
  /** Folder name, or "__unsorted__" for unfiled tasks. */
  folder?: string;
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

/** One distinct short-video idea from the Phase 1 content plan. */
export interface ContentIdea {
  title: string;
  hook: string;
  angle: string;
  keywords: string[];
}

export interface ContentPlanData {
  ideas: ContentIdea[];
}

export interface GenerateContentPlanInput {
  niche: string;
  audience?: string;
  topic?: string;
  count?: number;
  tone?: string;
  language?: string;
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
