// Vietnamese translations. Keys are the English source strings (natural keys);
// any string not listed here falls back to its English key.
export const vi: Record<string, string> = {
  // Header / status
  "Backend connected": "Đã kết nối backend",
  "Backend offline": "Backend offline",
  Settings: "Cài đặt",

  // Section titles
  Content: "Nội dung",
  Video: "Video",
  Audio: "Âm thanh",
  Subtitles: "Phụ đề",

  // Content panel
  "Video Subject": "Chủ đề video",
  "A keyword or topic — AI writes the script for you.":
    "Một từ khoá hoặc chủ đề — AI sẽ tự viết kịch bản.",
  "Script Language": "Ngôn ngữ kịch bản",
  "Advanced script settings": "Cài đặt kịch bản nâng cao",
  Paragraphs: "Số đoạn",
  "How many paragraphs the script should contain (1-10).":
    "Số đoạn của kịch bản (1-10).",
  "Custom requirements": "Yêu cầu tuỳ chỉnh",
  "Extra instructions, e.g. tone, audience, hook style.":
    "Hướng dẫn thêm: giọng văn, đối tượng, kiểu mở đầu.",
  "Use custom system prompt": "Dùng system prompt tuỳ chỉnh",
  "Generate Script & Keywords": "Sinh kịch bản & từ khoá",
  "Generating…": "Đang sinh…",
  "Video Script": "Kịch bản video",
  "Video Keywords": "Từ khoá video",
  "Optional. AI-generated or write your own. Good punctuation helps subtitles.":
    "Không bắt buộc. AI sinh hoặc tự viết. Dấu câu tốt giúp tạo phụ đề.",
  "English keywords, comma-separated. Used to find stock footage.":
    "Từ khoá tiếng Anh, ngăn cách bằng dấu phẩy. Dùng để tìm video stock.",

  // Video panel
  Source: "Nguồn",
  "Aspect ratio": "Tỉ lệ khung hình",
  "Concat mode": "Kiểu ghép",
  Transition: "Chuyển cảnh",
  "Clip duration (s)": "Độ dài mỗi clip (giây)",
  "Video count": "Số video",
  "Advanced video settings": "Cài đặt video nâng cao",
  "Match materials to script order": "Khớp tư liệu theo thứ tự kịch bản",

  // Audio panel
  Voice: "Giọng đọc",
  "Edge TTS voice. Match the language of your script.":
    "Giọng Edge TTS. Chọn khớp ngôn ngữ kịch bản.",
  "Voice volume": "Âm lượng giọng",
  "Voice rate": "Tốc độ giọng",
  "Background music": "Nhạc nền",
  "BGM volume": "Âm lượng nhạc nền",
  "Custom BGM file": "File nhạc nền tuỳ chỉnh",

  // Subtitle panel
  "Enable subtitles": "Bật phụ đề",
  "Font name": "Tên font",
  Position: "Vị trí",
  "Custom position (% from top)": "Vị trí tuỳ chỉnh (% từ trên)",
  "Font color": "Màu chữ",
  "Stroke color": "Màu viền",
  "Font size": "Cỡ chữ",
  "Stroke width": "Độ dày viền",
  "Subtitle background": "Nền phụ đề",
  "Background color": "Màu nền",
  "Rounded translucent background": "Nền bo tròn mờ",

  // Generate panel
  "Generate Video": "Tạo Video",
  "View results": "Xem kết quả",
  "Render runs locally · LLM via your configured provider":
    "Render chạy local · LLM qua nhà cung cấp bạn cấu hình",
  "Generating script…": "Đang sinh kịch bản…",
  "Synthesizing audio…": "Đang tổng hợp giọng…",
  "Downloading materials…": "Đang tải tư liệu…",
  "Rendering video…": "Đang render video…",
  "Generation failed — check backend logs":
    "Tạo thất bại — kiểm tra log backend",
  "Your video is ready 🎬": "Video của bạn đã sẵn sàng 🎬",
  "Preview and download below.": "Xem trước và tải xuống bên dưới.",
  Download: "Tải xuống",
  "Auto Detect": "Tự động nhận diện",
  "Local file": "File trên máy",
  "Random (Recommended)": "Ngẫu nhiên (Khuyến nghị)",
  Sequential: "Tuần tự",
  None: "Không",
  "No Background Music": "Không nhạc nền",
  "Random Background Music": "Nhạc nền ngẫu nhiên",
  "Custom Background Music": "Nhạc nền tuỳ chỉnh",
  Top: "Trên",
  Center: "Giữa",
  "Bottom (Recommended)": "Dưới (Khuyến nghị)",
  "Custom position": "Vị trí tuỳ chỉnh",
  "A font file under resource/fonts. Leave default if unsure.":
    "File font trong resource/fonts. Để mặc định nếu không chắc.",
  "Add a video subject or a script first":
    "Hãy nhập chủ đề hoặc kịch bản trước",
  "Could not start generation": "Không thể bắt đầu tạo video",
  "Script & keywords generated": "Đã sinh kịch bản & từ khoá",
  "Generation failed": "Tạo thất bại",

  // Settings dialog
  "Stored in the backend's config.toml on this machine.":
    "Lưu trong config.toml của backend trên máy này.",
  "AI / LLM": "AI / LLM",
  Media: "Tư liệu",
  Connection: "Kết nối",
  "Loading config…": "Đang tải cấu hình…",
  "Could not reach the backend. Check the Connection tab.":
    "Không kết nối được backend. Kiểm tra tab Kết nối.",
  "LLM provider": "Nhà cung cấp LLM",
  "API key": "API key",
  "Base URL": "Base URL",
  Model: "Model",
  "Secret key": "Secret key",
  "Account ID": "Account ID",
  "Pexels API key": "Pexels API key",
  "Pixabay API key": "Pixabay API key",
  "Coverr API key": "Coverr API key",
  "Backend URL": "Backend URL",
  Cancel: "Huỷ",
  Save: "Lưu",
  "Settings saved": "Đã lưu cài đặt",
  "Save failed": "Lưu thất bại",
  "Render runs locally. Managed accounts & a credit system are on the roadmap.":
    "Render chạy local. Tài khoản quản lý & hệ thống credit đang trong lộ trình.",

  // Navigation + library
  Create: "Tạo video",
  Library: "Thư viện",
  "Create a video": "Tạo video",
  "Topic in, finished short video out — rendered on your machine.":
    "Nhập chủ đề, nhận video ngắn hoàn chỉnh — render trên máy bạn.",
  "Your generated videos": "Video bạn đã tạo",
  Refresh: "Làm mới",
  "New video": "Video mới",
  "Loading…": "Đang tải…",
  "No videos yet": "Chưa có video nào",
  "Create your first video to see it here.":
    "Tạo video đầu tiên để thấy ở đây.",
  Complete: "Hoàn thành",
  Failed: "Thất bại",
  Processing: "Đang xử lý",
  Delete: "Xoá",
  "Video deleted": "Đã xoá video",
  "Delete failed": "Xoá thất bại",
  Previous: "Trước",
  Next: "Sau",
  Page: "Trang",
  videos: "video",
  "Search…": "Tìm…",
  "Search voice…": "Tìm giọng…",
  "Search provider…": "Tìm nhà cung cấp…",
};
