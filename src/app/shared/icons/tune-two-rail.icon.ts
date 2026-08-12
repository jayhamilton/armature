// Material Icons only ships "tune" as a three-rail slider glyph, so the
// two-rail version used for the configuration buttons (menu toolbar,
// gadget-header) is a hand-drawn custom SVG registered under this name.
// Drawn vertical (two upright rails, each with a knob at a different
// height) rather than the horizontal-then-CSS-rotated approach used
// originally, to match the reference vertical-sliders icon design.
export const TUNE_TWO_RAIL_ICON_NAME = 'tune-two-rail';

export const TUNE_TWO_RAIL_ICON_SVG = `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <line x1="7" y1="3" x2="7" y2="9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <line x1="7" y1="18.5" x2="7" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="7" cy="14" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
  <line x1="17" y1="3" x2="17" y2="5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <line x1="17" y1="14.5" x2="17" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="17" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>
`;
