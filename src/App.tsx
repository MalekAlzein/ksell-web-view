import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
// Pages
import { SelectPlan } from './pages/SelectPlan';
import { Payment } from './pages/Payment';
import { History } from './pages/History';
export function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/plans" replace />} />
          <Route path="/plans" element={<SelectPlan />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </HashRouter>
      <Toaster
        position="top-center"
        theme="system"
        richColors
        toastOptions={{
          className: 'dark:bg-slate-800 dark:border-slate-700 dark:text-white'
        }} />
      
    </ThemeProvider>);

}