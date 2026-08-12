// Curated illustration ids, independent of unDraw's own file naming (see
// src/assets/images/illustrations/README.md for how SVGs are added here).
export interface IllustrationOption {
  id: string;
  label: string;
}

export const ILLUSTRATION_OPTIONS: IllustrationOption[] = [
  { id: 'empty-state', label: 'Empty State' },
  { id: 'no-data', label: 'No Data' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'celebration', label: 'Celebration' },
  { id: 'team', label: 'Team' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'server-down', label: 'Server Down' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'search', label: 'Search' },
  { id: 'settings', label: 'Settings' },
  { id: 'security', label: 'Security' },
];

export const ILLUSTRATIONS_BASE_PATH = 'assets/images/illustrations/';

export function illustrationSrc(id: string): string {
  return `${ILLUSTRATIONS_BASE_PATH}${id}.svg`;
}

// Shared size presets - used both by the standalone Illustration gadget
// (applied as a live style binding) and by the Text gadget's "Insert
// illustration" toolbar action (baked into the inserted <img width="...">,
// since markdown content is static text once inserted).
export type IllustrationSize = 'small' | 'medium' | 'large';

export const ILLUSTRATION_SIZE_PX: Record<IllustrationSize, number> = {
  small: 120,
  medium: 240,
  large: 400,
};

export const ILLUSTRATION_SIZE_OPTIONS: { key: IllustrationSize; value: string }[] = [
  { key: 'small', value: 'Small' },
  { key: 'medium', value: 'Medium' },
  { key: 'large', value: 'Large' },
];
