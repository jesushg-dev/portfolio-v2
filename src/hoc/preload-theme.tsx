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

        if (localStorage.getItem("custom-theme-active") === "true") {
          let root = document.documentElement;
          let p = localStorage.getItem("custom-theme-primary");
          let s = localStorage.getItem("custom-theme-secondary");
          let bg = localStorage.getItem("custom-theme-background");
          let cd = localStorage.getItem("custom-theme-card");
          let fg = localStorage.getItem("custom-theme-foreground");
          let bd = localStorage.getItem("custom-theme-border");
          if (p) root.style.setProperty("--primary", p);
          if (s) root.style.setProperty("--secondary", s);
          if (bg) root.style.setProperty("--background", bg);
          if (cd) root.style.setProperty("--card", cd);
          if (fg) root.style.setProperty("--foreground", fg);
          if (bd) root.style.setProperty("--border", bd);
        }
      })();`}
    </Script>
  );
};

export default PreloadTheme;
