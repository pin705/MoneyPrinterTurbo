// Landing-page copy in every supported locale. Markup lives in
// components/Landing.astro; only translatable strings live here.

export const LOCALES = ["en", "vi"] as const;
export type Locale = (typeof LOCALES)[number];

export interface Feature {
  icon: "script" | "voice" | "subtitle" | "media" | "update";
  title: string;
  body: string;
}

export interface LandingCopy {
  htmlLang: string;
  meta: { title: string; description: string; ogDescription: string };
  nav: {
    features: string;
    how: string;
    pricing: string;
    faq: string;
    download: string;
  };
  hero: {
    badge: string;
    titleA: string;
    titleB: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    micro: string;
    osDetected: string; // uses {name}
  };
  mockup: { script: string; generate: string };
  works: string;
  features: {
    kicker: string;
    title: string;
    desc: string;
    hero: {
      title: string;
      body: string;
      metaLocal: string;
      metaFees: string;
      metaRenders: string;
    };
    items: Feature[];
  };
  how: {
    kicker: string;
    title: string;
    desc: string;
    steps: { t: string; d: string }[];
  };
  pricing: {
    kicker: string;
    title: string;
    desc: string;
    free: { name: string; amount: string; sub: string; features: string[]; cta: string };
    paid: { tag: string; name: string; amount: string; sub: string; features: string[]; cta: string };
  };
  faq: { kicker: string; title: string; items: { q: string; a: string }[] };
  cta: { title: string; desc: string; primary: string; secondary: string };
  footer: {
    tagline: string;
    product: string;
    legal: string;
    community: string;
    rights: string;
    made: string;
    links: {
      features: string;
      pricing: string;
      download: string;
      terms: string;
      privacy: string;
      refund: string;
    };
  };
}

export const landing: Record<Locale, LandingCopy> = {
  en: {
    htmlLang: "en",
    meta: {
      title: "Vidova — AI short videos, rendered on your machine",
      description:
        "Turn a topic into a finished short video — script, voiceover, subtitles and stock footage. Renders locally, free to use, with a small credit top-up for AI.",
      ogDescription:
        "Type a topic, get a finished short video — rendered locally on your machine. Free app; pay only small credits for the AI text.",
    },
    nav: {
      features: "Features",
      how: "How it works",
      pricing: "Pricing",
      faq: "FAQ",
      download: "Download",
    },
    hero: {
      badge: "Free desktop app · renders locally",
      titleA: "Turn a topic into a",
      titleB: "short video.",
      lead: "Vidova writes the script, finds the footage, voices it, adds subtitles and renders a ready-to-post video — right on your machine. You only pay a few credits for the AI text.",
      ctaPrimary: "Download free",
      ctaSecondary: "View source",
      micro: "Available for macOS, Windows & Linux",
      osDetected: "Detected {name} · also on the other platforms",
    },
    mockup: { script: "Generate Script", generate: "Generate Video" },
    works: "Works with",
    features: {
      kicker: "Features",
      title: "Everything you need to ship Shorts",
      desc: "From script to publish — one tool does it all. No subscriptions, no per-video fees.",
      hero: {
        title: "Renders on your machine",
        body: "ffmpeg + MoviePy run locally. No render queues, no per-video server fees, and your footage never leaves your computer.",
        metaLocal: "local",
        metaFees: "server fees",
        metaRenders: "renders",
      },
      items: [
        { icon: "script", title: "AI script & keywords", body: "Type a topic — get a narration script and stock-footage search terms in seconds." },
        { icon: "voice", title: "Lifelike voiceover", body: "Dozens of Edge TTS voices across 15+ languages, with adjustable rate & volume." },
        { icon: "subtitle", title: "Styled subtitles", body: "Fonts, colors, outline, position and translucent backgrounds — fully tunable." },
        { icon: "media", title: "Stock + music", body: "Pexels, Pixabay & Coverr footage plus royalty-free background music, built in." },
        { icon: "update", title: "Auto-updates", body: "The app updates itself when a new version ships. Always on the latest." },
      ],
    },
    how: {
      kicker: "How it works",
      title: "Four steps, one minute of setup",
      desc: "From idea to published video in under 60 seconds.",
      steps: [
        { t: "Enter a topic", d: "Or paste your own script." },
        { t: "Pick a look", d: "Aspect, voice, subtitles, music." },
        { t: "Generate", d: "Renders locally on your machine." },
        { t: "Publish", d: "Download or post to TikTok / Shorts." },
      ],
    },
    pricing: {
      kicker: "Pricing",
      title: "Free to render. Credits only for AI.",
      desc: "Rendering is free forever — it runs on your computer. Credits cover the AI that writes scripts & keywords (pennies per video).",
      free: {
        name: "Free",
        amount: "$0",
        sub: "Get started with local rendering",
        features: ["Unlimited local rendering", "Starter AI credits", "All voices & subtitle styles", "Or bring your own API key"],
        cta: "Get the app",
      },
      paid: {
        tag: "Best value",
        name: "Credit top-up",
        amount: "from $5",
        sub: "For users who create regularly",
        features: ["Managed DeepSeek — no key setup", "~1 credit per video script", "Credits never expire", "Top up whenever you want"],
        cta: "Start free, top up later",
      },
    },
    faq: {
      kicker: "FAQ",
      title: "Questions, answered",
      items: [
        { q: "Is it really free?", a: "The app and local rendering are free forever — they run on your own machine. You only spend a few credits when the AI writes a script, or you can plug in your own API key and pay nothing." },
        { q: "Where do my videos render?", a: "On your computer, via ffmpeg + MoviePy. There are no render queues and no per-video server fees, and your footage never leaves your machine." },
        { q: "What do credits cover?", a: "Only the managed AI text generation (DeepSeek) — roughly one credit per video script. Credits never expire, and you can bring your own key to skip them entirely." },
        { q: "Which platforms are supported?", a: "macOS (Apple Silicon & Intel), Windows 10/11, and Linux (AppImage / .deb). The app auto-updates on every platform." },
      ],
    },
    cta: {
      title: "Ready to create?",
      desc: "Download Vidova and make your first short video in minutes — free.",
      primary: "Download Vidova",
      secondary: "See pricing",
    },
    footer: {
      tagline: "AI short videos, rendered on your machine.",
      product: "Product",
      legal: "Legal",
      community: "Community",
      rights: "All rights reserved.",
      made: "Rendered locally. Built for creators.",
      links: {
        features: "Features",
        pricing: "Pricing",
        download: "Download",
        terms: "Terms",
        privacy: "Privacy",
        refund: "Refund",
      },
    },
  },

  vi: {
    htmlLang: "vi",
    meta: {
      title: "Vidova — Video ngắn AI, render ngay trên máy bạn",
      description:
        "Biến một chủ đề thành video ngắn hoàn chỉnh — kịch bản, lồng tiếng, phụ đề và footage. Render tại máy, miễn phí dùng, chỉ tốn ít credit cho phần AI.",
      ogDescription:
        "Nhập chủ đề, nhận video ngắn hoàn chỉnh — render ngay trên máy bạn. Ứng dụng miễn phí; chỉ trả ít credit cho phần văn bản AI.",
    },
    nav: {
      features: "Tính năng",
      how: "Cách hoạt động",
      pricing: "Bảng giá",
      faq: "Hỏi đáp",
      download: "Tải về",
    },
    hero: {
      badge: "Ứng dụng desktop miễn phí · render tại máy",
      titleA: "Biến chủ đề thành",
      titleB: "video ngắn.",
      lead: "Vidova viết kịch bản, tìm footage, lồng tiếng, thêm phụ đề và render video sẵn sàng đăng — ngay trên máy bạn. Bạn chỉ trả vài credit cho phần văn bản AI.",
      ctaPrimary: "Tải miễn phí",
      ctaSecondary: "Xem mã nguồn",
      micro: "Có cho macOS, Windows & Linux",
      osDetected: "Phát hiện {name} · cũng có trên các nền tảng khác",
    },
    mockup: { script: "Tạo kịch bản", generate: "Tạo video" },
    works: "Hoạt động với",
    features: {
      kicker: "Tính năng",
      title: "Mọi thứ để xuất bản video ngắn",
      desc: "Từ kịch bản đến đăng tải — một công cụ làm tất cả. Không thuê bao, không phí theo video.",
      hero: {
        title: "Render ngay trên máy bạn",
        body: "ffmpeg + MoviePy chạy tại máy. Không hàng đợi render, không phí server theo video, và footage không bao giờ rời máy bạn.",
        metaLocal: "tại máy",
        metaFees: "phí server",
        metaRenders: "lượt render",
      },
      items: [
        { icon: "script", title: "Kịch bản & từ khoá AI", body: "Nhập chủ đề — nhận ngay kịch bản lồng tiếng và từ khoá tìm footage trong vài giây." },
        { icon: "voice", title: "Lồng tiếng như thật", body: "Hàng chục giọng Edge TTS qua hơn 15 ngôn ngữ, chỉnh tốc độ & âm lượng." },
        { icon: "subtitle", title: "Phụ đề tuỳ biến", body: "Font, màu, viền, vị trí và nền mờ — tuỳ chỉnh hoàn toàn." },
        { icon: "media", title: "Footage + nhạc", body: "Footage Pexels, Pixabay & Coverr cùng nhạc nền bản quyền, tích hợp sẵn." },
        { icon: "update", title: "Tự động cập nhật", body: "Ứng dụng tự cập nhật khi có phiên bản mới. Luôn mới nhất." },
      ],
    },
    how: {
      kicker: "Cách hoạt động",
      title: "Bốn bước, một phút cài đặt",
      desc: "Từ ý tưởng đến video xuất bản trong chưa đầy 60 giây.",
      steps: [
        { t: "Nhập chủ đề", d: "Hoặc dán kịch bản của bạn." },
        { t: "Chọn phong cách", d: "Tỉ lệ, giọng đọc, phụ đề, nhạc." },
        { t: "Tạo video", d: "Render ngay trên máy bạn." },
        { t: "Xuất bản", d: "Tải về hoặc đăng lên TikTok / Shorts." },
      ],
    },
    pricing: {
      kicker: "Bảng giá",
      title: "Render miễn phí. Credit chỉ cho AI.",
      desc: "Render miễn phí mãi mãi — chạy trên máy bạn. Credit chỉ trả cho AI viết kịch bản & từ khoá (vài xu mỗi video).",
      free: {
        name: "Miễn phí",
        amount: "$0",
        sub: "Bắt đầu với render tại máy",
        features: ["Render tại máy không giới hạn", "Credit AI khởi điểm", "Mọi giọng đọc & kiểu phụ đề", "Hoặc dùng API key của bạn"],
        cta: "Tải ứng dụng",
      },
      paid: {
        tag: "Đáng giá nhất",
        name: "Nạp credit",
        amount: "từ $5",
        sub: "Cho người tạo video thường xuyên",
        features: ["DeepSeek quản lý — không cần cài key", "~1 credit mỗi kịch bản", "Credit không hết hạn", "Nạp bất cứ lúc nào"],
        cta: "Dùng free, nạp sau",
      },
    },
    faq: {
      kicker: "Hỏi đáp",
      title: "Giải đáp thắc mắc",
      items: [
        { q: "Có thật sự miễn phí?", a: "Ứng dụng và render tại máy miễn phí mãi mãi — chạy trên máy bạn. Bạn chỉ tốn vài credit khi AI viết kịch bản, hoặc cắm API key của bạn để không trả gì." },
        { q: "Video render ở đâu?", a: "Trên máy tính của bạn, qua ffmpeg + MoviePy. Không hàng đợi render, không phí server theo video, và footage không rời máy bạn." },
        { q: "Credit dùng cho gì?", a: "Chỉ cho phần AI tạo văn bản (DeepSeek) — khoảng một credit mỗi kịch bản. Credit không hết hạn, và bạn có thể tự dùng key để bỏ qua hoàn toàn." },
        { q: "Hỗ trợ nền tảng nào?", a: "macOS (Apple Silicon & Intel), Windows 10/11, và Linux (AppImage / .deb). Ứng dụng tự cập nhật trên mọi nền tảng." },
      ],
    },
    cta: {
      title: "Sẵn sàng sáng tạo?",
      desc: "Tải Vidova và làm video ngắn đầu tiên trong vài phút — miễn phí.",
      primary: "Tải Vidova",
      secondary: "Xem bảng giá",
    },
    footer: {
      tagline: "Video ngắn AI, render ngay trên máy bạn.",
      product: "Sản phẩm",
      legal: "Pháp lý",
      community: "Cộng đồng",
      rights: "Bảo lưu mọi quyền.",
      made: "Render tại máy. Dành cho người sáng tạo.",
      links: {
        features: "Tính năng",
        pricing: "Bảng giá",
        download: "Tải về",
        terms: "Điều khoản",
        privacy: "Bảo mật",
        refund: "Hoàn tiền",
      },
    },
  },
};
