import { ArrowLeft, Settings } from 'lucide-react';
import { View } from '../types';

interface TopBarProps {
  title: string;
  navigate?: (view: View) => void;
  backTo?: View;
  onSettings?: () => void;
  showBack?: boolean;
  showSettings?: boolean;
}

export function TopBar({ title, navigate, backTo, onSettings, showBack = true, showSettings = true }: TopBarProps) {
  return (
    <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/50">
      <div className="flex justify-between items-center px-4 py-3 w-full">
        {showBack ? (
          <button 
            onClick={() => backTo && navigate && navigate(backTo)}
            className="text-primary hover:bg-surface-container-low transition-colors rounded-full p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-10"></div> // Spacer
        )}
        
        <h1 className="text-xl font-display font-bold text-primary tracking-tight">
          {title}
        </h1>
        
        {showSettings ? (
          <button 
            onClick={onSettings}
            className="text-primary hover:bg-surface-container-low transition-colors rounded-full p-2"
          >
            <Settings className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-10"></div> // Spacer
        )}
      </div>
    </header>
  );
}
