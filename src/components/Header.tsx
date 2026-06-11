import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}
export function Header({ title, showBack = false, onBack }: HeaderProps) {
  const navigate = useNavigate();
  const { dir } = useTheme();
  const handleClose = () => {
    // When embedded in the Flutter app's WebView, ask the native app to close
    // this screen (it listens on the "KsellApp" JS channel). Otherwise fall
    // back to going home.
    const bridge = (window as unknown as {
      KsellApp?: { postMessage?: (msg: string) => void };
    }).KsellApp;
    if (bridge && typeof bridge.postMessage === 'function') {
      bridge.postMessage('close');
      return;
    }
    navigate('/');
  };
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };
  return (
    <div className="flex items-center justify-between p-4 sticky top-0 z-20 bg-slate-50 dark:bg-app-dark transition-colors duration-300">
      <div className="flex items-center flex-1">
        {showBack &&
        <button
          onClick={handleBack}
          className="p-2 -ms-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Go back">
          
            {dir === 'rtl' ?
          <ChevronRight className="w-6 h-6" /> :

          <ChevronLeft className="w-6 h-6" />
          }
          </button>
        }
      </div>

      <div className="flex-1 text-center">
        {title &&
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
            {title}
          </h1>
        }
      </div>

      <div className="flex items-center justify-end flex-1">
        <button
          onClick={handleClose}
          className="p-2 -me-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          aria-label="Close">
          
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>);

}