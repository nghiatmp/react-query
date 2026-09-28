# Bếp nhà

Ứng dụng công thức, thực đơn tuần và danh sách đi chợ. Next.js App Router, React Query, Zustand, Zod, shadcn/ui và Firebase.

## Chạy local

Yêu cầu Node 22 hoặc 24 và Java 21 cho Firebase Emulator Suite. CI dùng Node 24 / Java 21.

```bash
npm ci
npm run dev
```

Không có cấu hình Firebase: công thức demo tiếp tục dùng API RAM của dự án. Yêu thích, thực đơn và danh sách đi chợ demo lưu trên trình duyệt; công thức demo đã sửa có thể mất khi server khởi động lại. `/ssr-demo` luôn minh họa dữ liệu public từ API này.

## Firebase Emulator Suite

```bash
npx firebase emulators:start --only auth,firestore --project demo-meal-planner
NEXT_PUBLIC_FIREBASE_EMULATORS=true npm run dev
```

Firestore: `127.0.0.1:8080`; Auth: `127.0.0.1:9099`; Emulator UI: `127.0.0.1:4000`. Chỉ chạy trên máy local. Đăng nhập Google mở màn hình tài khoản giả của Auth emulator; không dùng tài khoản thật.

Khi `NEXT_PUBLIC_FIREBASE_EMULATORS=true`, SDK **luôn** dùng project `demo-meal-planner` và config giả, bỏ qua toàn bộ config production. Script test cũng chỉ định project demo. Không dùng CLI deploy trong luồng kiểm chứng này. Dữ liệu emulator mất khi tắt nếu không chủ động export.

## Cấu hình production

Copy `.env.example` thành `.env.local` (git bỏ qua), điền bốn biến public Web App config: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`. Đặt `NEXT_PUBLIC_FIREBASE_EMULATORS=false` và restart/rebuild Next khi chủ động dùng production. Không lưu service-account key vào client hoặc git.

Đã nhận Web App config của `foodsnap-ef6b5` riêng ngoài git. Probe chỉ đọc: Auth project config và Google auth URI trả HTTP 200; đọc Firestore không đăng nhập trả HTTP 403. Đây chưa phải kiểm chứng đăng nhập/dữ liệu production. Cần chủ dự án xác nhận Firestore database `(default)`, Rules owner-only tương ứng schema mới và authorized domains của môi trường triển khai. Deploy Rules, thay provider và ghi dữ liệu production cần quyền riêng theo project; task này chưa thực hiện các thao tác đó. `databaseURL` Realtime Database không dùng; Analytics không được yêu cầu.

Sau đăng nhập, dữ liệu tài khoản tách khỏi demo. Nút **Nhập công thức demo & yêu thích** cần xác nhận; chỉ thêm công thức còn thiếu và thêm yêu thích, giữ dữ liệu đã sửa trên cloud và favorites cục bộ. Tuần và giỏ demo không tự nhập. React Query refetch cloud khi focus và mỗi 30 giây ở màn hình đang hoạt động; không có Firestore snapshot subscription song song.

## Kiểm chứng

```bash
npm run lint
npm run typecheck
npm test
npm run build
# Tự bật/tắt emulator riêng khi các cổng chưa được sử dụng:
npm run test:emulators
# Khi Auth + Firestore emulator demo đã chạy:
npm run test:rules
```

Security/adapter tests chạy emulator thật, gồm owner access, anonymous/cross-user deny, malformed schema, giao dịch 30 nguyên liệu, rollback, concurrent edits và Google credential giả. CI định nghĩa trong [ci.yml](.github/workflows/ci.yml).

Hành vi và mô hình lưu trữ: [spec](doc/specs/meal-planner.md). Lệnh/kết quả và ảnh giao diện thật: [evidence](doc/evidence/meal-planner/evidence.md).
