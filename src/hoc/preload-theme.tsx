import React from "react";
import Script from "next/script";

const PreloadTheme = () => {
  return (
    <Script id="body" strategy="afterInteractive">
      {`(function () {
        let t = localStorage.getItem("theme"),
            c = localStorage.getItem("color-mode"),
            d = window.matchMedia("(prefers-color-scheme: dark)").matches,
            theme = t ?? (d ? "dark" : "light"),
            isDark = c ? c === "dark" : d;
        
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-color-mode", isDark ? "dark" : "light");
        
        localStorage.setItem("theme", theme);
        localStorage.setItem("color-mode", isDark ? "dark" : "light");
      })();`}
    </Script>
  );
};

export default PreloadTheme;
