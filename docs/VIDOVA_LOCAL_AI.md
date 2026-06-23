# Vidova — AI ảnh chạy local (tùy chọn, miễn phí)

> Phiên bản 1.0 · 2026-06-23
> Tóm tắt: **Footage (kho video có sẵn) là mặc định.** AI ảnh local chỉ là tùy chọn cho các chủ đề trừu tượng mà footage yếu. Khi bật, app **tự phát hiện** đã cài chưa — nếu chưa thì **tự cài cho bạn** ở lần dùng đầu, và **luôn tự lùi về footage** nếu có trục trặc. Không bao giờ làm hỏng một lần render.

---

## 0. Quyết định nhanh: tôi có cần bật cái này không?

| Tình huống | Khuyến nghị |
|---|---|
| Mới bắt đầu / muốn nhanh & ổn định | **Để footage (mặc định).** Đừng bật gì cả. |
| Chủ đề cụ thể (du lịch, ẩm thực, sản phẩm, địa danh) | **Footage** — kho video có sẵn thường khớp tốt. |
| Chủ đề trừu tượng (khái niệm, cảm xúc, "động lực", tài chính trừu tượng) | Cân nhắc **AI local** để có hình minh họa riêng. |
| Máy yếu / ổ cứng gần đầy / không muốn cài thêm | **Để footage.** AI local cần ~5GB và một GPU/Apple Silicon để nhanh. |
| Muốn chất lượng ảnh cao nhất, chấp nhận trả phí | Dùng **API ảnh cloud** (FLUX/DALL·E) thay vì local — xem mục 6. |

> Nguyên tắc: footage trước, AI sau. AI local là "có thì tốt", không phải bắt buộc.

---

## 1. Khuyến nghị cấu hình phần cứng

| Thành phần | Tối thiểu | Khuyến nghị | Ghi chú |
|---|---|---|---|
| **Ổ cứng trống** | 6 GB | 10 GB+ | Model `sd-turbo` ~2.5GB + thư viện (torch/diffusers) ~2.5GB. App chặn cài nếu trống < `image_min_free_gb` (mặc định 6). |
| **RAM** | 8 GB | 16 GB+ | |
| **Tăng tốc** | CPU (chậm) | **Apple Silicon (MPS)** hoặc **NVIDIA (CUDA)** | Trên CPU mỗi ảnh có thể mất hàng chục giây; MPS/CUDA chỉ 1–3 giây. |
| **`uv`** | bắt buộc để tự cài | — | Đã có sẵn trong môi trường dev. Nếu thiếu, app sẽ hướng dẫn cài tay. |

Tốc độ tham khảo (model `sd-turbo`, 2 bước):
- **Apple M-series (MPS):** ~1–3 giây/ảnh
- **NVIDIA (CUDA, fp16):** ~0.5–1 giây/ảnh
- **CPU:** ~15–60 giây/ảnh → không khuyến nghị cho batch lớn

> App tự chọn thiết bị theo thứ tự **MPS → CUDA → CPU**. Trên MPS dùng fp32 để tránh lỗi ảnh đen thi thoảng gặp ở fp16.

---

## 2. Bật như thế nào

Trong `apps/render/config.toml` (mục `[app]`):

```toml
# Bật AI ảnh local (mặc định là "none" = dùng footage)
image_provider = "local"

# Các tùy chọn (đều có mặc định hợp lý, không bắt buộc khai báo):
# image_auto_install = true            # tự cài torch/diffusers ở lần đầu (cần uv)
# image_min_free_gb  = 6.0             # chặn cài/chạy nếu ổ trống ít hơn mức này
# image_model        = "stabilityai/sd-turbo"
# image_steps        = 2               # sd-turbo: 1–4 là đủ
# image_guidance     = 0.0             # sd-turbo bắt buộc 0.0
```

Chỉ cần `image_provider = "local"`. Mọi thứ còn lại tự lo.

---

## 3. Điều gì xảy ra ở lần dùng đầu (tự cài)

Khi một lần render cần ảnh AI lần đầu:

1. **Kiểm tra đã cài chưa.** Nếu `torch` + `diffusers` đã có → dùng luôn.
2. **Chưa cài → kiểm tra điều kiện:**
   - `image_auto_install` có bật không? (mặc định: có)
   - Ổ cứng trống ≥ `image_min_free_gb`? (mặc định: 6 GB)
   - Có `uv` trên máy không?
3. **Đủ điều kiện → tự cài** `torch diffusers transformers accelerate safetensors` bằng `uv pip install` (một lần, ~2GB), rồi tải model (~2.5GB) vào cache Hugging Face.
4. **Thiếu điều kiện bất kỳ → ghi log khuyến nghị rõ ràng và tự dùng footage.** Ví dụ log:
   - `local AI needs ~6GB free but only 3.1GB available → using stock. Free up disk, or use a cloud image key (FLUX/DALL·E) instead.`
   - `` `uv` not found → can't auto-install local AI. Install manually: uv pip install torch diffusers … ``

> **Render không bao giờ fail vì AI local.** Mọi nhánh lỗi đều `return None` và rơi về footage.

Cài trước (không đợi lần render đầu) bằng API:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/ai/setup
```

---

## 4. Theo dõi trạng thái & cập nhật

Ba endpoint (đăng ký trong `app/controllers/v1/ai.py`):

| Endpoint | Dùng để |
|---|---|
| `GET /api/v1/ai/status` | Snapshot: đã bật? đã cài? có model? thiết bị? ổ trống? |
| `GET /api/v1/ai/check-update` | **Gọi cùng lúc với check cập nhật app** — báo có cần cài/tải gì không (`needs_setup`) kèm `recommendation` đọc-được-cho-người. |
| `POST /api/v1/ai/setup` | Cài deps + tải model (một lần). |

Ví dụ `GET /ai/check-update` khi đã bật nhưng chưa cài:

```json
{
  "feature": "local-ai-image",
  "enabled": true,
  "installed": false,
  "model": "stabilityai/sd-turbo",
  "model_present": false,
  "free_gb": 9.2,
  "min_free_gb": 6.0,
  "needs_setup": true,
  "recommendation": "Local AI enabled — run setup to install deps + download the model."
}
```

### Tích hợp với check-update của app

Khi app kiểm tra cập nhật (desktop Tauri updater / web "Có bản mới?"), **gọi thêm** `GET /api/v1/ai/check-update`:

- `enabled = false` → bỏ qua, không làm phiền (đang dùng footage).
- `needs_setup = true` → hiện gợi ý: *"AI ảnh local đang bật nhưng chưa sẵn sàng — cài ngay?"* → nút gọi `POST /ai/setup`.
- `free_gb < min_free_gb` → cảnh báo thiếu ổ, gợi ý dùng API ảnh cloud.
- ngược lại → "Local AI ready".

> Việc nối UI cụ thể (desktop/web) làm ở các app tương ứng; render đã expose đủ dữ liệu. Xem ghi chú cho `desktop-tauri` về việc gộp lời gọi này vào luồng updater.

---

## 5. Cơ chế an toàn (đã code sẵn)

- **Lazy import:** không import `torch`/`diffusers` ở mức module → máy không cài vẫn chạy render bình thường.
- **Chặn theo ổ cứng:** `image_min_free_gb` ngăn việc tải model làm đầy ổ (đã từng xảy ra khi tải sd-turbo).
- **Tự lùi về footage:** mọi lỗi (thiếu deps, tải model fail, sinh ảnh fail) → `None` → footage.
- **Không safety-checker giả báo đen:** tắt safety_checker của diffusers để tránh b-roll bị nhầm thành ảnh đen.
- **Quality gate vẫn chạy cuối:** dù dùng footage hay AI, vẫn qua `quality.py` trước khi `COMPLETE`.

---

## 6. Khi nào chọn API ảnh cloud thay vì local

Nếu muốn ảnh đẹp hơn `sd-turbo` mà không muốn quản ổ cứng/GPU:
- Dùng nhà cung cấp cloud (FLUX, DALL·E…) qua API key — không tốn ổ, chất lượng cao, nhưng **trả phí theo ảnh**.
- Hợp với người làm nội dung nghiêm túc, cần ảnh "đỉnh" và chấp nhận chi phí.
- Local `sd-turbo` hợp với: miễn phí, riêng tư, batch lớn, máy có MPS/CUDA.

> Lộ trình chi phí & "BYO key / pass-through credit" xem `docs/VIDOVA_MASTERPLAN.md`.

---

## 7. Liên quan

- `apps/render/app/services/image_gen.py` — toàn bộ vòng đời local-AI (detect/install/status/generate).
- `apps/render/app/services/task.py` — `get_video_materials` chọn nguồn: local → footage (fallback) → footage (mặc định).
- `apps/render/config.example.toml` — khối "Visuals source (Phase 3)".
- `docs/VIDOVA_VIDEO_QUALITY.md` — vì sao footage-trước cho chất lượng ổn định.
