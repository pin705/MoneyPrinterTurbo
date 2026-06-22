// UI option lists mirroring the Streamlit WebUI selectboxes (webui/Main.py).
import type { VideoAspect, VideoConcatMode, VideoTransitionMode } from "./video";

export interface Option<T> {
  value: T;
  /** i18n key — resolved at render time. */
  labelKey: string;
}

export const VIDEO_SOURCES: Option<string>[] = [
  { value: "pexels", labelKey: "Pexels" },
  { value: "pixabay", labelKey: "Pixabay" },
  { value: "coverr", labelKey: "Coverr" },
  { value: "local", labelKey: "Local file" },
];

export const VIDEO_ASPECTS: Option<VideoAspect>[] = [
  { value: "9:16", labelKey: "Portrait 9:16" },
  { value: "16:9", labelKey: "Landscape 16:9" },
  { value: "1:1", labelKey: "Square 1:1" },
];

export const CONCAT_MODES: Option<VideoConcatMode>[] = [
  { value: "sequential", labelKey: "Sequential" },
  { value: "random", labelKey: "Random (Recommended)" },
];

export const TRANSITION_MODES: Option<VideoTransitionMode>[] = [
  { value: null, labelKey: "None" },
  { value: "Shuffle", labelKey: "Shuffle" },
  { value: "FadeIn", labelKey: "FadeIn" },
  { value: "FadeOut", labelKey: "FadeOut" },
  { value: "SlideIn", labelKey: "SlideIn" },
  { value: "SlideOut", labelKey: "SlideOut" },
];

export const CLIP_DURATIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const VIDEO_COUNTS = [1, 2, 3, 4, 5] as const;

export const VOICE_VOLUMES = [0.6, 0.8, 1.0, 1.2, 1.5, 2.0, 3.0, 4.0, 5.0] as const;
export const VOICE_RATES = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5, 1.8, 2.0] as const;
export const BGM_VOLUMES = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] as const;

export const BGM_TYPES: Option<string>[] = [
  { value: "", labelKey: "No Background Music" },
  { value: "random", labelKey: "Random Background Music" },
  { value: "custom", labelKey: "Custom Background Music" },
];

export const SUBTITLE_POSITIONS: Option<string>[] = [
  { value: "top", labelKey: "Top" },
  { value: "center", labelKey: "Center" },
  { value: "bottom", labelKey: "Bottom (Recommended)" },
  { value: "custom", labelKey: "Custom position" },
];

/** Script-generation languages (webui/Main.py support_locales). */
export const SCRIPT_LANGUAGES = [
  { value: "", labelKey: "Auto Detect" },
  { value: "zh-CN", labelKey: "zh-CN" },
  { value: "zh-HK", labelKey: "zh-HK" },
  { value: "zh-TW", labelKey: "zh-TW" },
  { value: "de-DE", labelKey: "de-DE" },
  { value: "en-US", labelKey: "en-US" },
  { value: "fr-FR", labelKey: "fr-FR" },
  { value: "ru-RU", labelKey: "ru-RU" },
  { value: "vi-VN", labelKey: "vi-VN" },
  { value: "th-TH", labelKey: "th-TH" },
  { value: "tr-TR", labelKey: "tr-TR" },
];

/**
 * Curated common edge-tts voices (azure-tts-v1). value = backend voice_name.
 * The full dynamic list will come from a backend /voices endpoint later.
 */
export const COMMON_VOICES: Option<string>[] = [
  { value: "en-US-JennyNeural-Female", labelKey: "English (US) · Jenny ♀" },
  { value: "en-US-GuyNeural-Male", labelKey: "English (US) · Guy ♂" },
  { value: "en-US-AriaNeural-Female", labelKey: "English (US) · Aria ♀" },
  { value: "en-US-ChristopherNeural-Male", labelKey: "English (US) · Christopher ♂" },
  { value: "vi-VN-HoaiMyNeural-Female", labelKey: "Tiếng Việt · Hoài My ♀" },
  { value: "vi-VN-NamMinhNeural-Male", labelKey: "Tiếng Việt · Nam Minh ♂" },
  { value: "zh-CN-XiaoxiaoNeural-Female", labelKey: "中文 · 晓晓 ♀" },
  { value: "zh-CN-YunxiNeural-Male", labelKey: "中文 · 云希 ♂" },
  { value: "ja-JP-NanamiNeural-Female", labelKey: "日本語 · Nanami ♀" },
  { value: "ko-KR-SunHiNeural-Female", labelKey: "한국어 · SunHi ♀" },
  { value: "fr-FR-DeniseNeural-Female", labelKey: "Français · Denise ♀" },
  { value: "de-DE-KatjaNeural-Female", labelKey: "Deutsch · Katja ♀" },
  { value: "es-ES-ElviraNeural-Female", labelKey: "Español · Elvira ♀" },
  { value: "ru-RU-SvetlanaNeural-Female", labelKey: "Русский · Svetlana ♀" },
];

/** LLM providers (webui/Main.py). value = config key prefix. */
export const LLM_PROVIDERS: Option<string>[] = [
  { value: "openai", labelKey: "OpenAI" },
  { value: "deepseek", labelKey: "DeepSeek" },
  { value: "aihubmix", labelKey: "AIHubMix" },
  { value: "aimlapi", labelKey: "AIML API" },
  { value: "moonshot", labelKey: "Moonshot" },
  { value: "azure", labelKey: "Azure" },
  { value: "qwen", labelKey: "Qwen" },
  { value: "modelscope", labelKey: "ModelScope" },
  { value: "gemini", labelKey: "Gemini" },
  { value: "grok", labelKey: "Grok" },
  { value: "groq", labelKey: "Groq" },
  { value: "ollama", labelKey: "Ollama" },
  { value: "g4f", labelKey: "G4f" },
  { value: "oneapi", labelKey: "OneAPI" },
  { value: "cloudflare", labelKey: "Cloudflare" },
  { value: "ernie", labelKey: "ERNIE" },
  { value: "minimax", labelKey: "MiniMax" },
  { value: "mimo", labelKey: "MiMo" },
  { value: "pollinations", labelKey: "Pollinations" },
  { value: "litellm", labelKey: "LiteLLM" },
];

export interface ProviderDefault {
  baseUrl?: string;
  model?: string;
  /** Extra credential fields some providers require. */
  secretKey?: boolean;
  accountId?: boolean;
}

/** Per-provider hints (base url / model placeholders) for the settings UI. */
export const PROVIDER_DEFAULTS: Record<string, ProviderDefault> = {
  openai: { baseUrl: "(blank for official)", model: "gpt-4o-mini" },
  deepseek: { baseUrl: "https://api.deepseek.com", model: "deepseek-chat" },
  aihubmix: { baseUrl: "https://aihubmix.com/v1", model: "gpt-4o-mini" },
  aimlapi: { baseUrl: "https://api.aimlapi.com/v1", model: "openai/gpt-4o-mini" },
  moonshot: { baseUrl: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k" },
  azure: { baseUrl: "(blank)", model: "(deployment name)" },
  qwen: { baseUrl: "(blank)", model: "qwen-max" },
  modelscope: { baseUrl: "https://api-inference.modelscope.cn/v1/", model: "Qwen/Qwen3-32B" },
  gemini: { baseUrl: "(blank)", model: "gemini-1.5-flash" },
  grok: { baseUrl: "https://api.x.ai/v1", model: "grok-2" },
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  ollama: { baseUrl: "http://localhost:11434/v1", model: "qwen2.5:7b" },
  oneapi: { baseUrl: "(your gateway)", model: "gpt-4o-mini" },
  cloudflare: { model: "(model name)", accountId: true },
  ernie: { baseUrl: "(endpoint)", secretKey: true },
  mimo: { baseUrl: "https://api.xiaomimimo.com/v1", model: "mimo-v2.5-pro" },
  pollinations: { baseUrl: "https://text.pollinations.ai/openai", model: "openai-fast" },
  litellm: { baseUrl: "(optional)", model: "openai/gpt-4o" },
};
