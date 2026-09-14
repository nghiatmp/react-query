# ⚡ Tối ưu Performance — chuyên sâu React & Next.js

Bộ tài liệu tập trung vào **tối ưu hiệu năng cho ứng dụng React 19 / Next.js 16 (App Router)**:
hiểu cơ chế re-render, memo hóa, Server Components, streaming, caching. Có ví dụ gắn với chính
dự án Recipe Planner.

## Thứ tự đọc

| # | File | Nội dung |
|---|------|----------|
| 01 | [01-do-luong.md](01-do-luong.md) | Đo trước khi tối ưu: Core Web Vitals, React Profiler, bundle analyzer |
| 02 | [02-re-render-react.md](02-re-render-react.md) | Vì sao component re-render, khi nào là "thừa" |
| 03 | [03-memo-hoa.md](03-memo-hoa.md) | `React.memo`, `useMemo`, `useCallback`, **React Compiler** |
| 04 | [04-state-context.md](04-state-context.md) | Colocation state, tách Context, `useTransition`/`useDeferredValue` |
| 05 | [05-danh-sach-lon.md](05-danh-sach-lon.md) | Key ổn định, **virtualization**, phân trang/infinite |
| 06 | [06-server-components-bundle.md](06-server-components-bundle.md) | RSC giảm JS, ranh giới `"use client"`, code splitting, `next/dynamic` |
| 07 | [07-nextjs-rendering-streaming.md](07-nextjs-rendering-streaming.md) | SSG/ISR/SSR/dynamic, streaming + `<Suspense>`, `loading.tsx`, prefetch |
| 08 | [08-caching-du-lieu.md](08-caching-du-lieu.md) | Caching Next.js, React Query, dedupe, prefetch khi hover |
| 09 | [09-hinh-anh-font.md](09-hinh-anh-font.md) | `next/image`, `next/font` — LCP & CLS |
| 10 | [10-checklist.md](10-checklist.md) | ⭐ Checklist & tip thực chiến |

## Nguyên tắc vàng

> **Đo trước, tối ưu sau.** Đừng memo hóa hay tách component theo cảm tính. Dùng Profiler xác định
> đúng chỗ chậm, sửa, rồi đo lại. Tối ưu mù thường làm code phức tạp mà không nhanh hơn.

## Ba tầng tối ưu (từ tác động lớn → nhỏ)

1. **Tầng mạng/tải** (tác động lớn nhất): giảm JS gửi về (Server Components), code splitting,
   tối ưu ảnh/font, caching. → file 06, 07, 08, 09.
2. **Tầng render** (khi app đã tương tác): giảm re-render thừa, memo hóa, virtualization.
   → file 02, 03, 04, 05.
3. **Tầng đo lường** (xuyên suốt): biết cái gì chậm. → file 01.

## Phiên bản

| | Version | Ghi chú perf |
|---|---|---|
| React | 19 | Có **React Compiler** (tự memo hóa), `useTransition`, `use()` |
| Next.js | 16 | App Router, Server Components mặc định, streaming, Turbopack |

> ⚠️ Chi tiết caching của Next.js thay đổi khá nhiều giữa các version. Với đặc thù build
> của dự án này, luôn đối chiếu doc trong `node_modules/next/dist/docs/` khi cần con số/API chính xác.
