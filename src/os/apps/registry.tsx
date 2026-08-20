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
    rect: { x: 74, y: 40, w: 940, h: 572 },
    minW: 560,
    minH: 360,
    Component: RexApp,
  },
  pulse: {
    id: "pulse",
    name: "Pulse",
    subtitle: "Pipeline health and hiring forecasts",
    tile: "linear-gradient(155deg,#1f9d6b,#0e5540)",
    glyph: <PulseGlyph />,
    rect: { x: 92, y: 44, w: 910, h: 560 },
    minW: 520,
    minH: 340,
    Component: PulseApp,
  },
  gauge: {
    id: "gauge",
    name: "Gauge",
    subtitle: "AI-assisted candidate evaluation",
    tile: "linear-gradient(155deg,#e0933c,#a94e26)",
    glyph: <GaugeGlyph />,
    rect: { x: 66, y: 38, w: 950, h: 574 },
    minW: 580,
    minH: 380,
    Component: GaugeApp,
  },
  resume: {
    id: "resume",
    name: "Resume",
    subtitle: "Carlos Robledo — Technical Sourcing Lead",
    tile: "linear-gradient(155deg,#e8ebf2,#b7bdcd)",
    glyph: <ResumeGlyph />,
    rect: { x: 176, y: 38, w: 760, h: 570 },
    minW: 440,
    minH: 340,
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
    rect: { x: 258, y: 106, w: 630, h: 446 },
    minW: 380,
    minH: 290,
    Component: MailApp,
  },
  terminal: {
    id: "terminal",
    name: "Terminal",
    subtitle: "zsh — 80x24",
    tile: "linear-gradient(155deg,#3a3f47,#15181c)",
    glyph: <TerminalGlyph />,
    rect: { x: 196, y: 138, w: 740, h: 440 },
    minW: 360,
    minH: 230,
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
