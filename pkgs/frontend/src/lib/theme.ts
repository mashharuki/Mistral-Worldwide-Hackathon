export const APP_THEME = {
  fonts: {
    display: '"Space Grotesk", "Noto Sans JP", sans-serif',
    mono: '"JetBrains Mono", "Noto Sans JP", monospace',
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  backgroundLayers: [
    "radial-gradient(circle at 16% 18%, color-mix(in srgb, var(--brand-primary) 24%, transparent), transparent 46%)",
    "radial-gradient(circle at 80% 12%, color-mix(in srgb, var(--brand-secondary) 26%, transparent), transparent 52%)",
    "linear-gradient(140deg, var(--surface-base) 0%, var(--surface-muted) 62%, color-mix(in srgb, var(--brand-accent) 8%, var(--surface-base)) 100%)",
  ],
} as const;

export const APP_THEME_CSS_VARIABLES = {
  "--brand-primary": "#e27d60",
  "--brand-secondary": "#8e8d8a",
  "--brand-accent": "#859b8e",
  "--surface-base": "#f5f2ed",
  "--surface-muted": "#ece8e2",
  "--ink-primary": "#413f3d",
  "--ink-subtle": "#8e8d8a",
  "--card-bg": "#ffffffb3",
} as const;

export const PAGE_STAGGER = {
  container: {
    hidden: { opacity: 0 },
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.04,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.04,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  },
} as const;
