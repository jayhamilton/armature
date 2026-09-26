import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Navigate, Route, Routes } from 'react-router-dom';
import { themeService } from './app/theme/theme.service';
import { useObservableValue } from './lib/useObservable';
import { Home } from './app/home/Home';
import { Login } from './app/login/Login';
import { getTheme } from './theme';

/** Ported from armature-ui's AppComponent + app.routes.ts. */
export function App() {
  const isDark = useObservableValue(themeService.isDark$, () => themeService.isDark);

  return (
    <ThemeProvider theme={getTheme(isDark)}>
      <CssBaseline />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
