import type { CSSProperties, ReactNode } from 'react';

/**
 * Renders a Material Icons ligature name as text (e.g. "bar_chart",
 * "dashboard") via the Material Icons web font — the same ligature-name
 * convention library.json/gadget icons already use (see armature-ui's
 * CLAUDE.md: "Set icon to a Material Icons ligature name ... rendered
 * directly as <mat-icon>"). Loaded via the Google Fonts link in index.html.
 */
export function MatIcon({
  children,
  className,
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return (
    <span
      className={['material-icons', className].filter(Boolean).join(' ')}
      onClick={onClick}
      style={{
        fontSize: 24,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
