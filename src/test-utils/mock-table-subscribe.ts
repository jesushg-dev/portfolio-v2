import type { ReactNode } from "react";

interface MockSubscribeProps<TState, TSelected = TState> {
  selector: (state: TState) => TSelected;
  children: ((selected: TSelected) => ReactNode) | ReactNode;
}

export function createMockSubscribe<TState>(state: TState) {
  return function MockSubscribe<TSelected>({
    selector,
    children,
  }: MockSubscribeProps<TState, TSelected>) {
    const selected = selector(state);
    return typeof children === "function" ? children(selected) : children;
  };
}
