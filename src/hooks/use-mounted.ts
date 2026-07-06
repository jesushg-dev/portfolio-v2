import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {
  /* empty */
};

export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
