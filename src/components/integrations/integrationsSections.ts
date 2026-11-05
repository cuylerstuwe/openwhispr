import type { ComponentType } from "react";
import { Calendar, Key, Link2, Network, SkillStack, Terminal } from "../icons";

export type IntegrationsSection = "connectors" | "skills" | "calendars" | "api" | "mcp" | "cli";

export const DEFAULT_INTEGRATIONS_SECTION: IntegrationsSection = "calendars";

export const INTEGRATIONS_SECTION_GROUPS: ReadonlyArray<{
  id: "assistant" | "meetings" | "developer";
  sections: readonly IntegrationsSection[];
}> = [
  { id: "meetings", sections: ["calendars"] },
  { id: "assistant", sections: ["skills"] },
  { id: "developer", sections: ["cli"] },
];

export const INTEGRATIONS_SECTION_ICONS: Record<
  IntegrationsSection,
  ComponentType<{ size?: number; className?: string }>
> = {
  connectors: Link2,
  skills: SkillStack,
  calendars: Calendar,
  api: Key,
  mcp: Network,
  cli: Terminal,
};

export type SectionMeta =
  { kind: "count"; value: number } | { kind: "badge"; badge: "pro" | "free" };

export interface SectionMetaInput {
  isPaid: boolean;
  /** Connectors decide their plan and org policy as the Connectors pane does. */
  connectors: { isPaid: boolean; blockedByOrg: boolean; ready: number };
  connectedCalendars: number;
}

/** The status shown beside a section in the nav: what's connected, or which plan it needs. */
export function sectionMeta(
  section: IntegrationsSection,
  { isPaid, connectors, connectedCalendars }: SectionMetaInput
): SectionMeta | null {
  if (section === "calendars" && connectedCalendars > 0)
    return { kind: "count", value: connectedCalendars };
  return null;
}

export const INTEGRATIONS_SECTIONS: readonly IntegrationsSection[] =
  INTEGRATIONS_SECTION_GROUPS.flatMap((group) => group.sections);
