import { createContext, useContext, type ReactNode } from 'react';

import { useDiary } from '../store/useDiary';
import { getTheme, type Theme } from './themes';

const BookThemeContext = createContext<Theme>(getTheme('cutesy'));

export function BookThemeProvider({ children }: { children: ReactNode }) {
  const themeId = useDiary((state) => state.settings.themeId);
  return <BookThemeContext.Provider value={getTheme(themeId)}>{children}</BookThemeContext.Provider>;
}

export function ThemeOverride({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <BookThemeContext.Provider value={theme}>{children}</BookThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(BookThemeContext);
}
