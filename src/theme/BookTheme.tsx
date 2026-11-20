import { createContext, useContext, type ReactNode } from 'react';

import { useDiary } from '../store/useDiary';
import { applyDesign, type PaintedTheme } from './designs';
import { applyType } from './fonts';
import { getTheme } from './themes';

const BookThemeContext = createContext<PaintedTheme>({ ...getTheme('cutesy'), design: null });

export function BookThemeProvider({ children }: { children: ReactNode }) {
  const themeId = useDiary((state) => state.settings.themeId);
  const books = useDiary((state) => state.settings.books);
  const activeBookId = useDiary((state) => state.settings.activeBookId);
  const premium = useDiary((state) => state.wallet.premium);
  const fontId = useDiary((state) => state.settings.fontId);
  const inkColor = useDiary((state) => state.settings.inkColor);
  const book = books.find((item) => item.id === activeBookId);
  const painted = applyDesign(getTheme(book?.themeId ?? themeId), book?.design, premium);
  return <BookThemeContext.Provider value={applyType(painted, book?.fontId ?? fontId, book?.inkColor ?? inkColor)}>{children}</BookThemeContext.Provider>;
}

export function ThemeOverride({ theme, children }: { theme: PaintedTheme; children: ReactNode }) {
  return <BookThemeContext.Provider value={theme}>{children}</BookThemeContext.Provider>;
}

export function useTheme(): PaintedTheme {
  return useContext(BookThemeContext);
}
