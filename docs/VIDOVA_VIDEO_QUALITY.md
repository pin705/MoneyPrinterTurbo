# Vidova — Tối ưu Chất lượng Video (từ "chơi chơi" → "dùng được")

> Phiên bản 1.0 · 2026-06-23
> Mục tiêu: video **đăng được thật** (TikTok/Reels/Shorts) — hình minh hoạ đúng nội dung đang nói, có nhịp, có điểm nhấn — chứ không phải slideshow stock ghép ngẫu nhiên.
> Tài liệu này bám đúng code hiện tại: `apps/render/app/services/{task,llm,material,video,voice,subtitle}.py`.

---

## 0. Mục tiêu cuối (Definition of Done)

Một video được coi là **"dùng được"** khi đạt **tất cả** tiêu chí sau (acceptance criteria, đo được):

| # | Tiêu chí | Đo bằng |
|---|---|---|
| Q1 | Mỗi cảnh có hình **liên quan câu đang nói** | Có scene plan; mỗi cảnh 1 truy vấn hình riêng |
| Q2 | Hình **đổi theo câu/cảnh**, không phải cắt 3s tuỳ tiện | Cắt theo ranh giới câu (word-timing) |
| Q3 | **Không lặp** clip sát nhau, không "quay vòng" để lấp giờ | Đếm clip distinct ≥ ngưỡng |
| Q4 | Phụ đề **đọc được & khớp tiếng**, có điểm nhấn | ASS động / word-by-word, coverage ≥ 90% |
| Q5 | Có **hook mở đầu** (title 1–2 giây) | Bắt buộc render scene 0 |
| Q6 | Đúng tỉ lệ + chừa lề an toàn (caption không chạm mép) | Safe-area check |
| Q7 | Âm thanh sạch (không câm, không vỡ) | RMS/peak check |
| Q8 | **Không khung đen / lỗi overlay** | Lấy mẫu frame |
| Q9 | Kịch bản **đúng & có giá trị** (không bịa, không sáo rỗng) | Research grounding (niche cần dữ kiện) |
| Q10 | Tự động **chặn giao** nếu không đạt | Quality gate trước khi `COMPLETE` |

> Nguyên tắc: **thà báo "render lại" còn hơn giao một video rác.**

---

## 1. Vì sao video hiện tại XẤU (chẩn đoán theo code)

Pipeline hiện tại ([`task.py:start`](../apps/render/app/services/task.py)):

```
script (1 cục)  → terms: 5–8 keyword CHUNG cho cả video  (llm.generate_terms)
→ material.download_videos: search Pexels/Pixabay theo keyword → 1 đống clip generic
→ video.combine_videos: GHÉP NGẪU NHIÊN (video_concat_mode=random mặc định),
   mỗi clip cắt cứng max_clip_duration (3–5s), LẶP cho đủ audio_duration
→ burn phụ đề SRT tĩnh → mux audio
```

### Nguyên nhân gốc (xếp theo mức tác động)

| # | Lỗi cấu trúc | Bằng chứng trong code | Hệ quả |
|---|---|---|---|
| R1 | **Chọn hình theo keyword toàn cục, không theo cảnh** | `generate_terms(...amount=5)` → cả video xài chung vài keyword | Hình chỉ "cùng chủ đề mơ hồ", không minh hoạ câu đang nói |
| R2 | **Ghép ngẫu nhiên** | `generate_final_videos`: `video_concat_mode = random` (mặc định & khi count>1) | Thứ tự hình mâu thuẫn lời thoại |
| R3 | **Cắt cứng 3–5s + lặp lấp giờ** | `combine_videos(max_clip_duration=...)`, lặp clip tới khi đủ `audio_duration` | Cắt giữa câu, lặp lại, cảm giác "quay vòng vô nghĩa" |
| R4 | **Không có scene plan** | Không tồn tại bước map câu↔hình | Không thể đồng bộ hình theo lời |
| R5 | **Không có lớp đồ hoạ/chữ động** | Chỉ `generate_subtitle` → SRT burn cứng | Nhìn phẳng như slideshow, thiếu hook/title/điểm nhấn |
| R6 | **Không có quality gate** | `start()` set `COMPLETE` ngay sau render | Khung đen / lệch / slideshow vẫn được giao |
| R7 | **Chỉ stock, chủ đề trừu tượng → không có hình** | `material.search_videos_*` | Topic kiểu "động lực", "tư duy" → toàn clip lấp ghép vô nghĩa |
| R8 | **Kịch bản không grounding** | `generate_script` thuần LLM | Nội dung generic/sáo rỗng/sai → hình đẹp cũng vô dụng |

> `match_materials_to_script=True` có cải thiện một phần (tải & ghép **tuần tự theo keyword**) nhưng **vẫn là keyword, không phải ngữ nghĩa từng câu**, và **không bật mặc định**.

---

## 2. "Tốt" trông như thế nào — đối chiếu OpenMontage

OpenMontage = **agent nhiều giai đoạn**: `research → proposal → script → scene_plan → assets → edit → compose`, có **quality gate** chặn trước + self-review sau.

Những thứ tạo nên chất lượng của họ (và mình thiếu):
1. **Scene plan**: cắt kịch bản thành cảnh; mỗi cảnh có hình *đúng nội dung cảnh đó*.
2. **Hình đúng ý**: sinh ảnh AI (FLUX/Imagen) animate bằng Remotion, **hoặc** truy hồi **semantic bằng CLIP** (khớp ý nghĩa, không phải keyword).
3. **Lớp motion graphics**: title, "stat reveal", **chữ chạy theo từng từ** (WhisperX word-timing) → nhìn *được thiết kế*.
4. **Quality gate**: chặn "nguy cơ slideshow"; sau render soi black-frame/âm thanh/phụ đề → **không đạt không giao**.
5. **Research grounding**: 15–25 dữ kiện trước khi viết → không bịa.

→ 90% khác biệt nằm ở **R1 (scene plan) + R2/R3 (timeline có chủ đích) + R5 (lớp chữ động) + R6 (quality gate)**.

---

## 3. Kiến trúc Pipeline MỚI (scene-plan based)

```
[research?]            (tuỳ niche — grounding dữ kiện)
   → script            (llm: kịch bản theo câu, có hook)
   → SCENE PLAN        (llm: trả mảng cảnh — câu + truy vấn hình + chữ overlay)   ★ lõi
   → ASSET / SCENE     (mỗi cảnh: stock theo truy vấn riêng → [CLIP rerank] → [ảnh AI nếu thiếu])
   → ALIGN             (TTS + word-timing → mỗi cảnh = đúng độ dài câu của nó)
   → COMPOSE           (timeline TUẦN TỰ; ảnh tĩnh → Ken Burns; chuyển cảnh nhẹ)
   → MOTION LAYER      (hook title card + caption động word-by-word + lower-third)
   → QUALITY GATE      (ffprobe + sample frame + audio + coverage + distinct clips)  ★ chặn rác
   → DELIVER           (chỉ khi đạt; không đạt → render lại / báo lỗi cụ thể)
```

### 3.1 Mô hình dữ liệu — Scene Plan (đề xuất)

```jsonc
ScenePlan {
  hook: string;                 // câu mở đầu/hook (scene 0)
  scenes: Scene[];
}
Scene {
  id: number;
  narration: string;            // CÂU lời thoại của cảnh (đơn vị đồng bộ)
  visual_query: string;         // truy vấn hình RIÊNG cho cảnh (cụ thể, tả được)
  keywords: string[];           // 2–4 từ khoá tiếng Anh để search stock
  on_screen_text?: string;      // chữ overlay ngắn (số liệu/điểm nhấn) — tuỳ chọn
  visual_type: "footage" | "image" | "text";  // gợi ý nguồn hình
}
```

LLM trả thẳng cấu trúc này (1 lần gọi) thay cho `generate_terms`. Mỗi `scene.narration` là **đơn vị căn chỉnh**: thời lượng clip = thời lượng đọc câu đó.

### 3.2 Thuật toán căn chỉnh (alignment) — diệt R2/R3
- TTS toàn bộ script → lấy **word-timing** (đã có ở `voice.tts`/`subtitle`).
- Gộp word-timing về **ranh giới câu** → mỗi `scene` biết `[t_start, t_end]`.
- Mỗi cảnh: lấy clip theo `visual_query`, **trim/scale đúng `t_end - t_start`** (không cắt cứng 3s, không lặp để lấp giờ).
- Cảnh dài hơn clip → nối 1–2 clip cùng `visual_query` hoặc thêm Ken Burns; **không** chèn clip của cảnh khác.
- Ghép **tuần tự theo `scene.id`** (bỏ random).

### 3.3 Lớp Motion/Typography — diệt R5 (2 cấp)
- **MVP (local, FFmpeg/libass — miễn phí):**
  - **Caption động word-by-word** bằng **ASS** (libass karaoke `\k`) thay cho SRT tĩnh → "chữ chạy theo tiếng" kiểu TikTok.
  - **Hook title card** đầu video (PNG/ASS sinh tại chỗ).
  - **Ken Burns** (zoompan ffmpeg) cho ảnh tĩnh.
  - **Lower-third / on_screen_text** cho số liệu, dùng ASS.
- **Nâng cao (tuỳ chọn):** microservice **Remotion** cho template được thiết kế (stat reveal, hero card) — nặng hơn (Node), để sau.

### 3.4 Nguồn hình (đa tầng — đúng thesis "mượn, không build")
1. **Stock theo cảnh** (Pexels/Pixabay/Coverr) — free, mặc định.
2. **CLIP rerank** (tuỳ chọn, local): xếp hạng clip ứng viên theo ngữ nghĩa `visual_query` → chọn clip khớp nhất (diệt R1 triệt để).
3. **Sinh ảnh AI theo cảnh** (FLUX/Imagen — **pass-through/BYO-key**) khi stock không có (chủ đề trừu tượng, diệt R7) → animate Ken Burns.

### 3.5 Quality Gate — diệt R6 (chạy trước khi set COMPLETE)
| Kiểm tra | Cách | Ngưỡng |
|---|---|---|
| Khung đen / hỏng | ffprobe + lấy mẫu N frame, đo variance | Không có frame gần như đen |
| Âm thanh | RMS/peak | Không câm, không clip |
| Phủ phụ đề | Tổng thời lượng phụ đề / thời lượng video | ≥ 90% |
| Slideshow risk | Số clip distinct / số cảnh | ≥ 60% (không lặp quá) |
| Khớp thời lượng | |video − audio| | ≤ 0.3s |
| Safe-area | Caption nằm trong vùng an toàn | true |
→ Không đạt: trạng thái `FAILED` kèm lý do cụ thể, gợi ý render lại (đổi nguồn/bật ảnh AI).

---

## 4. Cần nâng cấp gì — bản đồ theo file

| Hạng mục | File | Thay đổi |
|---|---|---|
| Scene plan | `llm.py` | Thêm `generate_scene_plan()` (JSON cảnh) + prompt; giữ `generate_terms` cho chế độ cũ |
| | `schema.py` | `ScenePlan`/`Scene` models; thêm field `scene_plan` vào `VideoParams` |
| Tải hình theo cảnh | `material.py` | `download_for_scenes(scenes)`: mỗi cảnh search theo `visual_query/keywords`; (tuỳ chọn) CLIP rerank |
| Căn chỉnh | `voice.py`/`subtitle.py` | Xuất word-timing → gộp ranh giới câu → `[t_start,t_end]` mỗi cảnh |
| Ghép timeline | `video.py` `combine_videos` | Chế độ **scene-aligned** (tuần tự, trim đúng độ dài câu, không lặp lấp giờ); Ken Burns cho ảnh |
| Caption động | `video.py`/`subtitle.py` | Xuất **ASS** karaoke word-by-word thay SRT khi bật |
| Hook + overlay | `video.py` | Render title card scene 0 + `on_screen_text` (ASS/PIL) |
| Quality gate | `task.py` + `quality.py` (mới) | `quality_check(final_video, audio, srt, scenes)` trước khi `COMPLETE` |
| Ảnh AI (tuỳ chọn) | `material.py` + adapter | `ImageProvider` (FLUX/Imagen) pass-through khi stock thiếu |
| Mặc định | `schema.py` | `match_materials_to_script`→ thay bằng `scene_aligned=True` mặc định; bỏ random mặc định |

---

## 5. Lộ trình (ưu tiên impact/effort)

| Phase | Nội dung | Vì sao trước | Local? | Effort |
|---|---|---|---|---|
| **P0 — Chặn rác + nhịp đúng** | Quality gate (#R6) · bỏ random → tuần tự mặc định (#R2) · cắt theo câu thay 3s cứng (#R3) | Ngăn giao video lỗi ngay; cải thiện nhịp tức thì | ✅ | 3–4 ngày |
| **P1 — Scene plan (LÕI)** | `generate_scene_plan` + tải hình theo cảnh + align theo câu (#R1, #R4) | Diệt gốc "hình vô nghĩa" | ✅ | 1–1.5 tuần |
| **P2 — Lớp chữ/đồ hoạ động** | Caption ASS word-by-word + hook title + Ken Burns (#R5) | Cú nhảy "nhìn xịn" | ✅ | 1 tuần |
| **P3 — Khớp ngữ nghĩa sâu** | CLIP rerank stock + **ảnh AI theo cảnh** (pass-through) (#R1, #R7) | Chủ đề trừu tượng dùng được | CLIP local / ảnh pass-through | 1–1.5 tuần |
| **P4 — Grounding** | Web research trước khi viết script (#R8) | Kịch bản đúng & có giá trị | tuỳ chọn | 4–5 ngày |

> **P0 + P1 + P2** = biến video từ "chơi chơi" → **đăng được**. P3/P4 nâng lên "chuyên nghiệp" và phủ mọi niche.

---

## 6. Cách đo lường (để biết đã "dùng được")

- **Tự động (quality gate):** % video pass gate; số clip distinct/cảnh; coverage phụ đề; lệch thời lượng.
- **Chủ quan (rubric 1–5):** "hình có minh hoạ lời không?", "có hook không?", "có cảm giác slideshow không?", "dám đăng không?". Mục tiêu ≥ 4/5.
- **A/B:** so video pipeline cũ vs mới trên cùng 10 chủ đề.

---

## 7. Rủi ro & lưu ý
- **Phủ stock cho chủ đề trừu tượng** kém → cần P3 (ảnh AI) cho các niche này.
- **CLIP local** tốn RAM/thời gian → chạy nền, cache embedding; là tuỳ chọn.
- **TTS/timing theo câu**: cần map word-timing → câu chuẩn (xử lý dấu câu đa ngôn ngữ, đặc biệt tiếng Việt).
- **Chi phí**: P0–P2 hoàn toàn local/free; chỉ ảnh AI (P3) là pass-through → giữ đúng thesis "không trợ giá gen".
- **Tương thích ngược**: giữ pipeline cũ sau cờ; scene-plan là chế độ mới mặc định bật.

---

## 8. Phụ lục — Prompt Scene Plan (phác thảo)
```
# Role: Short-Video Director
Chia kịch bản dưới đây thành các CẢNH. Mỗi câu/ý = 1 cảnh.
Trả JSON: { "hook": "...", "scenes": [ { "id", "narration", "visual_query",
"keywords"(EN, 2-4), "on_screen_text"?, "visual_type" } ] }
Ràng buộc:
- visual_query phải TẢ ĐƯỢC HÌNH cụ thể cho đúng câu (không chung chung).
- keywords là cụm tìm stock tiếng Anh, bám visual_query.
- on_screen_text chỉ dùng cho số liệu/điểm nhấn ngắn.
- KHÔNG markdown, chỉ JSON.
Script: <<<{script}>>>
```

---

*Tài liệu sống — cập nhật sau mỗi phase và khi chốt ngưỡng quality gate thực tế.*
