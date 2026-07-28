/**
 * Shared design tokens for the jehg.dev transactional emails.
 * Pulled directly from the real jehg.dev brand (royal blue + white,
 * the same blue used across the site nav, buttons and the "Jehg" wordmark)
 * instead of an invented theme, so these emails feel like a natural
 * extension of the portfolio and of the signature Jesús already uses.
 */
export const theme = {
  colors: {
    pageBackground: "#F2F5FC", // soft blue-tinted grey, sits behind the card
    cardBackground: "#FFFFFF",
    brand: "#2E5AEB", // the jehg.dev royal blue — wordmark, links, buttons, banner
    brandDark: "#1E44C7",
    textPrimary: "#111827",
    textSecondary: "#4B5563",
    textMuted: "#9CA3AF",
    border: "#E5E9F2",
    codeBackground: "#F5F7FB",
  },
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  radius: "10px",
};

export const links = {
  portfolio: "https://jehg.dev",
  linkedin: "https://linkedin.com/in/jesushg-dev",
  website: "https://www.jesushg.com",
  github: "https://github.com/REPLACE_ME", // no la tenía en la firma, poné la real
  email: "[email protected]", // reemplazá por tu correo real de contacto
  phone: "tel:+505REPLACE_ME", // reemplazá por tu número real
  location: "Masaya, Nicaragua",
  // Apuntá esto a la misma foto que ya usás en el hero de jehg.dev
  // (mejor que recortar un screenshot: misma calidad, un solo lugar para actualizarla)
  avatarUrl: "https://jehg.dev/images/profile.jpg",
};
