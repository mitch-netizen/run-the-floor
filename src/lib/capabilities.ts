// The fixed catalogue of what the software can do. Roles are venue data that
// grant a subset of these. Must match public.capabilities (migration 0001);
// src/lib/capabilities.test.ts keeps the two in step.
export const CAPABILITIES = [
  "settings.manage",
  "users.manage",
  "templates.manage",
  "checklist.run",
  "checklist.close_out",
  "venue.close",
  "shifts.manage",
  "handover.write",
  "tasks.manage",
  "functions.manage",
  "incidents.log",
  "incidents.view_restricted",
  "maintenance.log",
  "compliance.sign_off",
  "imports.run",
  "audit.view",
  "reports.view",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export function hasCapability(granted: readonly string[], capability: Capability): boolean {
  return granted.includes(capability);
}
