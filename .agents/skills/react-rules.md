---
name: react-standards
description: Mandatory React and Next.js coding standards for AI agents. Covers Rules of Hooks, component structure, TypeScript, state, effects, performance, and common agent mistakes. Apply to every React file generated or modified.
---

# React & Next.js Standards

You are a senior React engineer with strong opinions about correctness. These rules are non-negotiable. Before writing any React code, internalize every section. If you find yourself about to violate a rule, STOP, restructure, and comply before proceeding. Never generate a workaround that violates these standards just because it would "work" at runtime.

---

## 1. Rules of Hooks — CRITICAL

Violations here cause runtime crashes. React depends on hooks being called in the same order on every render. There are no exceptions.

### 1.1 Never call hooks conditionally

```tsx
// ❌ ILLEGAL — crashes at runtime
function Component({ isAuth }: Props) {
  if (isAuth) {
    const [user, setUser] = useState<User | null>(null); // NEVER
  }
}

// ✅ CORRECT — hook always runs, condition lives inside
function Component({ isAuth }: Props) {
  const [user, setUser] = useState<User | null>(null);
  if (!isAuth) return null;
  // use user here
}
```

### 1.2 Never call hooks after an early return

```tsx
// ❌ ILLEGAL — hook order changes depending on `loading`
function Component({ loading }: Props) {
  if (loading) return <Spinner />;
  const [data, setData] = useState([]); // NEVER — hook after early return
}

// ✅ CORRECT — all hooks before any return
function Component({ loading }: Props) {
  const [data, setData] = useState([]);
  if (loading) return <Spinner />;
  return <List data={data} />;
}
```

### 1.3 Never call hooks inside loops

```tsx
// ❌ ILLEGAL
items.forEach((item) => {
  const [selected, setSelected] = useState(false); // NEVER
});

// ✅ CORRECT — lift state up or create a child component with its own hook
function Item({ item }: { item: ItemType }) {
  const [selected, setSelected] = useState(false);
  return <div onClick={() => setSelected((s) => !s)}>{item.name}</div>;
}
```

### 1.4 Never call hooks inside nested functions or callbacks

```tsx
// ❌ ILLEGAL
function Component() {
  const handleClick = () => {
    const [count] = useState(0); // NEVER — hook inside callback
  };
}

// ✅ CORRECT
function Component() {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount((c) => c + 1);
}
```

### 1.5 Only call hooks from React functions

Hooks are only valid inside: function components and custom hooks (prefixed with `use`). Never in class methods, plain utilities, or event handlers.

---

## 2. Component Structure — Mandatory Order

Every functional component must follow this exact internal order. An agent that generates components in a different order is wrong.

```tsx
function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // 1. Context
  const theme = useContext(ThemeContext);

  // 2. Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // 3. State
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // 4. Derived/external state (React Query, SWR, Zustand selectors, etc.)
  const { data, isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  // 5. Effects (after all state is declared)
  useEffect(() => {
    document.title = `Count: ${count}`;
    return () => {
      document.title = "App";
    };
  }, [count]);

  // 6. Event handlers and callbacks
  const handleClick = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  // 7. Derived values (useMemo or plain const)
  const doubled = useMemo(() => count * 2, [count]);

  // 8. Early returns (ONLY after all hooks)
  if (isLoading) return <Spinner />;
  if (!data) return null;

  // 9. JSX
  return (
    <div>
      <span>{doubled}</span>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}
```

---

## 3. TypeScript — Strict Mode Only

This project uses TypeScript. Never use `any`. Never suppress errors with `// @ts-ignore` unless you add a comment explaining exactly why and what the upstream fix is.

### 3.1 Props

```tsx
// ❌ WRONG
function Button(props: any) { ... }

// ✅ CORRECT — explicit interface, no optional unless truly optional
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary'; // optional only when there is a default
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) { ... }
```

### 3.2 useState — always type non-trivial state

```tsx
// ❌ TypeScript infers `null`, then complains on assignment
const [user, setUser] = useState(null);

// ✅ CORRECT
const [user, setUser] = useState<User | null>(null);
```

### 3.3 Event handlers — always type the event

```tsx
// ❌
const handleChange = (e) => setName(e.target.value);

// ✅
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
  setName(e.target.value);
```

### 3.4 Generics over casting

```tsx
// ❌
const el = document.getElementById("root") as HTMLDivElement;

// ✅
const el = document.getElementById<HTMLDivElement>("root");
// or guard properly:
const el = document.getElementById("root");
if (!(el instanceof HTMLDivElement)) throw new Error("Root not found");
```

---

## 4. State Management

### 4.1 State updates are asynchronous — use functional form for derived state

```tsx
// ❌ Stale closure — `count` may be outdated
setCount(count + 1);

// ✅ Functional update — always gets the current value
setCount((c) => c + 1);
```

### 4.2 Batch related state or use reducers

```tsx
// ❌ Three separate re-renders
setName("John");
setAge(30);
setEmail("john@example.com");

// ✅ Option A — single object (React 18 auto-batches, but still cleaner)
const [form, setForm] = useState({ name: "", age: 0, email: "" });
setForm((f) => ({ ...f, name: "John", age: 30, email: "john@example.com" }));

// ✅ Option B — useReducer for complex state machines
```

### 4.3 Never mutate state directly

```tsx
// ❌ ILLEGAL
state.items.push(newItem);
setState(state);

// ✅ CORRECT
setState((prev) => ({ ...prev, items: [...prev.items, newItem] }));
```

### 4.4 Derived values are not state

```tsx
// ❌ Unnecessary state — keeps two sources of truth in sync
const [filteredItems, setFilteredItems] = useState([]);
useEffect(() => {
  setFilteredItems(items.filter((i) => i.active));
}, [items]);

// ✅ Derived value — computes from existing state
const filteredItems = useMemo(() => items.filter((i) => i.active), [items]);
```

---

## 5. Effects (useEffect)

### 5.1 Always return a cleanup function when registering subscriptions or timers

```tsx
// ❌ Memory leak — listener never removed
useEffect(() => {
  window.addEventListener("resize", handler);
}, []);

// ✅ CORRECT
useEffect(() => {
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}, [handler]);
```

### 5.2 Never omit dependencies — fix the cause, not the warning

```tsx
// ❌ Suppressing the lint warning is not a fix
useEffect(() => {
  fetchUser(userId);
}, []); // eslint-disable-line — NEVER DO THIS to silence exhaustive-deps

// ✅ Declare dependencies correctly
useEffect(() => {
  fetchUser(userId);
}, [userId]);
```

### 5.3 Do not use effects for data fetching in new code

Prefer TanStack Query, SWR, or Next.js `use()` / Server Components. Effects for data fetching cause waterfall renders and race conditions.

```tsx
// ❌ Anti-pattern for data fetching
useEffect(() => {
  fetch("/api/users")
    .then((r) => r.json())
    .then(setUsers);
}, []);

// ✅ Use React Query
const { data: users, isLoading } = useQuery({
  queryKey: ["users"],
  queryFn: () => fetch("/api/users").then((r) => r.json()),
});
```

### 5.4 Guard async effects against race conditions

```tsx
useEffect(() => {
  let cancelled = false;
  fetchData(id).then((data) => {
    if (!cancelled) setData(data);
  });
  return () => {
    cancelled = true;
  };
}, [id]);
```

---

## 6. Performance

### 6.1 useMemo and useCallback — only when there is a measurable cost

Do NOT wrap everything in `useMemo`/`useCallback` by default. Only use them when:

- The computation is genuinely expensive (e.g., large array transformations).
- The value is passed as a prop to a `React.memo`-wrapped child.
- The value is a dependency of another hook.

```tsx
// ❌ Premature — adds overhead for no benefit
const label = useMemo(() => `Hello ${name}`, [name]);

// ✅ Justified — expensive computation
const sortedData = useMemo(
  () => [...data].sort((a, b) => b.score - a.score),
  [data],
);
```

### 6.2 React.memo — only on components that re-render often with stable props

```tsx
// ❌ Cargo-culting memo on everything
export default React.memo(function SimpleLabel({ text }: { text: string }) {
  return <span>{text}</span>;
});

// ✅ Justified — expensive child that receives stable props
export const DataGrid = React.memo(function DataGrid({
  rows,
  columns,
}: DataGridProps) {
  // expensive render
});
```

### 6.3 Key prop — always use stable, unique keys

```tsx
// ❌ Index as key causes state corruption on reorder/delete
{
  items.map((item, index) => <Item key={index} item={item} />);
}

// ✅ Stable identity key
{
  items.map((item) => <Item key={item.id} item={item} />);
}
```

---

## 7. Next.js Specific

### 7.1 Server vs. Client Components

- Default to Server Components. Add `'use client'` only when the component needs browser APIs, event listeners, or hooks.
- Never put `'use client'` at the top of a layout or page just for convenience — push it down to the smallest leaf component that actually needs it.

```tsx
// ❌ Entire page becomes client bundle
'use client';
export default function Page() { ... }

// ✅ Only the interactive piece is client
// page.tsx (Server Component — no directive)
import { Counter } from './Counter'; // Counter has 'use client'

export default function Page() {
  return <main><Counter /></main>;
}
```

### 7.2 Data fetching in Server Components

```tsx
// ✅ Fetch directly in async Server Component — no useEffect, no useState
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await db.product.findUnique({ where: { id: params.id } });
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
```

### 7.3 useRouter — only for programmatic navigation

Never use `useRouter().push` for links. Use `<Link>` from `next/link` for all anchor-like navigation.

```tsx
// ❌
<button onClick={() => router.push('/about')}>About</button>

// ✅
<Link href="/about">About</Link>
```

### 7.4 Environment variables

- Server-only secrets: `process.env.SECRET_KEY` — never expose in client bundles.
- Client-side: must be prefixed `NEXT_PUBLIC_`.
- Never hardcode secrets in component files.

---

## 8. Common Agent Mistakes — Never Do These

These are documented patterns where AI agents repeatedly produce wrong output. Check this list before finalizing any generated code.

| Mistake                    | Wrong                                            | Correct                                       |
| -------------------------- | ------------------------------------------------ | --------------------------------------------- |
| Conditional hook           | `if (x) useState()`                              | Move hook before condition                    |
| Hook after return          | `return null; useState()`                        | Move all hooks before first return            |
| Stale state update         | `setState(count + 1)`                            | `setState(c => c + 1)`                        |
| Missing cleanup            | `addEventListener` without `removeEventListener` | Always return cleanup                         |
| Index as key               | `key={index}` in dynamic lists                   | `key={item.id}`                               |
| Mutating state             | `arr.push(x); setState(arr)`                     | `setState(prev => [...prev, x])`              |
| Derived state in useState  | `useState(a + b)` that mirrors other state       | Plain `const derived = a + b`                 |
| `any` type                 | `(e: any) =>`                                    | `(e: React.ChangeEvent<HTMLInputElement>) =>` |
| `useEffect` for data fetch | fetch inside effect                              | React Query / Server Component                |
| Missing exhaustive-deps    | empty `[]` on effect that uses variables         | declare all dependencies                      |
| `'use client'` on layout   | `'use client'` in `layout.tsx`                   | push to leaf component                        |
| Non-stable key             | `key={Math.random()}`                            | `key={item.id}`                               |

---

## 9. ESLint Enforcement

The following ESLint rules are active in this project. Generated code must pass them without disabling them:

```json
{
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": "error",
  "react/jsx-key": "error"
}
```

If you cannot satisfy a rule cleanly, explain why in a code comment and propose the proper structural fix — do not suppress the rule.

---

## 10. Self-check Before Submitting Code

Before finalizing any React file, run through this checklist mentally:

- [ ] All hooks are at the top level of the function, before any `return`.
- [ ] No hook is inside an `if`, `for`, `while`, `.map`, `.forEach`, or callback.
- [ ] All `useEffect` dependencies are declared correctly.
- [ ] All `useEffect` subscriptions have cleanup functions.
- [ ] No `any` types.
- [ ] No state mutations — always spread or use functional updates.
- [ ] No `index` used as `key` in dynamic lists.
- [ ] Derived values are `const` or `useMemo`, not `useState`.
- [ ] `'use client'` is only on the smallest component that actually needs it.
- [ ] No secrets in client-side code.
