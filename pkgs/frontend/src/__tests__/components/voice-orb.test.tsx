// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VoiceOrb } from "../../components/voice-orb";

afterEach(() => {
  cleanup();
});

describe("VoiceOrb", () => {
  it("shows connected + speaking state labels", () => {
    render(
      <VoiceOrb
        connectionState="connected"
        activityState="speaking"
        micLevel={0.7}
      />,
    );

    expect(screen.getByText("connected")).toBeInTheDocument();
    expect(screen.getByText("speaking")).toBeInTheDocument();
  });

  it("applies state class names for animation variants", () => {
    render(
      <VoiceOrb
        connectionState="connecting"
        activityState="thinking"
        micLevel={0.3}
      />,
    );

    const root = screen.getByTestId("voice-orb");
    expect(root.className).toContain("voice-orb--connecting");
    expect(root.className).toContain("voice-orb--thinking");
  });

  it("clamps mic level and exposes it as CSS variable", () => {
    render(
      <VoiceOrb
        connectionState="connected"
        activityState="listening"
        micLevel={2}
      />,
    );

    const root = screen.getByTestId("voice-orb");
    expect(root.style.getPropertyValue("--voice-level")).toBe("1");
  });
});
