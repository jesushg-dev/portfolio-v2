export { generateMetadata } from "./metadata";

import ThemeCustomizerView from "./theme-customizer-view";
import { Toaster } from "@/components/ui/sonner";

export default function ThemeCustomizerPage() {
  return (
    <>
      <ThemeCustomizerView />
      <Toaster />
    </>
  );
}
