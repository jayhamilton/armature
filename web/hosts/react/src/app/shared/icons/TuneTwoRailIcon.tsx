// Material Icons only ships "tune" as a three-rail slider glyph, so the
// two-rail version used for the configuration buttons (toolbar menu,
// gadget-header) is a hand-drawn custom SVG. Ported from armature-ui's
// tune-two-rail.icon.ts (registered there via MatIconRegistry.addSvgIconLiteral).
export function TuneTwoRailIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <line x1="7" y1="3" x2="7" y2="9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="7" y1="18.5" x2="7" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="7" cy="14" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="17" y1="3" x2="17" y2="5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="17" y1="14.5" x2="17" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
