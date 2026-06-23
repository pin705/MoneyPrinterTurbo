// Vietnamese translations. Keys are the English source strings (natural keys);
// any string not listed here falls back to its English key.
// Voice: plain, friendly Vietnamese — avoid dev jargon (backend, render, LLM…).
export const vi: Record<string, string> = {
  // Header / status
  "Backend connected": "Đã kết nối",
  "Backend offline": "Mất kết nối",
  Settings: "Cài đặt",
  "Light mode": "Giao diện sáng",
  "Dark mode": "Giao diện tối",
  "Toggle sidebar": "Ẩn/hiện thanh bên",
  Studio: "Studio",
  Step: "Bước",

  // Section titles
  Content: "Nội dung",
  Video: "Video",
  Audio: "Âm thanh",
  Subtitles: "Phụ đề",

  // Content panel
  "Video Subject": "Chủ đề video",
  "A keyword or topic — AI writes the script for you.":
    "Một từ khoá hoặc chủ đề — AI sẽ tự viết lời cho bạn.",
  "Script Language": "Ngôn ngữ lời thoại",
  "Advanced script settings": "Tuỳ chọn nâng cao",
  Paragraphs: "Số đoạn",
  "How many paragraphs the script should contain (1-10).":
    "Lời thoại gồm bao nhiêu đoạn (1–10).",
  "Custom requirements": "Yêu cầu riêng",
  "Extra instructions, e.g. tone, audience, hook style.":
    "Hướng dẫn thêm cho AI: giọng văn, đối tượng, kiểu mở đầu…",
  // Placeholders
  "e.g. 5 morning habits that boost focus":
    "vd: 5 thói quen buổi sáng giúp tập trung",
  "e.g. lighter tone, TikTok style, suspenseful opening":
    "vd: giọng nhẹ nhàng, kiểu TikTok, mở đầu gây tò mò",
  "The narration text for your video…": "Lời thoại cho video của bạn…",
  "morning routine, sunrise, productivity":
    "thói quen buổi sáng, bình minh, năng suất",
  "filename in resource/songs": "tên file trong thư mục resource/songs",
  "Use custom system prompt": "Tự đặt chỉ dẫn cho AI",
  "Generate Script & Keywords": "Viết lời & từ khoá",
  "Generating…": "Đang tạo…",
  "Video Script": "Lời thoại",
  "Video Keywords": "Từ khoá tìm hình",
  "Optional. AI-generated or write your own. Good punctuation helps subtitles.":
    "Không bắt buộc. Để AI viết hoặc tự nhập. Dấu câu rõ ràng giúp phụ đề chính xác hơn.",
  "English keywords, comma-separated. Used to find stock footage.":
    "Từ khoá tiếng Anh, cách nhau bằng dấu phẩy. Dùng để tìm clip minh hoạ.",

  // Video panel
  Source: "Nguồn hình",
  "Aspect ratio": "Tỉ lệ khung hình",
  "Concat mode": "Kiểu ghép cảnh",
  Transition: "Chuyển cảnh",
  "Clip duration (s)": "Độ dài mỗi cảnh (giây)",
  "Video count": "Số video tạo ra",
  "Advanced video settings": "Tuỳ chọn nâng cao",
  "Match materials to script order": "Xếp hình theo đúng thứ tự lời thoại",

  // Audio panel
  Voice: "Giọng đọc",
  "Edge TTS voice. Match the language of your script.":
    "Chọn giọng đọc cùng ngôn ngữ với lời thoại.",
  "Voice volume": "Âm lượng giọng",
  "Voice rate": "Tốc độ đọc",
  "Background music": "Nhạc nền",
  "BGM volume": "Âm lượng nhạc nền",
  "Custom BGM file": "File nhạc nền riêng",

  // Subtitle panel
  "Enable subtitles": "Bật phụ đề",
  "Font name": "Phông chữ",
  Position: "Vị trí",
  "Custom position (% from top)": "Vị trí tuỳ chỉnh (% tính từ trên)",
  "Font color": "Màu chữ",
  "Stroke color": "Màu viền chữ",
  "Font size": "Cỡ chữ",
  "Stroke width": "Độ dày viền",
  "Subtitle background": "Nền phụ đề",
  "Background color": "Màu nền",
  "Rounded translucent background": "Nền mờ bo tròn",

  // Generate / preview
  "Generate Video": "Tạo video",
  Preview: "Xem trước",
  Count: "Số lượng",
  Auto: "Tự động",
  "Your topic here": "Chủ đề của bạn",
  "Renders locally on your machine": "Dựng ngay trên máy bạn",
  "View results": "Xem kết quả",
  "Render runs locally · LLM via your configured provider":
    "Dựng video trên máy bạn · AI dùng nhà cung cấp bạn đã chọn",
  "Generating script…": "Đang viết lời…",
  "Synthesizing audio…": "Đang tạo giọng đọc…",
  "Downloading materials…": "Đang tải hình ảnh…",
  "Rendering video…": "Đang dựng video…",
  "Generation failed — check backend logs":
    "Tạo video thất bại — xem nhật ký để biết chi tiết",
  "Your video is ready": "Video của bạn đã xong 🎬",
  "Preview and download below.": "Xem trước và tải về bên dưới.",
  Download: "Tải về",
  "Auto Detect": "Tự động nhận diện",
  "Local file": "File trên máy",
  "Random (Recommended)": "Ngẫu nhiên (Khuyên dùng)",
  Sequential: "Lần lượt",
  None: "Không",
  "No Background Music": "Không có nhạc nền",
  "Random Background Music": "Nhạc nền ngẫu nhiên",
  "Custom Background Music": "Nhạc nền riêng",
  Top: "Trên",
  Center: "Giữa",
  "Bottom (Recommended)": "Dưới (Khuyên dùng)",
  "Custom position": "Tuỳ chỉnh",
  "A font file under resource/fonts. Leave default if unsure.":
    "File phông trong thư mục resource/fonts. Không chắc thì để mặc định.",
  "Add a video subject or a script first":
    "Hãy nhập chủ đề hoặc lời thoại trước đã",
  "Could not start generation": "Chưa thể bắt đầu tạo video",
  "Script & keywords generated": "Đã viết xong lời & từ khoá",
  "Generation failed": "Tạo video thất bại",

  // Settings dialog
  "Stored in the backend's config.toml on this machine.":
    "Được lưu trong file cấu hình của ứng dụng trên máy này.",
  "AI / LLM": "AI",
  Media: "Hình & nhạc",
  Connection: "Kết nối",
  "Loading config…": "Đang tải cấu hình…",
  "Could not reach the backend. Check the Connection tab.":
    "Không kết nối được. Kiểm tra tab Kết nối.",
  "LLM provider": "Nhà cung cấp AI",
  "API key": "API key",
  "Base URL": "Base URL",
  Model: "Model",
  "Secret key": "Secret key",
  "Account ID": "Account ID",
  "Pexels API key": "Pexels API key",
  "Pixabay API key": "Pixabay API key",
  "Coverr API key": "Coverr API key",
  "Backend URL": "Địa chỉ máy chủ",
  Cancel: "Huỷ",
  Save: "Lưu",
  "Settings saved": "Đã lưu cài đặt",
  "Save failed": "Lưu thất bại",
  "Render runs locally. Managed accounts & a credit system are on the roadmap.":
    "Video được dựng trên máy bạn. Tài khoản và hệ thống credit đang được phát triển.",

  // Navigation + library
  Create: "Tạo video",
  Library: "Thư viện",
  "Create a video": "Tạo video",
  "Topic in, finished short video out — rendered on your machine.":
    "Nhập chủ đề, nhận video ngắn hoàn chỉnh — dựng ngay trên máy bạn.",
  "Your generated videos": "Các video bạn đã tạo",
  Refresh: "Làm mới",
  "New video": "Video mới",
  "Loading…": "Đang tải…",
  "No videos yet": "Chưa có video nào",
  "Create your first video to see it here.":
    "Tạo video đầu tiên để thấy ở đây.",
  "No script": "Chưa có lời thoại",
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
  "Search voice…": "Tìm giọng đọc…",
  "Search provider…": "Tìm nhà cung cấp…",

  // Wizard
  "Video & Audio": "Hình & Âm thanh",
  Review: "Xem lại",
  Back: "Quay lại",
  On: "Bật",
  Off: "Tắt",

  // Content plan (Giai đoạn 1)
  "Content plan": "Kế hoạch nội dung",
  "Turn a niche into a batch of distinct video ideas":
    "Biến một ngách thành loạt ý tưởng video khác nhau",
  "What do you make videos about?": "Bạn làm video về chủ đề gì?",
  Niche: "Ngách",
  "The topic area of your channel.": "Lĩnh vực kênh của bạn.",
  "e.g. personal finance for beginners": "vd: tài chính cá nhân cho người mới",
  Audience: "Đối tượng",
  "e.g. Gen Z in Vietnam, new to investing": "vd: Gen Z Việt Nam, mới tập đầu tư",
  "How many ideas": "Số ý tưởng",
  Tone: "Giọng điệu",
  "e.g. punchy": "vd: dứt khoát",
  "Extra focus": "Tập trung thêm",
  "Optional. Steer the ideas toward something specific.":
    "Không bắt buộc. Hướng ý tưởng vào điều cụ thể.",
  "e.g. focus on saving habits and budgeting apps":
    "vd: tập trung thói quen tiết kiệm và app quản lý chi tiêu",
  "Generate ideas": "Tạo ý tưởng",
  "Each idea is a different angle — pick the ones you like.":
    "Mỗi ý tưởng một góc nhìn khác nhau — chọn cái bạn thích.",
  "No ideas yet": "Chưa có ý tưởng nào",
  "Fill in your niche and audience, then generate a batch of ideas.":
    "Nhập ngách và đối tượng, rồi tạo một loạt ý tưởng.",
  ideas: "ý tưởng",
  selected: "đã chọn",
  "Select all": "Chọn tất cả",
  "Deselect all": "Bỏ chọn tất cả",
  Make: "Tạo",
  "Your plan makes up to {{n}} per batch — extras will wait.":
    "Gói của bạn tạo tối đa {{n}} mỗi lần — phần dư sẽ chờ.",
  "Couldn't generate ideas — try again": "Chưa tạo được ý tưởng — thử lại nhé",

  // Library v2 (folders / quản lý)
  "All videos": "Tất cả video",
  Unsorted: "Chưa phân loại",
  Folders: "Thư mục",
  "New folder": "Thư mục mới",
  "New folder…": "Thư mục mới…",
  "Folder name": "Tên thư mục",
  "No folders yet": "Chưa có thư mục",
  Rename: "Đổi tên",
  "Delete folder “{{name}}”? Videos stay in the library.":
    "Xoá thư mục “{{name}}”? Video vẫn còn trong thư viện.",
  "Search videos…": "Tìm video…",
  All: "Tất cả",
  Done: "Xong",
  Newest: "Mới nhất",
  Oldest: "Cũ nhất",
  Grid: "Lưới",
  List: "Danh sách",
  Clear: "Bỏ chọn",
  "Move to": "Chuyển vào",
  Move: "Chuyển",
  "Remove from folder": "Bỏ khỏi thư mục",
  "Moved to {{name}}": "Đã chuyển vào {{name}}",
  "Removed from folder": "Đã bỏ khỏi thư mục",
  Select: "Chọn",
  "Deleted {{n}} videos": "Đã xoá {{n}} video",
  "Delete {{n}} videos? This can't be undone.":
    "Xoá {{n}} video? Không thể hoàn tác.",
  "Load more": "Tải thêm",
  "No matches": "Không có kết quả",
  "Try a different folder, status or search.":
    "Thử thư mục, trạng thái hoặc từ khoá khác.",

  // Navigation / account
  Account: "Tài khoản",
  Dashboard: "Tổng quan",
  Billing: "Thanh toán",
  "Sign in": "Đăng nhập",

  // Placeholder pages
  "Coming soon": "Sắp ra mắt",
  "Planned for {{phase}}": "Dự kiến: {{phase}}",
  "Your credit balance, plan and usage at a glance.":
    "Số dư credit, gói và mức dùng — gói gọn một màn hình.",
  "Plans, SePay checkout, credit top-ups and invoices.":
    "Các gói, thanh toán SePay, nạp credit và hoá đơn.",
  "Profile, password, language and account deletion.":
    "Hồ sơ, mật khẩu, ngôn ngữ và xoá tài khoản.",
  "Sign in to sync credits and manage your subscription.":
    "Đăng nhập để đồng bộ credit và quản lý gói.",
  "Page not found": "Không tìm thấy trang",
  "The page you're looking for doesn't exist.":
    "Trang bạn tìm không tồn tại.",

  // Auth / login
  "Sign in to Vidova": "Đăng nhập Vidova",
  "Sync credits and manage your subscription.":
    "Đồng bộ credit và quản lý gói đăng ký.",
  Email: "Email",
  Password: "Mật khẩu",
  Continue: "Tiếp tục",
  "Continue with Google": "Tiếp tục với Google",
  or: "hoặc",
  "Create account": "Tạo tài khoản",
  "Create one": "Tạo tài khoản",
  "No account?": "Chưa có tài khoản?",
  "Already have an account?": "Đã có tài khoản?",
  "Check your email": "Kiểm tra email",
  "We sent a confirmation link to {{email}}. Click it to activate your account.":
    "Đã gửi liên kết xác nhận tới {{email}}. Bấm vào đó để kích hoạt tài khoản.",
  "Back to sign in": "Quay lại đăng nhập",
  "Dev sign-in — set VITE_SUPABASE_URL/ANON_KEY for real auth.":
    "Đăng nhập dev — đặt VITE_SUPABASE_URL/ANON_KEY để dùng auth thật.",
  "Dev sign-in — Google/email auth wires in with Supabase.":
    "Đăng nhập dev — đăng nhập Google/email cắm qua Supabase.",

  // Dashboard
  "Your credits, plan and what's unlocked":
    "Credit, gói và quyền lợi của bạn",
  "Upgrade / Buy credits": "Nâng cấp / Mua credit",
  "Couldn't reach the cloud backend": "Không kết nối được máy chủ",
  "Start the cloud service or check VITE_CLOUD_BASE_URL.":
    "Hãy khởi động dịch vụ hoặc kiểm tra lại kết nối (VITE_CLOUD_BASE_URL).",
  Retry: "Thử lại",
  "Session not authorized": "Phiên đăng nhập không hợp lệ",
  "Your session is invalid, or the cloud's SUPABASE_JWT_SECRET doesn't match your Supabase project. Sign in again or fix the secret.":
    "Phiên đăng nhập không hợp lệ, hoặc SUPABASE_JWT_SECRET của máy chủ không khớp project Supabase. Hãy đăng nhập lại hoặc sửa lại secret.",
  "Sign in again": "Đăng nhập lại",
  "Credit balance": "Số dư credit",
  "Buy more": "Mua thêm",
  "Current plan": "Gói hiện tại",
  Renews: "Gia hạn",
  "Batch limit": "Giới hạn mỗi lần",
  "videos per batch": "video mỗi lần",
  "What's unlocked": "Quyền lợi đã mở",
  "No watermark": "Không có watermark",
  "Up to": "Tối đa",
  "All voices": "Tất cả giọng đọc",
  "Scheduled posting": "Đăng theo lịch",
  "Cloud library": "Thư viện trên cloud",
  "API access": "Truy cập API",
  Free: "Miễn phí",
  credits: "credit",

  // Settings
  "Profile, language and account": "Hồ sơ, ngôn ngữ và tài khoản",
  Profile: "Hồ sơ",
  "Signed in": "Đã đăng nhập",
  "Sign out": "Đăng xuất",
  Language: "Ngôn ngữ",
  "Danger zone": "Vùng nguy hiểm",
  "Permanently delete your account and data.":
    "Xoá vĩnh viễn tài khoản và dữ liệu của bạn.",
  "Delete account": "Xoá tài khoản",
  "Account deletion is handled by support for now.":
    "Việc xoá tài khoản hiện do bộ phận hỗ trợ xử lý.",

  // Billing / pricing
  "Plans and credit top-ups": "Các gói và nạp credit",
  Monthly: "Hàng tháng",
  Yearly: "Hàng năm",
  "-17%": "-17%",
  "Credit top-ups": "Nạp credit",
  Buy: "Mua",
  Invoices: "Hoá đơn",
  "Couldn't load plans. Is the cloud backend running?":
    "Không tải được gói. Máy chủ đã chạy chưa?",
  Popular: "Phổ biến",
  yr: "năm",
  mo: "tháng",
  "credits/mo": "credit/tháng",
  Batch: "Mỗi lần",
  "Free forever": "Miễn phí mãi mãi",
  Choose: "Chọn",
  "Scan to pay with SePay": "Quét mã để thanh toán bằng SePay",
  "Transfer the exact amount — your account updates automatically.":
    "Chuyển đúng số tiền — tài khoản của bạn sẽ tự cập nhật.",
  "Set SEPAY_ACCOUNT/SEPAY_BANK to render the QR.":
    "Đặt SEPAY_ACCOUNT/SEPAY_BANK để hiển thị mã QR.",
  Amount: "Số tiền",
  "Waiting for payment…": "Đang chờ thanh toán…",
  "Payment received — credits added":
    "Đã nhận thanh toán — đã cộng credit 🎉",

  // Batch
  "Mass-produce videos — one per topic":
    "Làm nhiều video cùng lúc — mỗi chủ đề một video",
  "Open library": "Mở thư viện",
  Topics: "Chủ đề",
  "One topic per line…": "Mỗi dòng một chủ đề…",
  "Shared look comes from the Create tab. Each line becomes one video.":
    "Phong cách lấy từ tab Tạo video. Mỗi dòng thành một video.",
  "Your plan allows {{n}} per batch.": "Gói của bạn cho phép {{n}} video mỗi lần.",
  Upgrade: "Nâng cấp",
  Generate: "Tạo",
  "Queued {{n}} videos": "Đã thêm {{n}} video vào hàng đợi",

  // Admin
  Admin: "Quản trị",
  "Users, credits and revenue": "Người dùng, credit và doanh thu",
  "Admin key": "Khoá quản trị",
  Connect: "Kết nối",
  "Invalid admin key or backend offline.":
    "Khoá quản trị sai hoặc máy chủ offline.",
  Users: "Người dùng",
  "Active subs": "Gói đang hoạt động",
  "Credits out": "Credit lưu hành",
  Revenue: "Doanh thu",
  "Credits updated": "Đã cập nhật credit",

  // Misc
  "Payment expired — please try again": "Thanh toán đã hết hạn — vui lòng thử lại",
  "Queued {{q}} of {{r}} — the queue is full, try the rest later":
    "Đã thêm {{q}}/{{r}} — hàng đợi đang đầy, thử phần còn lại sau",
};
