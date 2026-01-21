---
description: 如何為 React/Next.js 組件撰寫穩定的單元測試
---

# 前端單元測試技巧

本專案使用 **Vitest + React Testing Library** 進行測試。

## 執行測試

```bash
# 執行所有測試
pnpm test

# 監看模式
pnpm test:watch

# 覆蓋率報告
pnpm test:coverage
```

---

## 測試檔案結構

測試檔案應該放在被測試檔案的旁邊：

```
components/
├── MyComponent.tsx
└── MyComponent.test.tsx    # ✅ 測試放在旁邊
```

---

## 測試模板

### 基礎組件測試

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  const defaultProps = {
    // 定義預設 props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render correctly", () => {
      render(<MyComponent {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /submit/i }),
      ).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onClick when button clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<MyComponent {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Hook 測試

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMyHook } from "./useMyHook";

describe("useMyHook", () => {
  it("should return initial state", () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });

  it("should update state on action", async () => {
    const { result } = renderHook(() => useMyHook());

    await act(async () => {
      result.current.increment();
    });

    expect(result.current.value).toBe(1);
  });
});
```

### Redux 相關組件測試

```tsx
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import mySlice from "./mySlice";

// 建立測試用 store
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: { mySlice },
    preloadedState,
  });
};

// 測試包裝器
const renderWithStore = (ui: React.ReactElement, store = createTestStore()) => {
  return render(<Provider store={store}>{ui}</Provider>);
};
```

### Next.js 頁面測試（需要大量 mock）

```tsx
// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

// Mock 子組件以簡化測試
vi.mock("@/components/Header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
```

---

## 穩定查詢方式（按優先順序）

| 優先級 | 查詢方式               | 說明                       |
| ------ | ---------------------- | -------------------------- |
| 1️⃣     | `getByRole`            | 最推薦，基於無障礙角色     |
| 2️⃣     | `getByLabelText`       | 表單元素                   |
| 3️⃣     | `getByPlaceholderText` | 輸入框                     |
| 4️⃣     | `getByText`            | 可見文字                   |
| 5️⃣     | `getByTestId`          | 最後手段，需加 data-testid |

### ❌ 避免使用

```tsx
// 脆弱 - 依賴 CSS class
screen.getByClassName("btn-primary");

// 脆弱 - 依賴 DOM 結構
screen.getByText("Click").closest("button");

// 脆弱 - 精確文字匹配
screen.getByText("Submit Button");
```

### ✅ 推薦使用

```tsx
// 穩定 - ARIA 角色
screen.getByRole("button", { name: /submit/i });

// 穩定 - 正規表達式
screen.getByText(/submit/i);

// 穩定 - 明確的 testid
screen.getByTestId("submit-button");
```

---

## userEvent vs fireEvent

**永遠使用 `userEvent`**，它更貼近真實用戶行為：

```tsx
// ❌ 避免
fireEvent.click(button);

// ✅ 推薦
const user = userEvent.setup();
await user.click(button);
```

### 使用 fake timers 時

```tsx
import { vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

it("should handle async", async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  // ...
});
```

---

## 非同步處理

### findBy... (自動等待)

```tsx
// 等待元素出現（預設 1 秒）
const button = await screen.findByRole("button");
```

### waitFor (自定義等待)

```tsx
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});
```

---

## Mock 常見項目

### fetch

```tsx
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: "test" }),
  });
});
```

### localStorage

```tsx
// 已在 setupTests.ts 中全域 mock
vi.spyOn(Storage.prototype, "getItem").mockReturnValue("token123");
```

### 外部模組

```tsx
vi.mock("@monaco-editor/react", () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
```

---

## 常見錯誤排解

### 1. 多重元素匹配

```tsx
// ❌ 錯誤
screen.getByText(/submit/); // 找到多個

// ✅ 解法 1: 更精確的查詢
screen.getByRole("button", { name: /submit/i });

// ✅ 解法 2: 使用 getAllByText
const elements = screen.getAllByText(/submit/);
const targetElement = elements.find((el) => el.tagName === "BUTTON");
```

### 2. Invalid hook call

Redux 或 Router 需要 Provider 包裝：

```tsx
// 需要包裝
render(
  <Provider store={store}>
    <RouterContext.Provider value={router}>
      <MyComponent />
    </RouterContext.Provider>
  </Provider>,
);
```

### 3. 間歇性失敗

- 使用 `waitFor` 或 `findBy...`
- 確保 `beforeEach` 有 `vi.clearAllMocks()`
- 使用 fake timers 控制時間

---

## 測試覆蓋原則

1. **測試行為，不測實作**
2. **測試使用者能看到/做的事**
3. **不測 CSS 樣式或 DOM 結構**
4. **Mock 外部依賴**（API、瀏覽器 API）
5. **每個測試獨立運行**

---

## 現有測試參考

| 檔案                                                | 說明                           |
| --------------------------------------------------- | ------------------------------ |
| `lib/utils.test.ts`                                 | 純函數測試                     |
| `lib/store/slices/questionsSlice.test.ts`           | Redux reducer 測試             |
| `lib/api/questions.test.ts`                         | API 模組測試（mock apiClient） |
| `hooks/usePyodide.test.ts`                          | 複雜 hook 測試                 |
| `hooks/useRemoteExecution.test.ts`                  | SSE streaming hook 測試        |
| `components/exam/EditorPanel.test.tsx`              | 組件 + userEvent               |
| `components/exam/ConsolePanel.test.tsx`             | Tab 切換測試                   |
| `components/exam/StreamingSubmissionModal.test.tsx` | 動畫 + fake timers             |
