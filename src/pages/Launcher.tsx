import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Layout } from '../components/Layout';
import {
  Moon,
  Sun,
  AlignLeft,
  AlignRight,
  Smartphone,
  CreditCard,
  List } from
'lucide-react';
export function Launcher() {
  const navigate = useNavigate();
  const { theme, setTheme, dir, setDir } = useTheme();
  const routes = [
  {
    path: '/plans',
    name: '1. Select Ad Plan',
    icon: Smartphone,
    desc: 'Tier selection'
  },
  {
    path: '/payment',
    name: '2. Payment Page',
    icon: CreditCard,
    desc: '3 payment methods'
  },
  {
    path: '/history',
    name: '3. Transaction History',
    icon: List,
    desc: 'Scrollable list'
  }];

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="text-center space-y-2 mt-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            FinTech Demo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Flutter WebView Mockups
          </p>
        </div>

        <div className="bg-white dark:bg-app-card rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Controls
          </h2>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}>
                
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Direction</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setDir('ltr')}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${dir === 'ltr' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>
                
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDir('rtl')}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${dir === 'rtl' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>
                
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Pages
          </h2>
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <button
                key={route.path}
                onClick={() => navigate(route.path)}
                className="w-full flex items-center p-4 bg-white dark:bg-app-card hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors group text-start">
                
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl me-4 group-hover:bg-app-accent group-hover:text-white transition-colors text-slate-600 dark:text-slate-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    {route.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {route.desc}
                  </p>
                </div>
              </button>);

          })}
        </div>
      </div>
    </Layout>);

}