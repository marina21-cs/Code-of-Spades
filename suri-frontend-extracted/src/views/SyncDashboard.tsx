import { View } from '../types';
import { ArrowLeft, Settings, Cloud, Lock, RefreshCw, School, Assignment, ShieldCheck, HelpCircle } from 'lucide-react';

interface SyncDashboardProps {
  navigate: (view: View) => void;
}

export function SyncDashboard({ navigate }: SyncDashboardProps) {
  return (
    <div className="flex-1 flex flex-col bg-background h-full font-sans text-on-background relative overflow-hidden">
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-40 w-full transition-colors duration-200">
        <div className="flex justify-between items-center px-4 py-3 w-full">
          <button 
            onClick={() => navigate('settings')}
            className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center justify-center active:scale-95"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-display font-bold text-primary tracking-tight">Suri</h1>
          <button className="text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center justify-center active:scale-95">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto px-6 pt-8 pb-10 w-full no-scrollbar">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-extrabold text-on-surface mb-2">Sync Hub</h2>
          <p className="text-base font-sans text-on-surface-variant max-w-sm">Review recent progress and securely sync data with your teacher and parents.</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Primary Sync Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 flex flex-col justify-between items-start overflow-hidden relative shadow-sm">
            <div className="absolute -right-6 -top-6 text-primary-fixed opacity-20 pointer-events-none">
              <RefreshCw className="w-48 h-48" />
            </div>
            
            <div className="relative z-10 w-full mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary-container text-on-primary-container p-3 rounded-full flex items-center justify-center">
                  <Cloud className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-on-surface">Device Online</h3>
                  <p className="text-sm font-sans font-medium text-on-surface-variant">Ready to transmit learning data.</p>
                </div>
              </div>
              
              <div className="bg-secondary-container/50 rounded-2xl p-5 mb-4">
                <p className="text-xs font-sans font-bold text-secondary uppercase tracking-widest mb-1">Last Synchronized</p>
                <p className="text-2xl font-display font-bold text-on-surface">Today at 10:42 AM</p>
              </div>
            </div>
            
            <div className="w-full relative z-10 flex flex-col gap-4 border-t border-surface-variant pt-6">
              <div className="flex items-center gap-2 text-secondary">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-sans font-bold">End-to-end encrypted transfer</span>
              </div>
              <button 
                onClick={() => navigate('sync')}
                className="w-full bg-primary text-on-primary font-sans font-bold text-lg py-4 rounded-full hover:bg-surface-tint active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <RefreshCw className="w-5 h-5" />
                Sync Now
              </button>
            </div>
          </div>

          {/* Suri Evolution Status Card */}
          <div 
            onClick={() => navigate('evolution')}
            className="bg-surface-container-lowest border border-outline-variant rounded-3xl overflow-hidden flex flex-col shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div className="h-40 w-full bg-surface-container relative">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3MmHZv1IrwtY0SvSeSoHb7lk2UpHTAUZ1SBRTKvIE5BPuWuNUd2MF5Sru2jRzuUenP5l4mNHOVaXAl3DpvEuHT-tj1k5o0rOPFCp1ONS5EFQnQizWwXgJjLLjwKGLr_lSPE4l7geNw50Er3Wp8VzK1vMGXv8rHd8g-couR4AKSbqYng-V5TUIhHrJs5nKPaBSpzSKZNDsfV0B6XDavph5azIQb2hhhg-MdrD8u8YT1eFXPZJXy-v8K691X5g6Slnhs_yq-0Y2bgs" 
                alt="Suri Mascot" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="p-5 flex-grow flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-display font-bold text-on-surface">Suri Evolution</h3>
                <span className="bg-tertiary-container text-on-tertiary-container text-xs font-sans font-bold px-3 py-1 rounded-full">Level 5</span>
              </div>
              <p className="text-sm font-sans font-medium text-on-surface-variant leading-relaxed">Your learning companion is growing stronger with every module completed.</p>
            </div>
          </div>

          {/* Learning Progress Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 flex flex-col shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <School className="w-6 h-6 text-secondary" />
              <h3 className="text-xl font-display font-bold text-on-surface">Learning Progress</h3>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-sans font-bold text-on-surface">Grade 10 Science</span>
                  <span className="text-sm font-sans font-bold text-primary">65% Complete</span>
                </div>
                <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out w-[65%]"></div>
                </div>
                <p className="text-xs font-sans font-medium text-on-surface-variant mt-2">Current Unit: Ecosystem Dynamics</p>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-sans font-bold text-on-surface">Mathematics II</span>
                  <span className="text-sm font-sans font-bold text-tertiary">42% Complete</span>
                </div>
                <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full transition-all duration-1000 ease-out w-[42%]"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
