// Central enum-like definitions for UI select sources
// Topics and Roles as specified by the Referenz Projekte feature

export const Topics = [
  'Testmanagement',
  'Migration',
  'Cut Over',
  'Agile Transformation',
  'Digitale Transformation',
  'Prozessoptimierung',
  'Regulatorik/Compliance',
  'Informationssicherheit',
] as const;

export type Topic = typeof Topics[number];

export const topicsOptions: { value: Topic; label: string }[] = Topics.map((t) => ({ value: t, label: t }));

export const Roles = [
  'Projektleiter',
  'IT-Projektleiter',
  'PMO',
  'Testmanager',
  'Projektunterstützung',
  'Business-Analyst',
  'Scrum-Master',
  'Tester',
  'TPL',
  'PO',
] as const;

export type Role = typeof Roles[number];

export const roleOptions: { value: Role; label: string }[] = Roles.map((r) => ({ value: r, label: r }));

// Main Focus areas for Kurzprofil (up to 4 selectable)
export const MainFocusAreas = [
  'Banken und Finanzdienstleistungen',
  'Projektleiter',
  'IT-Projektleiter',
  'PMO',
  'Testmanager',
  'Projektunterstützung',
  'Business-Analyst',
  'Scrum-Master',
] as const;

export type MainFocus = typeof MainFocusAreas[number];
export const mainFocusOptions: { value: MainFocus; label: string }[] = MainFocusAreas.map((m) => ({ value: m, label: m }));
