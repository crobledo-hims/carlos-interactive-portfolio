import {
  GaugeGlyph,
  LinkedInGlyph,
  MailGlyph,
  PulseGlyph,
  ResumeGlyph,
  RexGlyph,
  TerminalGlyph,
} from "../icons";
import type { AppDef, AppId, ScreenId } from "../types";
import { GaugeApp } from "./GaugeApp";
import { MailApp } from "./MailApp";
import { PulseApp } from "./PulseApp";
import { ResumeApp } from "./ResumeApp";
import { RexApp } from "./RexApp";
import { TerminalApp } from "./TerminalApp";

/**
 * One registry for both screens. A screen only decides which apps get a
 * desktop icon and a dock slot — any app can be opened from anywhere (the
 * terminal's `open rex` relies on that).
 */
export const APPS: Record<AppId, AppDef> = {
  rex: {
    id: "rex",
    name: "Rex",
    subtitle: "Recruiting operations, automated",
    tile: "linear-gradient(155deg,#5f4b8b,#3a2a5c)",
    glyph: <RexGlyph />,
    rect: { x: 148, y: 78, w: 900, h: 588 },
    minW: 620,
    minH: 380,
    Component: RexApp,
  },
  pulse: {
    id: "pulse",
    name: "Pulse",
    subtitle: "Pipeline health and hiring forecasts",
    tile: "linear-gradient(155deg,#1f9d6b,#0e5540)",
    glyph: <PulseGlyph />,
    rect: { x: 196, y: 100, w: 880, h: 580 },
    minW: 560,
    minH: 360,
    Component: PulseApp,
  },
  gauge: {
    id: "gauge",
    name: "Gauge",
    subtitle: "AI-assisted candidate evaluation",
    tile: "linear-gradient(155deg,#e0933c,#a94e26)",
    glyph: <GaugeGlyph />,
    rect: { x: 168, y: 66, w: 940, h: 618 },
    minW: 640,
    minH: 400,
    Component: GaugeApp,
  },
  resume: {
    id: "resume",
    name: "Resume",
    subtitle: "Carlos Robledo — Technical Sourcing Lead",
    tile: "linear-gradient(155deg,#e8ebf2,#b7bdcd)",
    glyph: <ResumeGlyph />,
    rect: { x: 312, y: 54, w: 700, h: 640 },
    minW: 480,
    minH: 360,
    Component: ResumeApp,
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    subtitle: "linkedin.com/in/thecarlosrobledo",
    tile: "linear-gradient(155deg,#3d84cf,#14568f)",
    glyph: <LinkedInGlyph />,
    href: "https://linkedin.com/in/thecarlosrobledo",
    rect: { x: 0, y: 0, w: 0, h: 0 },
    minW: 0,
    minH: 0,
    Component: null,
  },
  mail: {
    id: "mail",
    name: "Mail",
    subtitle: "Say hello",
    tile: "linear-gradient(155deg,#63b0f2,#2668c8)",
    glyph: <MailGlyph />,
    rect: { x: 372, y: 188, w: 560, h: 404 },
    minW: 400,
    minH: 300,
    Component: MailApp,
  },
  terminal: {
    id: "terminal",
    name: "Terminal",
    subtitle: "zsh — 80x24",
    tile: "linear-gradient(155deg,#3a3f47,#15181c)",
    glyph: <TerminalGlyph />,
    rect: { x: 258, y: 244, w: 660, h: 396 },
    minW: 380,
    minH: 240,
    Component: TerminalApp,
  },
};

/** Apps pinned to each screen's desktop and dock. */
export const SCREEN_APPS: Record<ScreenId, AppId[]> = {
  left: ["rex", "pulse", "gauge"],
  right: ["resume", "linkedin", "mail", "terminal"],
};

export const SCREEN_LABEL: Record<ScreenId, string> = {
  left: "Work",
  right: "Personal",
};
