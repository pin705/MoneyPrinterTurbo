// Landing-page copy in every supported locale. Markup lives in
// components/Landing.astro; only translatable strings live here.
// Voice: plain, benefit-led, no jargon — written for everyday creators.

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
  mockup: { windowTitle: string; sample: string; script: string; generate: string };
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
  showcase: { kicker: string; title: string; desc: string };
  audience: {
    kicker: string;
    title: string;
    desc: string;
    items: { icon: "faceless" | "social" | "team" | "edu"; title: string; body: string }[];
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
    community: string;
    rights: string;
    made: string;
    links: {
      features: string;
      pricing: string;
      download: string;
    };
  };
}

export const landing: Record<Locale, LandingCopy> = {
  en: {
    htmlLang: "en",
    meta: {
      title: "Vidova — Make short videos with AI, right on your computer",
      description:
        "Type a topic and Vidova writes the words, picks the visuals, adds a voiceover and builds a finished short video for TikTok, Reels and Shorts. Free, and it all happens on your own computer.",
      ogDescription:
        "Type a topic, get a finished short video for TikTok, Reels and Shorts — made right on your computer. Free to use.",
    },
    nav: {
      features: "Features",
      how: "How it works",
      pricing: "Pricing",
      faq: "FAQ",
      download: "Download",
    },
    hero: {
      badge: "Free · works right on your computer",
      titleA: "Type a topic,",
      titleB: "get a short video.",
      lead: "Vidova writes the words, finds the visuals, adds a natural voiceover and captions, then puts it all together into a video that's ready to post on TikTok, Reels or Shorts. You just bring the idea.",
      ctaPrimary: "Download free",
      ctaSecondary: "View on GitHub",
      micro: "Works on macOS, Windows & Linux",
      osDetected: "You're on {name} · also available for the others",
    },
    mockup: {
      windowTitle: "Vidova — Create",
      sample: "5 morning habits that boost focus",
      script: "Write the script",
      generate: "Make video",
    },
    works: "Works with",
    features: {
      kicker: "Features",
      title: "Everything you need to make a short — in one app",
      desc: "From idea to a video you can post — one app does it all. No subscription, no charge per video.",
      hero: {
        title: "It all happens on your computer",
        body: "Your video is put together right on your own machine. No waiting in a queue, no server costs, and your content never gets sent anywhere.",
        metaLocal: "on your machine",
        metaFees: "hidden fees",
        metaRenders: "videos",
      },
      items: [
        { icon: "script", title: "AI writes the words", body: "Type a topic and get a ready-to-read script plus matching visual ideas — in seconds." },
        { icon: "voice", title: "Natural-sounding voiceover", body: "Dozens of lifelike voices in 15+ languages. Make it faster, slower, louder or softer." },
        { icon: "subtitle", title: "Eye-catching captions", body: "Words appear in time with the voice. Pick the font, color, outline and position you like." },
        { icon: "media", title: "Visuals & music included", body: "Vidova finds free-to-use clips and background music and drops them into your video for you." },
        { icon: "update", title: "Always up to date", body: "The app updates itself when there's something new — you're always on the latest version." },
      ],
    },
    how: {
      kicker: "How it works",
      title: "Four steps, done in a minute",
      desc: "From an idea to a video you can post — in under a minute.",
      steps: [
        { t: "Type a topic", d: "Or paste your own script." },
        { t: "Pick the style", d: "Shape, voice, captions, music." },
        { t: "Hit make", d: "The video is built on your computer." },
        { t: "Post it", d: "Download, or send straight to TikTok / Shorts." },
      ],
    },
    showcase: {
      kicker: "Made with Vidova",
      title: "Real videos, made in minutes",
      desc: "Every clip below was generated by Vidova from a single topic — script, voice, captions and footage, rendered locally.",
    },
    audience: {
      kicker: "Who it's for",
      title: "Made for people who post short videos often",
      desc: "If you post Shorts, Reels or TikToks regularly, Vidova handles the repetitive part so you can focus on the idea.",
      items: [
        { icon: "faceless", title: "Faceless channels", body: "Make quote, tip and story videos every day — no camera, no editing needed." },
        { icon: "social", title: "TikTok & Reels creators", body: "Keep a steady posting rhythm with consistent captions and voiceovers." },
        { icon: "team", title: "Marketers & small teams", body: "Turn out product and promo clips in batches on your own computer — no per-seat fees." },
        { icon: "edu", title: "Teachers & explainers", body: "Turn lessons and topics into clear, easy-to-follow videos in many languages." },
      ],
    },
    pricing: {
      kicker: "Pricing",
      title: "Making videos is free. You only pay for the AI.",
      desc: "Building videos is free forever because it runs on your computer. You only pay a small amount when AI writes the words — or plug in your own AI key and pay nothing.",
      free: {
        name: "Free",
        amount: "$0",
        sub: "Everything you need to start",
        features: ["Make unlimited videos", "Free AI credits to start", "All voices & caption styles", "Or use your own AI key"],
        cta: "Get the app",
      },
      paid: {
        tag: "Most popular",
        name: "Pay as you go",
        amount: "A few cents",
        sub: "For people who post regularly",
        features: ["AI ready to go — nothing to set up", "About one credit per video", "Credits never expire", "Top up whenever you want"],
        cta: "Start free, top up later",
      },
    },
    faq: {
      kicker: "FAQ",
      title: "Quick answers",
      items: [
        { q: "Is it really free?", a: "Yes. The app and making videos are free forever because it all runs on your computer. You only spend a little when you ask the AI to write the words — or use your own AI key and pay nothing." },
        { q: "Where are my videos made?", a: "Right on your own computer. No waiting in a queue, no server fees, and your content is never sent anywhere." },
        { q: "What am I paying for?", a: "Only the part where AI writes the words — about one credit per video, a few cents. Credits never expire, and you can use your own AI key to skip the cost entirely." },
        { q: "Which computers does it run on?", a: "macOS, Windows and Linux. The app keeps itself up to date on all of them." },
      ],
    },
    cta: {
      title: "Ready to make your first video?",
      desc: "Download Vidova and make your first short in a few minutes — free.",
      primary: "Download Vidova",
      secondary: "See pricing",
    },
    footer: {
      tagline: "Short videos with AI, made right on your computer.",
      product: "Product",
      community: "Community",
      rights: "All rights reserved.",
      made: "Made on your machine. Built for creators.",
      links: {
        features: "Features",
        pricing: "Pricing",
        download: "Download",
      },
    },
  },

  vi: {
    htmlLang: "vi",
    meta: {
      title: "Vidova — Làm video ngắn bằng AI, ngay trên máy bạn",
      description:
        "Gõ một chủ đề, Vidova tự viết lời, chọn hình, lồng tiếng và ghép thành video ngắn hoàn chỉnh để đăng TikTok, Reels, Shorts. Miễn phí, và mọi thứ chạy ngay trên máy của bạn.",
      ogDescription:
        "Gõ một chủ đề, có ngay video ngắn cho TikTok, Reels và Shorts — làm thẳng trên máy bạn. Miễn phí dùng.",
    },
    nav: {
      features: "Tính năng",
      how: "Cách dùng",
      pricing: "Bảng giá",
      faq: "Hỏi đáp",
      download: "Tải về",
    },
    hero: {
      badge: "Miễn phí · chạy thẳng trên máy bạn",
      titleA: "Gõ một chủ đề,",
      titleB: "có ngay video ngắn.",
      lead: "Vidova tự viết lời, tìm hình minh hoạ, lồng tiếng và thêm phụ đề, rồi ghép lại thành video sẵn sàng đăng TikTok, Reels hay Shorts. Bạn chỉ cần đưa ý tưởng.",
      ctaPrimary: "Tải miễn phí",
      ctaSecondary: "Xem trên GitHub",
      micro: "Dùng được trên macOS, Windows & Linux",
      osDetected: "Máy bạn dùng {name} · vẫn có cho các hệ khác",
    },
    mockup: {
      windowTitle: "Vidova — Tạo video",
      sample: "5 thói quen buổi sáng giúp tập trung",
      script: "Viết lời",
      generate: "Tạo video",
    },
    works: "Kết nối sẵn với",
    features: {
      kicker: "Tính năng",
      title: "Mọi thứ để làm video ngắn — gọn trong một app",
      desc: "Từ ý tưởng đến video đăng được — một app lo hết. Không thuê bao, không tính tiền theo từng video.",
      hero: {
        title: "Mọi thứ chạy trên máy bạn",
        body: "Video được dựng thẳng trên máy tính của bạn. Không phải xếp hàng chờ, không tốn phí máy chủ, và nội dung của bạn không bị gửi đi đâu cả.",
        metaLocal: "trên máy bạn",
        metaFees: "phí ẩn",
        metaRenders: "video",
      },
      items: [
        { icon: "script", title: "AI tự viết lời", body: "Gõ chủ đề là có ngay lời thoại và gợi ý hình ảnh đi kèm — chỉ trong vài giây." },
        { icon: "voice", title: "Giọng đọc như người thật", body: "Hàng chục giọng tự nhiên, hơn 15 ngôn ngữ. Chỉnh nhanh, chậm, to, nhỏ tuỳ ý." },
        { icon: "subtitle", title: "Phụ đề bắt mắt", body: "Chữ hiện theo lời nói. Tự chọn phông, màu, viền và vị trí theo ý bạn." },
        { icon: "media", title: "Sẵn hình & nhạc", body: "Vidova tự tìm clip minh hoạ và nhạc nền miễn phí bản quyền, ghép vào video cho bạn." },
        { icon: "update", title: "Luôn mới nhất", body: "App tự cập nhật khi có bản mới — bạn luôn dùng phiên bản mới nhất." },
      ],
    },
    how: {
      kicker: "Cách dùng",
      title: "Bốn bước, xong trong một phút",
      desc: "Từ ý tưởng đến video đăng được — chưa đầy một phút.",
      steps: [
        { t: "Gõ chủ đề", d: "Hoặc dán sẵn lời của bạn." },
        { t: "Chọn phong cách", d: "Khổ hình, giọng đọc, phụ đề, nhạc." },
        { t: "Bấm tạo", d: "Video được dựng ngay trên máy bạn." },
        { t: "Đăng thôi", d: "Tải về, hoặc đăng thẳng lên TikTok / Shorts." },
      ],
    },
    showcase: {
      kicker: "Tạo bằng Vidova",
      title: "Video thật, làm trong vài phút",
      desc: "Mỗi video dưới đây được Vidova tạo từ một chủ đề duy nhất — kịch bản, giọng đọc, phụ đề và tư liệu, render ngay trên máy.",
    },
    audience: {
      kicker: "Dành cho ai",
      title: "Hợp với người đăng video ngắn đều đặn",
      desc: "Nếu bạn đăng Shorts, Reels hay TikTok thường xuyên, Vidova lo phần việc lặp đi lặp lại để bạn chỉ tập trung vào ý tưởng.",
      items: [
        { icon: "faceless", title: "Kênh không lộ mặt", body: "Làm video trích dẫn, mẹo hay, kể chuyện mỗi ngày — không cần quay, không cần dựng." },
        { icon: "social", title: "Người làm TikTok & Reels", body: "Giữ lịch đăng đều đặn với phụ đề và giọng đọc đồng nhất." },
        { icon: "team", title: "Marketer & nhóm nhỏ", body: "Làm hàng loạt clip sản phẩm, quảng cáo ngay trên máy — không tốn phí theo người dùng." },
        { icon: "edu", title: "Giáo viên & nội dung giải thích", body: "Biến bài giảng, chủ đề thành video dễ hiểu, nhiều thứ tiếng." },
      ],
    },
    pricing: {
      kicker: "Bảng giá",
      title: "Làm video miễn phí. Chỉ trả tiền cho phần AI.",
      desc: "Dựng video miễn phí mãi mãi vì chạy trên máy bạn. Bạn chỉ trả một khoản nhỏ khi nhờ AI viết lời — hoặc cắm khoá AI riêng của bạn để khỏi trả gì.",
      free: {
        name: "Miễn phí",
        amount: "0₫",
        sub: "Đủ mọi thứ để bắt đầu",
        features: ["Làm video không giới hạn", "Tặng sẵn lượt AI để dùng thử", "Đủ giọng đọc & kiểu phụ đề", "Hoặc dùng khoá AI của bạn"],
        cta: "Tải app",
      },
      paid: {
        tag: "Phổ biến nhất",
        name: "Trả theo lượt dùng",
        amount: "Vài nghìn₫",
        sub: "Cho người đăng video đều đặn",
        features: ["AI sẵn sàng, không cần cài đặt", "Khoảng một lượt cho mỗi video", "Lượt không hết hạn", "Nạp thêm bất cứ lúc nào"],
        cta: "Dùng free, nạp sau",
      },
    },
    faq: {
      kicker: "Hỏi đáp",
      title: "Giải đáp nhanh",
      items: [
        { q: "Có miễn phí thật không?", a: "Có. App và việc làm video miễn phí mãi mãi vì mọi thứ chạy trên máy bạn. Bạn chỉ tốn một ít khi nhờ AI viết lời — hoặc dùng khoá AI riêng để khỏi trả gì." },
        { q: "Video được làm ở đâu?", a: "Ngay trên máy tính của bạn. Không phải xếp hàng chờ, không tốn phí máy chủ, và nội dung của bạn không bị gửi đi đâu." },
        { q: "Mình trả tiền cho phần nào?", a: "Chỉ cho phần AI viết lời — khoảng một lượt cho mỗi video, vài nghìn đồng. Lượt không hết hạn, và bạn có thể dùng khoá AI riêng để khỏi tốn." },
        { q: "Chạy được trên máy nào?", a: "macOS, Windows và Linux. App tự cập nhật trên mọi máy." },
      ],
    },
    cta: {
      title: "Sẵn sàng làm video đầu tiên?",
      desc: "Tải Vidova và làm video ngắn đầu tiên chỉ trong vài phút — miễn phí.",
      primary: "Tải Vidova",
      secondary: "Xem bảng giá",
    },
    footer: {
      tagline: "Video ngắn bằng AI, làm ngay trên máy bạn.",
      product: "Sản phẩm",
      community: "Cộng đồng",
      rights: "Bảo lưu mọi quyền.",
      made: "Dựng trên máy bạn. Làm cho người sáng tạo.",
      links: {
        features: "Tính năng",
        pricing: "Bảng giá",
        download: "Tải về",
      },
    },
  },
};
