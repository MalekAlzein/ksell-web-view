import React, { useEffect, useState, createContext, useContext } from 'react';
type Theme = 'dark' | 'light';
type Dir = 'ltr' | 'rtl';
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  dir: Dir;
  setDir: (dir: Dir) => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export function ThemeProvider({ children }: {children: React.ReactNode;}) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [dir, setDir] = useState<Dir>('ltr');
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.dir = dir;
  }, [theme, dir]);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        dir,
        setDir
      }}>
      
      {children}
    </ThemeContext.Provider>);

}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}