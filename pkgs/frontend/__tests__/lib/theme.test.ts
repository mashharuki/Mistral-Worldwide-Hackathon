import { describe, expect, it } from "vitest";
import { APP_THEME, APP_THEME_CSS_VARIABLES, PAGE_STAGGER } from "../../src/lib/theme";

describe("APP_THEME", () => {
  it("uses required distinctive font families", () => {
    expect(APP_THEME.fonts.display).toContain("Space Grotesk");
    expect(APP_THEME.fonts.mono).toContain("JetBrains Mono");
  });

  it("defines responsive breakpoints for mobile and desktop", () => {
    expect(APP_THEME.breakpoints.sm).toBe(640);
    expect(APP_THEME.breakpoints.lg).toBe(1024);
  });

  it("has layered gradient background presets", () => {
    expect(APP_THEME.backgroundLayers).toHaveLength(3);
    expect(APP_THEME.backgroundLayers[0]).toContain("radial-gradient");
  });
});

describe("theme CSS variables", () => {
  it("contains bold brand and accent colors", () => {
    expect(APP_THEME_CSS_VARIABLES["--brand-primary"]).toBe("#ff5a36");
    expect(APP_THEME_CSS_VARIABLES["--brand-accent"]).toBe("#00d1b2");
  });
});

describe("PAGE_STAGGER", () => {
  it("defines base stagger animation for first paint", () => {
    expect(PAGE_STAGGER.container.transition.staggerChildren).toBe(0.1);
    expect(PAGE_STAGGER.item.hidden.y).toBe(24);
  });
});
