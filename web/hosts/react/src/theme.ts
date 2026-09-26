import { createTheme, type Theme } from '@mui/material/styles';

// Mirrors armature-ui's Angular Material M3 theme (src/styles.scss,
// src/theme-colors.scss — seed #3f51b5). MUI doesn't generate a full M3
// tonal palette the way `ng generate @angular/material:theme-color` does,
// so this maps just the values components actually read: primary matches
// the seed exactly in both modes (same as --app-brand in src/index.css),
// and secondary carries the tertiary seed's tone for accents.
export function getTheme(isDark: boolean): Theme {
  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: isDark ? '#5d6fd4' : '#3f51b5',
        contrastText: '#fff',
      },
      secondary: {
        main: isDark ? '#c771c8' : '#8e3e91',
      },
      background: {
        default: isDark ? '#121319' : 'whitesmoke',
        paper: isDark ? '#1a1b22' : '#fff',
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
    },
  });
}
