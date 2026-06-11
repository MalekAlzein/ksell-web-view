import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
export function Layout({ children }: {children: React.ReactNode;}) {
  const { dir } = useTheme();
  return (
    <div className="min-h-screen w-full flex justify-center bg-slate-100 dark:bg-black">
      <div
        className="w-full max-w-md bg-slate-50 dark:bg-app-dark min-h-screen shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-300"
        dir={dir}>
        
        {children}
      </div>
    </div>);

}