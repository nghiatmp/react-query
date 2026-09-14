# 09. Hình ảnh & Font — cải thiện LCP và CLS

Ảnh và font thường là **thủ phạm chính** của LCP chậm và CLS (layout nhảy). Next.js có công cụ
sẵn giải quyết gần hết.

## `next/image` — tối ưu ảnh tự động

Dùng `<Image>` của Next thay `<img>` để được:

- **Resize + đổi định dạng** tự động sang WebP/AVIF (nhẹ hơn JPEG/PNG nhiều).
- **Lazy load** mặc định (ảnh ngoài viewport chỉ tải khi cuộn tới).
- **Chống CLS**: bắt buộc khai báo `width`/`height` (hoặc `fill`) → trình duyệt chừa sẵn chỗ,
  ảnh không "đẩy" layout khi tải xong.
- **`srcset` responsive**: gửi ảnh đúng kích thước cho từng màn hình.

```tsx
import Image from "next/image";

<Image
  src="/recipes/carbonara.jpg"
  alt="Spaghetti Carbonara"
  width={400}
  height={300}
  // ảnh LCP (ảnh lớn hiện đầu trang) → thêm priority để tải sớm, KHÔNG lazy
  priority
/>
```

### Quy tắc `priority`
- Ảnh **LCP** (banner/hero/ảnh đầu tiên người dùng thấy) → `priority` (tải ngay, ưu tiên cao).
- Ảnh dưới màn hình → **không** `priority` (để lazy load).
- Đặt `priority` cho quá nhiều ảnh = mất tác dụng (mọi thứ "ưu tiên" = không có gì ưu tiên).

### `sizes` cho ảnh responsive/`fill`
Giúp Next chọn đúng độ phân giải, tránh tải ảnh quá to:
```tsx
<Image src={...} fill sizes="(max-width: 768px) 100vw, 33vw" alt="..." />
```

### `placeholder="blur"`
Hiện ảnh mờ (blur) trong lúc tải → cảm giác nhanh hơn, đỡ trống trải.

> Ảnh từ domain ngoài phải khai báo `remotePatterns` trong `next.config`.

## `next/font` — font không gây layout shift

Font web tải chậm gây 2 vấn đề: **FOIT/FOUT** (chữ nhấp nháy) và **CLS** (đổi font → text xê dịch).
`next/font` self-host font, tối ưu sẵn:

```tsx
import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",            // hiện font hệ thống trước, đổi sang font thật khi tải xong
  variable: "--font-geist-sans",
});
```

Lợi ích tự động:
- **Self-host**: font tải từ domain của bạn (không request sang Google) → nhanh + riêng tư hơn.
- **Không CLS**: Next tính sẵn `size-adjust` để font dự phòng và font thật chiếm chỗ **bằng nhau**
  → không nhảy layout khi đổi.
- **Subset**: chỉ tải bộ ký tự cần (`latin`) → file nhỏ.

> Recipe Planner đã dùng `next/font` (Geist) trong `layout.tsx` — đúng chuẩn.

### `font-display`
- `swap`: hiện text ngay bằng font dự phòng, đổi khi font thật xong (tránh chữ vô hình). Mặc định tốt.
- `optional`: nếu font không kịp tải nhanh thì bỏ qua luôn → ưu tiên tốc độ tuyệt đối.

## Các nguồn gây CLS khác (ngoài ảnh/font)

CLS = layout "nhảy". Ngoài ảnh/font chưa đặt kích thước, còn do:

- **Nội dung chèn động** (banner, ad, "đang tải..." đẩy nội dung xuống) → chừa sẵn chỗ (min-height).
- **Component tải sau** không giữ chỗ → dùng **skeleton cùng kích thước** với nội dung thật.
- Dùng `aspect-ratio` trong CSS để giữ tỉ lệ khung ảnh/video trước khi tải.

```css
.recipe-thumb { aspect-ratio: 4 / 3; width: 100%; }  /* chừa chỗ trước khi ảnh về */
```

## Checklist ảnh & font

1. [ ] Dùng `next/image` thay `<img>`?
2. [ ] Ảnh LCP có `priority`, ảnh khác để lazy?
3. [ ] Mọi ảnh có `width`/`height` (hoặc `fill` + container có kích thước)?
4. [ ] Dùng `next/font` với `display: "swap"`?
5. [ ] Nội dung tải sau có giữ chỗ (skeleton/min-height/aspect-ratio) để không gây CLS?
