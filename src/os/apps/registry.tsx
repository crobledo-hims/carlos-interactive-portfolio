import {
  BeaconGlyph,
  LensGlyph,
  LinkedInGlyph,
  MailGlyph,
  RelayGlyph,
  ResumeGlyph,
  CadenceGlyph,
  TerminalGlyph,
} from "../icons";
import type { AppDef, AppId, ScreenId } from "../types";
import { BeaconApp } from "./BeaconApp";
import { LensApp } from "./LensApp";
import { LinkedInApp } from "./LinkedInApp";
import { MailApp } from "./MailApp";
import { RelayApp } from "./RelayApp";
import { ResumeApp } from "./ResumeApp";
import { CadenceApp } from "./CadenceApp";
import { TerminalApp } from "./TerminalApp";

/**
 * One registry for both screens. A screen only decides which apps get a
 * desktop icon and a dock slot — any app can be opened from anywhere (the
 * terminal's `open cadence` relies on that).
 */
export const APPS: Record<AppId, AppDef> = {
  cadence: {
    id: "cadence",
    name: "Cadence",
    subtitle: "Recruiting Operations",
    description: "Keeps recruiting teams informed and workflows moving.",
    tile: "linear-gradient(155deg,#5f4b8b,#3a2a5c)",
    glyph: <CadenceGlyph />,
    rect: { x: 74, y: 40, w: 940, h: 572 },
    minW: 560,
    minH: 360,
    Component: CadenceApp,
  },
  beacon: {
    id: "beacon",
    name: "Beacon",
    subtitle: "Role Intelligence",
    description: "See where recruiting attention is needed.",
    tile: "linear-gradient(155deg,#1f9d6b,#0e5540)",
    glyph: <BeaconGlyph />,
    rect: { x: 92, y: 44, w: 910, h: 560 },
    minW: 520,
    minH: 340,
    Component: BeaconApp,
  },
  lens: {
    id: "lens",
    name: "Lens",
    subtitle: "Candidate Evaluation",
    description: "Evaluate candidate evidence against role criteria.",
    tile: "linear-gradient(155deg,#e0933c,#a94e26)",
    glyph: <LensGlyph />,
    rect: { x: 66, y: 38, w: 950, h: 574 },
    minW: 580,
    minH: 380,
    Component: LensApp,
  },
  relay: {
    id: "relay",
    name: "Relay",
    subtitle: "Candidate communication and recruiter preparation",
    tile: "linear-gradient(155deg,#6172e4,#2b3590)",
    glyph: <RelayGlyph />,
    rect: { x: 78, y: 38, w: 946, h: 574 },
    minW: 620,
    minH: 380,
    Component: RelayApp,
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
    rect: { x: 84, y: 40, w: 920, h: 572 },
    minW: 520,
    minH: 360,
    Component: LinkedInApp,
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
  left: ["cadence", "beacon", "lens", "relay"],
  right: ["resume", "linkedin", "mail", "terminal"],
};

export const SCREEN_LABEL: Record<ScreenId, string> = {
  left: "Work",
  right: "Personal",
};
