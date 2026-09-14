# 01. Đo lường: biết cái gì chậm trước khi tối ưu

> Tối ưu mà không đo = đoán mò. Luôn đo → sửa đúng chỗ → đo lại.

## Core Web Vitals — 3 chỉ số Google quan tâm

| Chỉ số | Đo gì | Ngưỡng tốt | Chủ yếu ảnh hưởng bởi |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | Thời gian phần tử lớn nhất hiện ra | ≤ 2.5s | Ảnh/font, TTFB, JS chặn render |
| **INP** (Interaction to Next Paint) | Độ trễ khi người dùng tương tác | ≤ 200ms | JS chạy nặng trên main thread, re-render chậm |
| **CLS** (Cumulative Layout Shift) | Độ "nhảy" layout | ≤ 0.1 | Ảnh/font không đặt kích thước, nội dung chèn |

> **INP** thay thế FID (từ 3/2024). Đây là chỉ số React quan tâm nhất — re-render nặng làm
> tương tác giật. Phần lớn tài liệu này nhắm cải thiện INP.

Các chỉ số phụ (lab): **TTFB** (server phản hồi), **FCP** (hiện pixel đầu), **TBT** (thời gian
main thread bị chặn — tương quan mạnh với INP).

## Công cụ đo

### 1. Lighthouse / PageSpeed Insights
Chrome DevTools → tab **Lighthouse** → chạy audit. Cho điểm + gợi ý cụ thể (ảnh chưa nén, JS
không dùng, layout shift...). PageSpeed Insights (pagespeed.web.dev) còn có **field data** thật.

### 2. Chrome DevTools — Performance panel
Ghi lại (record) một thao tác → xem **flame chart**: hàm nào chiếm main thread, long task
(> 50ms), reflow/repaint. Đây là công cụ mạnh nhất để tìm nguyên nhân INP kém.

Tab **Coverage** (Cmd/Ctrl+Shift+P → "Coverage"): xem % CSS/JS **không dùng** → biết cần code split.

### 3. React DevTools — Profiler ⭐ (quan trọng nhất với React)
Cài extension React DevTools → tab **Profiler** → record → thao tác → stop.

- **Flamegraph**: component nào render, mất bao lâu.
- **Ranked**: xếp hạng component tốn thời gian nhất.
- Bật **"Highlight updates when components render"** (trong Settings của React DevTools) → mỗi
  component re-render sẽ **nháy viền màu** trên trang → thấy ngay chỗ re-render thừa.

### 4. `why-did-you-render` (khi debug re-render khó)
Thư viện `@welldone-software/why-did-you-render` log ra console **lý do** một component re-render
(prop nào đổi). Dùng khi Profiler chưa đủ rõ.

### 5. Đo bundle — `@next/bundle-analyzer`
```bash
npm i -D @next/bundle-analyzer
```
Cấu hình trong `next.config`, chạy `ANALYZE=true npm run build` → mở treemap thấy **thư viện nào
chiếm bao nhiêu KB** → biết cần lazy load / thay thế cái gì.

### 6. Output của `next build`
Sau mỗi build, Next in bảng các route kèm **First Load JS** (số KB người dùng tải khi vào trang).
Để ý route nào phình to bất thường.

## Đo Web Vitals ngay trong app (Next.js)

Next có hook sẵn. Tạo một client component:

```tsx
"use client";
import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric.name, metric.value); // LCP, INP, CLS...
    // production: gửi lên analytics (GA, Vercel Analytics...)
  });
  return null;
}
```

Đặt `<WebVitals />` trong `layout.tsx`. Giúp theo dõi chỉ số **thật** từ người dùng, không chỉ lab.

## Quy trình chuẩn

```
1. Đo baseline (Lighthouse + Profiler)  →  ghi lại con số
2. Xác định 1 vấn đề lớn nhất           →  vd "RecipeList re-render 200ms mỗi lần gõ search"
3. Sửa đúng chỗ đó                       →  vd debounce + memo
4. Đo lại                                →  so với baseline
5. Lặp lại cho vấn đề tiếp theo
```

Đừng tối ưu 10 chỗ cùng lúc — không biết cái nào thực sự có tác dụng.
