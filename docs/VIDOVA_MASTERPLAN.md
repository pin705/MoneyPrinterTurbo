# Vidova — Tài liệu Tổng thể Sản phẩm & Kỹ thuật (Master Plan)

> Phiên bản 1.0 · Cập nhật 2026-06-22
> Phạm vi: định vị, kiến trúc, kinh tế credit (có tính toán), 4 giai đoạn sản phẩm, xử lý mọi trường hợp, pháp lý, vận hành, KPI, lộ trình.
> Mọi con số tiền/giá đánh dấu **(giả định)** là số mẫu để tính mô hình — cần A/B & kiểm chứng thực tế trước khi chốt.

---

## 0. Tóm tắt điều hành

**Vidova không phải "máy gen video". Vidova là LỚP ĐIỀU PHỐI NỘI DUNG (content orchestration layer).**

- Phần **nặng tiền** (render) chạy **trên máy người dùng** → chi phí biên ≈ 0 cho chúng ta.
- Phần **AI** chỉ dùng đúng chỗ rẻ (viết lời) hoặc **mượn nhà cung cấp có sẵn** (footage, voice, avatar, generative clip) theo cơ chế **pass-through** (user trả phí provider, ta lấy biên mỏng).
- **Moat** không nằm ở generation (commodity, ai cũng làm, đắt) mà ở: **workflow** (ngách → 30 ý tưởng → batch → đa nền tảng → lịch đăng), **phân phối + dữ liệu trend**, **lợi thế chi phí cục bộ**, và **thị trường VN (VND/SePay)**.

**4 giai đoạn (đã re-sequence theo rủi ro/tiền):**

| # | Giai đoạn | Vai trò | Tiền | Rủi ro | Effort* |
|---|---|---|---|---|---|
| 1 | **Content Factory** | Giữ chân, tạo volume | Gói lượt | Thấp | 1–2 tuần |
| 2 | **E-commerce** (đẩy lên) | Doanh thu B2B rõ ràng | **Cao** | TB | 3–4 tuần |
| 3 | **Viral Clone** (de-risk) | Wow-feature, kéo viral | Cao | Cao | 3 tuần |
| 4 | **Agent** | Moat, subscription cao cấp | Subscription | Cao nhất | 6–8 tuần |

*Effort: ước lượng cho đội 1–2 dev full-time, tính cả QA.

---

## 1. Triết lý sản phẩm

### 1.1 Nguyên tắc bất biến
1. **Render luôn ở máy user** — không bao giờ dựng video trên cloud của ta (tránh đốt compute).
2. **Không trợ giá generation** — mọi phần AI đắt đều pass-through hoặc bring-your-own-key (BYO-key).
3. **Đường miễn phí phải luôn sống** — path "stock free + Edge TTS + render máy" không bao giờ chết; provider trả phí chỉ là add-on.
4. **Bán kết quả & quy trình**, không bán "lần gen".
5. **Provider là commodity cắm-rút được** — không hardcode 1 nhà; mọi nhà cung cấp đi sau một interface.

### 1.2 Cái gì TỰ LÀM vs ĐI MƯỢN

| Lớp | Chiến lược | Vì sao |
|---|---|---|
| Workflow / orchestration | **Tự làm (moat)** | Khó sao chép, là giá trị cốt lõi |
| Phân phối + lịch đăng + trend data | **Tự làm (moat)** | Dữ liệu & tự động hoá = khác biệt |
| Render | **Tự làm, chạy máy user** | Lợi thế chi phí |
| LLM (viết lời) | Mượn (DeepSeek) + BYO-key | Rẻ, thay được |
| Footage | Mượn (Pexels/Pixabay/Coverr free) + AI clip optional | Free/rẻ |
| Voice | Edge TTS free + ElevenLabs optional | Free mặc định |
| Avatar/UGC | Mượn (HeyGen…) pass-through | Quá đắt để tự dựng |
| Generative B-roll | Mượn (Kling/Runway/Pika) pass-through | Đắt theo giây |

---

## 2. Kiến trúc tổng thể

### 2.1 Đã có trong repo (tái dùng tối đa)

| Thành phần | Vị trí | Dùng cho |
|---|---|---|
| Render engine cục bộ (FastAPI) | `apps/render` | script, terms, Edge TTS, tải footage, ghép MoviePy/ffmpeg, `upload_post` (YouTube/TikTok) |
| Cloud (FastAPI) | `apps/cloud` | Supabase JWT auth, `credits`, `plans`, `payments` (SePay/VND), `subscriptions`, `llm_proxy` (DeepSeek, debit→gọi→hoàn-khi-lỗi), `admin`, `ratelimit` |
| Web UI (React 19) | `apps/web` | wizard tạo video, batch, library, billing, dashboard, settings, i18n (VI mặc định) |
| Desktop shell (Tauri) | `apps/desktop` | đóng gói app + auto-update |
| Landing (Astro) | `apps/landing` | marketing, EN/VI, SEO |
| Packages | `packages/api-client`, `packages/shared` | client gọi render, hằng số/enums dùng chung |

### 2.2 Cần thêm (xương sống cho 4 giai đoạn)

1. **Provider Adapter Layer** (mục 3) — trừu tượng hoá footage/voice/avatar/genclip/ASR/crawl.
2. **Job/Queue + Scheduler** — hàng đợi job nền cho batch lớn, ASR, crawl, đăng theo lịch (GĐ4).
3. **Content Plan engine** — sinh N ý tưởng từ ngách+audience (GĐ1).
4. **Ingestion adapters** — Shopify (GĐ3), URL video → ASR (GĐ2), trend feed (GĐ4).
5. **Credit metering mở rộng** — mỗi action có chi phí credit (mục 4), đo trước-trừ-sau, hoàn khi lỗi.

### 2.3 Luồng tổng (mọi giai đoạn quy về 1 pipeline)

```
INPUT (chủ đề | URL TikTok | URL Shopify | trend)
  → PLAN (LLM: ý tưởng / hook / script / angle)
  → ASSET (footage: stock|AI clip ; voice: edge|11labs ; avatar: heygen?)
  → RENDER (máy user, ffmpeg/MoviePy)
  → OUTPUT (file | đa định dạng nền tảng)
  → DISTRIBUTE (tải | upload_post | lịch đăng)
```
Mỗi giai đoạn chỉ khác ở **INPUT** và độ sâu của **PLAN/ASSET**. Pipeline lõi không đổi → tái dùng cực mạnh.

---

## 3. Provider Adapter Layer (lớp cắm-rút)

### 3.1 Vì sao bắt buộc
- Provider đổi giá / ToS / tắt API bất cứ lúc nào → cần swap nhanh.
- Mỗi user có thể chọn nhà cung cấp khác nhau (free vs premium).
- Tính credit theo provider cần một điểm đo thống nhất.

### 3.2 Các interface (khái niệm)

```ts
interface FootageProvider {
  id: string;                 // "pexels" | "pixabay" | "coverr" | "kling" | ...
  kind: "stock" | "generative";
  search(query, opts): Promise<Clip[]>;     // stock
  generate?(prompt, opts): Promise<Clip>;   // generative (đắt → metered)
  cost(opts): CreditCost;     // 0 cho stock free; >0 cho generative
}

interface VoiceProvider { id; synth(text, voice, opts): Promise<Audio>; cost(): CreditCost }
interface AvatarProvider { id; render(script, avatar, opts): Promise<Clip>; cost(): CreditCost }  // HeyGen…
interface LLMProvider { id; complete(messages, opts): Promise<Text>; cost(usage): CreditCost }     // DeepSeek, BYO
interface ASRProvider { id; transcribe(mediaUrl): Promise<Transcript>; cost(durationSec): CreditCost } // Whisper local|cloud
interface IngestProvider { id; fetch(url): Promise<SourceData> }  // Shopify, TikTok URL, trend feed
```

### 3.3 Nguyên tắc adapter
- **Fallback chuỗi:** Pexels → Pixabay → Coverr (footage). Hết quota/lỗi → nhà kế tiếp; cạn hết → báo rõ + cho retry.
- **BYO-key first:** nếu user có key riêng → dùng key đó, **credit = 0** (ta không gánh chi phí).
- **Managed = pass-through + margin:** nếu dùng key của ta → tính credit theo `cost()` × hệ số margin.
- **Đo lường tập trung:** mọi `cost()` trả về `{ credits, providerCostUSD }` để báo cáo biên lợi nhuận.

---

## 4. Mô hình Credit & Kinh tế đơn vị (có tính toán)

### 4.1 Định nghĩa
- **1 credit = đơn vị nội bộ.** Hệ thống đã có (`credits` table, reason: signup/topup/llm:*/refund).
- **Giá vốn (COGS)** mỗi credit phải ≤ giá bán / hệ số margin mục tiêu.
- **Mục tiêu margin:** phần text (LLM) ≥ 90%; phần pass-through (avatar/genclip) 10–30% (đối tác đã ăn phần lớn).

### 4.2 Giá bán credit — gói mẫu (giả định, VND)

| Gói | Credit | Giá | Đơn giá/credit | Ghi chú |
|---|---|---|---|---|
| Free (tặng) | 30 | 0₫ | — | onboarding |
| Starter | 100 | 99.000₫ | ~990₫ | mua lẻ |
| Creator | 500 | 399.000₫ | ~800₫ | phổ biến |
| Pro | 2.000 | 1.290.000₫ | ~645₫ | bulk |
| Sub Creator/tháng | 300/tháng | 199.000₫ | — | + ưu đãi GĐ1/2 |
| Sub Agency/tháng | 2.000/tháng | 990.000₫ | — | mở GĐ3/4 (agent) |

> Quy đổi tham chiếu: 1 USD ≈ 25.000₫ (giả định).

### 4.3 Giá vốn provider — ước tính (giả định, cần kiểm chứng)

| Tác vụ | Provider | Khối lượng điển hình | Giá vốn/đơn vị | Quy ra ₫ |
|---|---|---|---|---|
| Viết kịch bản 1 video | DeepSeek chat | ~1k token | ~$0.001 | ~25₫ |
| Lập kế hoạch 30 ý tưởng | DeepSeek chat | ~4–6k token | ~$0.005 | ~125₫ |
| Phân tích 1 video viral | DeepSeek + ASR | 60s + 2k token | ASR $0.006 + $0.002 | ~200₫ |
| Bóc tiếng (ASR cloud) | Whisper API | /phút | $0.006 | ~150₫/phút |
| Bóc tiếng (ASR local) | Whisper máy user | /phút | $0 | 0₫ |
| Giọng cao cấp /video | ElevenLabs | ~900 ký tự | ~$0.27 | ~6.750₫ |
| Avatar UGC /clip | HeyGen | 1 clip ngắn | ~$0.5–2 | ~12.500–50.000₫ |
| Generative B-roll 5s | Kling/Runway | 1 clip 5s | ~$0.05–0.5 | ~1.250–12.500₫ |
| Footage stock | Pexels/Pixabay/Coverr | /clip | $0 (quota free) | 0₫ |
| Edge TTS | Microsoft | /video | $0 | 0₫ |
| Render | Máy user | /video | $0 | 0₫ |

### 4.4 Bảng chi phí credit theo action (đề xuất)

| Action | Credit tính user | Giá vốn (managed) | Biên |
|---|---|---|---|
| Viết kịch bản + từ khoá (1 video) | **1** | ~25₫ | ~97% |
| Lập kế hoạch 30 ý tưởng (GĐ1) | **5** | ~125₫ | ~97% |
| Render + Edge TTS + stock | **0** | 0₫ | — (miễn phí, giữ chân) |
| Giọng cao cấp (ElevenLabs)/video | **8** (~6.400₫) | ~6.750₫ | ~mỏng/hoà vốn → khuyến khích BYO-key |
| Phân tích viral + 20 biến thể (GĐ2) | **10** | ~350₫ | ~95% (nếu ASR local) |
| Crawl Shopify + ad script + UGC script (GĐ3) | **5** | ~150₫ | ~97% |
| Avatar UGC clip (GĐ3) | **pass-through** (vd 15–50) | $0.5–2 | đối tác ăn chính, ta +15–20% |
| Generative B-roll 5s | **pass-through** (vd 5–15) | $0.05–0.5 | +20–30% |
| Agent tự động (GĐ4) | **subscription** (không tính lẻ) | hạ tầng + API | gói tháng |

**Quy tắc vàng:** action chỉ-text → biên rất cao, định giá thoải mái. Action gọi provider đắt (avatar/genclip/voice premium) → **mặc định khuyến khích BYO-key (credit thấp/0)**; nếu managed thì credit = `ceil(providerCostUSD × 25000 × 1.2 / đơn_giá_credit)`.

### 4.5 Ví dụ kinh tế đơn vị (worked example)

**Creator làm 30 video/tháng (GĐ1, dùng đường free + Edge TTS):**
- 1 lần plan 30 ý tưởng = 5 credit
- 30 kịch bản = 30 credit
- Render + giọng Edge + stock = 0
- **Tổng: 35 credit** → nếu mua gói Creator (800₫/credit) = **28.000₫ doanh thu**
- Giá vốn AI: ~125₫ (plan) + ~750₫ (30 script) ≈ **875₫**
- **Biên: ~97%**, render gánh bởi máy user. ✅ Mô hình cực khoẻ ở GĐ1.

**Seller làm 20 ad video/tháng (GĐ3, có UGC avatar):**
- 20 × (crawl+script 5 credit) = 100 credit
- 20 × avatar clip (managed, 30 credit) = 600 credit (pass-through)
- Tổng 700 credit → gói Pro/Agency. Doanh thu ~450.000–690.000₫; phần avatar phần lớn trả đối tác, ta giữ biên mỏng + phí workflow. ✅ Khách trả nhiều, biên tuyệt đối lớn dù % mỏng.

### 4.6 Các trường hợp credit (edge cases)
| Tình huống | Xử lý |
|---|---|
| Hết credit giữa batch | Dừng job, giữ phần đã xong, báo "cần nạp thêm N credit", không tính phần chưa chạy |
| Gọi AI lỗi sau khi trừ | **Hoàn credit** (`reason="refund"`) — đã có ở `llm_proxy`; áp dụng cho mọi provider |
| Provider trả lỗi 1 phần (vd 18/20 clip) | Chỉ tính credit phần thành công; hoàn phần fail |
| User có BYO-key | credit = 0 cho action đó; vẫn log usage để thống kê |
| Retry do lỗi mạng | Không trừ thêm credit cho cùng 1 job-id (idempotency key) |
| Refund payment (SePay) chargeback | Trừ lại credit chưa dùng; nếu đã dùng > số mua → khoá âm, cảnh báo admin |
| Lạm dụng (fail-call abuse) | Rate-limit theo user + cảnh báo khi tỉ lệ refund cao (đã có hook) |

---

## 5. Chi tiết 4 Giai đoạn

### GIAI ĐOẠN 1 — Content Factory ✅ (làm trước)

**Mục tiêu:** nhập *Chủ đề + Ngách + Audience* → AI lập **30 ý tưởng KHÁC NHAU** (mỗi cái có hook/angle riêng) → user chọn → batch render → xuất theo format từng nền tảng.

> ⚠️ **Tránh bẫy "90 video trùng".** KHÔNG render 1 video rồi nhân 3 nền tảng. Đúng là 30 nội dung độc lập; mỗi nội dung *xuất lại theo tỉ lệ/độ dài/caption/hashtag* của nền tảng khi user cần.

**Luồng dữ liệu:**
```
{niche, audience, topic?, count=30, platforms[]}
 → LLM ContentPlan → [{idea, hook, angle, script_outline, keywords}] × 30
 → user chọn/sửa → batch: mỗi idea → script đầy đủ → render
 → export adapter: 9:16 (TikTok/Reels/Shorts) | caption preset | hashtag gợi ý
```

**Schema (đề xuất):**
```ts
ContentPlanRequest { niche: string; audience: string; topic?: string; count: number; tone?: string }
ContentIdea { id; title; hook; angle; outline: string[]; keywords: string[] }
ContentPlan { id; createdAt; ideas: ContentIdea[] }
```

**API mới:**
- `POST /v1/llm/content-plan` (cloud, metered: 5 credit) → trả 30 ý tưởng.
- Tái dùng `createVideoBatch` (đã có) cho phần render.

**UI:** màn "Kế hoạch nội dung" mới trước wizard: form (Ngách/Audience/Số lượng/Tông) → bảng 30 ý tưởng (chọn, sửa, xoá, "tạo thêm") → "Đưa vào hàng đợi".

**Tái dùng:** batch, generator wizard, preview, library, credit. **Build mới:** content-plan endpoint + màn plan + export-per-platform adapter.

**Credit:** plan = 5; mỗi script = 1; render/voice free.
**Rủi ro:** chất lượng ý tưởng (cần prompt tốt + dedupe để không trùng); chống nội dung spam.
**KPI:** % user dùng plan, số video/ user/tháng, tỉ lệ ý tưởng được chọn.

---

### GIAI ĐOẠN 2 — E-commerce 💰 (đẩy lên #2 — hướng ra tiền rõ nhất)

**Mục tiêu:** nhập **URL sản phẩm Shopify** → crawl → AI viết **ad script + UGC script** → ghép ảnh sản phẩm (Ken Burns) + footage minh hoạ + voice → (tuỳ chọn) avatar UGC.

**Vì sao trước Viral Clone:** (1) người bán **trả tiền cho creative** (ROI rõ); (2) **data Shopify lấy hợp lệ dễ hơn** TikTok — trang sản phẩm có JSON công khai `/products/{handle}.json`; (3) đã có sẵn **Shopify MCP + GemPages MCP** trong môi trường.

**Luồng dữ liệu:**
```
{shopify_url}
 → IngestProvider.shopify → {title, desc, images[], price, variants}
 → LLM → ad_script (hook→benefit→CTA) + UGC_script (lời người thật)
 → ASSET: ảnh sản phẩm (Ken Burns) + stock b-roll + voice (edge|11labs)
        + (optional) avatar UGC (HeyGen pass-through)
 → render → xuất 9:16 / 1:1 / 16:9
```

**Schema:**
```ts
ProductSource { url; title; description; images: string[]; priceVnd?; variants?: string[] }
AdCreative { id; productUrl; adScript; ugcScript; hooks: string[]; clips: Clip[] }
```

**API mới:** `POST /v1/ingest/shopify`, `POST /v1/llm/ad-script`, `POST /v1/llm/ugc-script`. Avatar qua `AvatarProvider`.

**Tái dùng:** pipeline render, voice, footage, credit. **Build mới:** Shopify ingest adapter, ad/UGC prompt, Ken Burns trên ảnh sản phẩm, avatar adapter.

**Credit:** crawl+script = 5; avatar = pass-through; voice premium = 8/BYO-key.
**Rủi ro:** (1) crawl store **người khác** = vùng xám → **chỉ cho store của user / nhập tay** + tôn trọng robots; (2) chất lượng UGC; (3) bản quyền ảnh (ảnh sản phẩm của chính seller → OK).
**KPI:** số ad tạo/seller, tỉ lệ chuyển sang gói trả phí, retention seller.

---

### GIAI ĐOẠN 3 — Viral Clone ⚠️ (de-risk trước khi làm)

**Mục tiêu:** dán **URL video** → AI phân tích **Hook / Script / Cấu trúc** → tạo **N biến thể** cùng cấu trúc cho chủ đề của user.

**Sự thật kỹ thuật:**
```
{video_url}
 → tải media (yt-dlp) → ASR (Whisper local|cloud) → transcript
 → LLM phân tích {hook_type, structure[], pacing, cta}
 → LLM sinh N biến thể (chủ đề của user, GIỮ cấu trúc, ĐỔI nội dung)
 → pipeline render
```

**⚠️ Rủi ro & cách de-risk (bắt buộc):**
| Rủi ro | Giảm thiểu |
|---|---|
| TikTok không có API video bất kỳ; scrape vi phạm ToS, hay vỡ | Ưu tiên **user tự dán transcript / video CỦA HỌ**; nếu lấy từ URL → qua bên thứ ba có license, có hạn mức, có disclaimer |
| Anti-bot, IP block | Không scrape hàng loạt; xử lý 1 video/lần theo thao tác user |
| "Clone" = phái sinh → bản quyền | Định vị là **"trích cấu trúc để lấy cảm hứng"**, không sao chép nguyên; chỉ tái dùng *khung*, nội dung mới hoàn toàn |
| ASR sai/đa ngôn ngữ | Whisper đa ngữ; cho user sửa transcript trước khi sinh |
| Chi phí ASR | Mặc định **Whisper chạy máy user (free)**; cloud ASR là tuỳ chọn |

**Credit:** phân tích + 20 biến thể = 10 (ASR local) / +2 (ASR cloud).
**KPI:** tỉ lệ biến thể được render, video viral-clone có reach tốt hơn baseline?

---

### GIAI ĐOẠN 4 — Agent 🚀 (cuối, moat lớn nhất)

**Mục tiêu:** AI **theo dõi trend** → **tự tạo video** → **lên lịch đăng** đa nền tảng. Từ "video editor" thành **content agent**.

**Thành phần:**
```
Trend feed (TikTok Creative Center / bên thứ ba)
 → Agent chọn trend hợp ngách của user
 → tự chạy pipeline GĐ1/2 → tạo video
 → Scheduler → upload_post (đã có) theo lịch
 → vòng phản hồi: theo dõi hiệu suất → ưu tiên trend convert tốt
```

**Đã có nền:** `upload_post` (đăng YouTube/TikTok). **Cần build:**
1. **Nguồn trend** — adapter (lại là crawl/bên thứ ba; chọn nguồn có license).
2. **Đăng TikTok chính thức** — **Content Posting API + duyệt app + OAuth** (chờ duyệt vài tuần → bắt đầu xin SỚM).
3. **Scheduler nền** + theo dõi hiệu suất + bảng điều khiển agent.

**Credit/tiền:** **subscription cao cấp** (Agency), không tính lẻ.
**Rủi ro:** phụ thuộc API ngoài, duyệt app lâu, ops/độ tin cậy, ToS auto-post. **KPI:** số kênh tự vận hành, video/tuần tự đăng, retention gói Agency.

---

## 6. Xử lý mọi trường hợp (Edge cases & Error handling)

| Nhóm | Tình huống | Hành vi mong muốn |
|---|---|---|
| **Mạng** | Mất mạng giữa job | Lưu trạng thái, cho resume; không trừ credit phần chưa chạy |
| | Provider timeout | Retry có backoff (tối đa N lần) → fallback nhà khác → báo lỗi rõ |
| **Provider** | Hết quota Pexels | Fallback Pixabay→Coverr; cạn hết → "tạm hết nguồn hình, thử lại sau" |
| | Provider đổi API/format | Adapter cô lập; chỉ sửa 1 file adapter, không lan ra pipeline |
| | Provider tăng giá | Cập nhật `cost()`; thông báo user trước khi đổi credit |
| **Credit** | Hết giữa chừng | Dừng, giữ phần xong, hiện "cần nạp N credit"; không mất phần đã chạy |
| | Lỗi sau khi trừ | Hoàn credit tự động (idempotent theo job-id) |
| **Render (máy user)** | ffmpeg fail / thiếu codec | Báo lỗi cụ thể + link khắc phục; không tính credit (render free) |
| | Máy yếu/treo | Cảnh báo cấu hình tối thiểu; cho chọn độ phân giải thấp hơn |
| **ASR (GĐ3)** | Không bóc được tiếng | Cho user dán transcript tay |
| | Sai ngôn ngữ | Tự nhận diện + cho chọn lại ngôn ngữ |
| **Crawl (GĐ2/4)** | URL không hợp lệ / bị chặn | Báo rõ; cho nhập dữ liệu sản phẩm tay |
| | robots.txt cấm | Tôn trọng; từ chối + giải thích |
| **Đăng (GĐ4)** | Token nền tảng hết hạn | Yêu cầu kết nối lại OAuth; giữ video ở hàng chờ |
| | Nền tảng từ chối nội dung | Lưu lý do; cho sửa & đăng lại |
| **Nội dung** | Sinh trùng/spam | Dedupe ý tưởng; cảnh báo khi quá giống |
| | Nội dung nhạy cảm/bản quyền | Bộ lọc + disclaimer; chặn nếu vi phạm |
| **Auth** | Phiên hết hạn | Đăng nhập lại; không mất draft (autosave) |
| **Thanh toán** | SePay không khớp/hết hạn | Polling trạng thái (đã có); báo "hết hạn, thử lại" |

**Nguyên tắc UX lỗi:** mỗi lỗi = **nguyên nhân + cách khắc phục + nút hành động** (retry/sửa/liên hệ). Không bao giờ "Something went wrong" trống.

---

## 7. Pháp lý, ToS & Nội dung
- **Crawl:** chỉ dữ liệu công khai + tôn trọng robots; với store/video người khác → ưu tiên "của chính user / nhập tay / bên thứ ba có license". Có **Điều khoản sử dụng** nêu rõ user chịu trách nhiệm nội dung họ tạo.
- **Bản quyền:** footage dùng nguồn free-license (Pexels/Pixabay/Coverr) hoặc của user; nhạc royalty-free; cảnh báo khi dùng nội dung phái sinh.
- **Auto-post (GĐ4):** tuân thủ Content Posting API chính thức + ToS từng nền tảng.
- **Dữ liệu cá nhân:** nội dung user xử lý cục bộ tối đa; cloud chỉ giữ thứ cần (auth, credit, hoá đơn).

## 8. Bảo mật & Dữ liệu
- Key provider của user: lưu trong `config.toml` **trên máy user** (không gửi cloud) hoặc mã hoá nếu buộc lưu cloud.
- Cloud: JWT Supabase, rate-limit, admin key tách riêng (đã có).
- Idempotency key cho mọi job tính tiền.

## 9. Hạ tầng & Vận hành
- **Render:** máy user (không scale cloud).
- **Cloud:** stateless API + DB (credit/plan/invoice). Thêm **queue** (job nền: batch lớn, ASR, crawl, scheduler GĐ4).
- **Scheduler (GĐ4):** worker định kỳ + retry; tách khỏi API.
- **Quan trắc:** log usage + providerCost để theo dõi biên theo tính năng; cảnh báo refund-spike (đã có).

## 10. KPI & Mốc tài chính
| Chỉ số | GĐ1 | GĐ2 | GĐ3 | GĐ4 |
|---|---|---|---|---|
| Bắc tinh | video/user/tháng | ad/seller/tháng | biến thể render | kênh tự vận hành |
| Doanh thu | gói lượt | gói Pro/Agency | gói lượt | subscription |
| Giữ chân | tuần 4 | seller M2 | viral lift | MRR agency |

## 11. Lộ trình & Ưu tiên
1. **Nền tảng (1 tuần):** Provider Adapter Layer + credit metering mở rộng + idempotency.
2. **GĐ1 Content Factory (1–2 tuần).**
3. **GĐ2 E-commerce (3–4 tuần)** — Shopify ingest → ad/UGC → avatar adapter.
4. **GĐ3 Viral Clone (3 tuần)** — ASR local + phân tích + biến thể (bản de-risk).
5. **GĐ4 Agent (6–8 tuần)** — bắt đầu **xin duyệt TikTok API ngay từ đầu**; trend feed + scheduler + vòng phản hồi.

## 12. Rủi ro tổng hợp & Giảm thiểu
| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Phụ thuộc provider (giá/ToS/tắt API) | Cao | Adapter swap nhanh + BYO-key |
| ToS/scrape TikTok | Cao | De-risk GĐ3, ưu tiên dữ liệu của user/bên có license |
| Duyệt TikTok Posting API lâu | TB | Xin sớm; fallback đăng thủ công |
| Nội dung trùng/spam | TB | Dedupe + giới hạn + chất lượng prompt |
| Wrapper mỏng, thiếu moat | TB | Đầu tư workflow/phân phối/data, không chỉ tích hợp |
| Chi phí gen vượt biên | TB | Pass-through + khuyến khích BYO-key; không trợ giá |

## 13. Phụ lục — Công thức credit
```
Nếu user có BYO-key:        credits(action) = 0   (chỉ log usage)
Nếu managed (text/LLM):     credits = ceil(tokenCostUSD × 25000 × marginText / donGiaCredit)
Nếu managed (pass-through): credits = ceil(providerCostUSD × 25000 × marginPass / donGiaCredit)
  marginText ≈ 10×  (biên ~90%+)
  marginPass ≈ 1.2× (biên mỏng, đối tác ăn chính)
  donGiaCredit ≈ 800₫ (giả định, theo gói)
Render / Edge TTS / stock free: credits = 0
```

---

*Tài liệu sống — cập nhật khi chốt giá thực tế, provider thực tế, và sau mỗi giai đoạn.*
