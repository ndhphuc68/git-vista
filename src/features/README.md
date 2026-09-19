# features/

Mỗi feature là một lát nghiệp vụ tự chứa. Cấu trúc bắt buộc:

```
features/<name>/
├─ api/          React Query hooks bọc ipc/<domain>. Nơi DUY NHẤT của feature được import ipc/.
├─ components/   UI. Không biết IPC, không biết query key.
├─ model/        (tuỳ chọn) logic thuần: dựng cây, union trạng thái, transform.
└─ index.ts      Cổng public DUY NHẤT. Ngoài feature chỉ được import từ đây.
```

## Năm quy tắc bất biến

1. Phụ thuộc chỉ đi xuống: `features → shared → domain`.
2. `features/a` KHÔNG import `features/b`. Cần dùng chung thì đẩy xuống `shared/`.
3. `shared/ui/` KHÔNG import `ipc/`, `store/`, `i18n/`. Nhận mọi thứ qua props.
4. Component KHÔNG gọi `invokeCommand` trực tiếp. Luôn đi qua `features/*/api`.
5. KHÔNG viết query key literal. Luôn dùng `domain/queryKeys`.

Quy tắc 3 và 4 được `no-restricted-imports` trong `.oxlintrc.json` ép buộc.
Quy tắc 5 được `scripts/check-query-keys.mjs` ép buộc.
Quy tắc 1 và 2 được `src/test/architectureBoundaries.test.ts` ép buộc.

## Thêm một feature mới

1. Tạo `features/<name>/{api,components}/` và `index.ts`.
2. `api/` gọi `ipc/<domain>` — tầng này đã được tách sẵn ở Giai đoạn 4.
3. Mutation hook tự invalidate `qk.repo.all(repoPath)`; call site không phải nhớ.
4. `index.ts` chỉ export những gì bên ngoài thật sự cần.

## Cache invalidation

Mutation hook sở hữu việc invalidate. Mọi query key đều có tiền tố
`["repo", repoPath]`, nên `qk.repo.all(repoPath)` phủ trùm toàn bộ một repo.
Call site không tự invalidate — nếu thấy mình đang gọi `invalidateQueries`
trong một component, logic đó thuộc về `api/`.
