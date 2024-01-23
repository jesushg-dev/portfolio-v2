import React from "react";
import Script from "next/script";

const PreloadTheme = () => {
  return (
    <Script id="body" strategy="afterInteractive">
      {`!function(){let e=function e(){let t=window.localStorage.getItem("theme"),a=window.localStorage.getItem("color-mode");if("string"==typeof a&&"string"==typeof t)return{theme:t,isDark:"dark"===a};let r=window.matchMedia("(prefers-color-scheme: dark)"),m="boolean"==typeof r.matches;return m&&r.matches?{theme:"main-dark",isDark:!0}:{theme:"main-light",isDark:!1}}(),t=document.documentElement;t.removeAttribute("class"),t.classList.add("theme-"+e.theme),t.setAttribute("data-theme",e.theme),t.setAttribute("data-color-mode",e.isDark?"dark":"light"),localStorage.setItem("theme",e.theme),localStorage.setItem("color-mode",e.isDark?"dark":"light")}();`}
    </Script>
  );
};

/*
- Check localStorage
- Check the media query
- Update our CSS variables depending on those values.

(function () {
  function getInitialColorMode() {
    const persistedThemePreference = window.localStorage.getItem("theme");
    const persistedColorPreference = window.localStorage.getItem("color-mode");

    const hasPersistedPreference =
      typeof persistedColorPreference === "string" &&
      typeof persistedThemePreference === "string";

    if (hasPersistedPreference) {
      return {
        theme: persistedThemePreference,
        isDark: persistedColorPreference === "dark",
      };
    }

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const hasMediaQueryPreference = typeof mql.matches === "boolean";
    if (hasMediaQueryPreference) {
      return mql.matches
        ? { theme: "main-dark", isDark: true }
        : { theme: "main-light", isDark: false };
    }

    return { theme: "main-light", isDark: false };
  }
  const colorMode = getInitialColorMode();

  const root = document.documentElement;
  root.removeAttribute("class");
  root.classList.add("theme-" + colorMode.theme);
  root.setAttribute("data-theme", colorMode.theme);
  root.setAttribute("data-color-mode", colorMode.isDark ? "dark" : "light");
  localStorage.setItem('theme', colorMode.theme);
  localStorage.setItem('color-mode', colorMode.isDark ? "dark" : "light");
})();
*/

export default PreloadTheme;
