import type { VideoParams } from "@mpt/shared";
import {
  ApiError,
  type BaseResponse,
  type GenerateScriptInput,
  type GenerateTermsInput,
  type ScriptData,
  type SocialMetadataData,
  type TaskQueryData,
  type TaskResponseData,
  type TermsData,
} from "./types";

export interface ClientOptions {
  /** Base URL of the local Python backend, e.g. http://127.0.0.1:8000 */
  baseUrl: string;
  /** Optional x-api-key when the backend has auth enabled. */
  apiKey?: string;
}

export class MptClient {
  constructor(private opts: ClientOptions) {}

  private async request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (this.opts.apiKey) headers["x-api-key"] = this.opts.apiKey;

    const res = await fetch(`${this.opts.baseUrl}/api/v1${path}`, {
      ...init,
      headers,
    });

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }

    if (!res.ok) {
      const envelope = body as BaseResponse<unknown> | undefined;
      throw new ApiError(
        res.status,
        envelope?.message || `Request failed: ${res.status}`,
        envelope?.data,
      );
    }
    return (body as BaseResponse<T>).data;
  }

  /** GET /ping — health check. Returns true if the backend is reachable. */
  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${this.opts.baseUrl}/api/v1/ping`);
      return res.ok;
    } catch {
      return false;
    }
  }

  /** POST /videos — create a video generation task. Returns task_id. */
  createVideoTask(params: VideoParams): Promise<TaskResponseData> {
    return this.request<TaskResponseData>("/videos", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /** GET /tasks/{id} — poll task status. */
  getTask(taskId: string): Promise<TaskQueryData> {
    return this.request<TaskQueryData>(`/tasks/${taskId}`);
  }

  /** DELETE /tasks/{id} */
  deleteTask(taskId: string): Promise<unknown> {
    return this.request(`/tasks/${taskId}`, { method: "DELETE" });
  }

  /** POST /scripts — generate a narration script from a subject. */
  generateScript(input: GenerateScriptInput): Promise<ScriptData> {
    return this.request<ScriptData>("/scripts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  /** POST /terms — generate English search keywords from a script. */
  generateTerms(input: GenerateTermsInput): Promise<TermsData> {
    return this.request<TermsData>("/terms", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  /** POST /social-metadata — title/caption/hashtags for a platform. */
  generateSocialMetadata(input: {
    video_subject: string;
    video_script: string;
    language?: string;
    platform?: string;
  }): Promise<SocialMetadataData> {
    return this.request<SocialMetadataData>("/social-metadata", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  /** Absolute URL to a generated file served by the backend static mount. */
  fileUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `${this.opts.baseUrl}${clean}`;
  }
}
