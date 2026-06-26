/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { View } from './types';

// Placeholder imports for views we will create
import { Landing } from './views/Landing';
import { Onboarding } from './views/Onboarding';
import { Chat } from './views/Chat';
import { Library } from './views/Library';
import { QuizHub } from './views/QuizHub';
import { Settings } from './views/Settings';
import { Subject } from './views/Subject';
import { QuizQuestion } from './views/QuizQuestion';
import { Scanner } from './views/Scanner';
import { Sync } from './views/Sync';
import { SyncDashboard } from './views/SyncDashboard';
import { Activity } from './views/Activity';
import { Streak } from './views/Streak';
import { Evolution } from './views/Evolution';
import { ProfileResult } from './views/ProfileResult';
import { Offline } from './views/Offline';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <Landing navigate={setCurrentView} />;
      case 'onboarding': return <Onboarding navigate={setCurrentView} />;
      case 'chat': return <Chat navigate={setCurrentView} />;
      case 'library': return <Library navigate={setCurrentView} />;
      case 'subject': return <Subject navigate={setCurrentView} />;
      case 'quizHub': return <QuizHub navigate={setCurrentView} />;
      case 'quizQuestion': return <QuizQuestion navigate={setCurrentView} />;
      case 'settings': return <Settings navigate={setCurrentView} />;
      case 'scanner': return <Scanner navigate={setCurrentView} />;
      case 'sync': return <Sync navigate={setCurrentView} />;
      case 'syncDashboard': return <SyncDashboard navigate={setCurrentView} />;
      case 'activity': return <Activity navigate={setCurrentView} />;
      case 'streak': return <Streak navigate={setCurrentView} />;
      case 'evolution': return <Evolution navigate={setCurrentView} />;
      case 'profileResult': return <ProfileResult navigate={setCurrentView} />;
      case 'offline': return <Offline navigate={setCurrentView} />;
      default: return <Landing navigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-dim flex items-center justify-center p-0 sm:p-4 md:p-8">
      {/* Mobile Device Container */}
      <div className="w-full h-screen sm:h-[850px] max-w-[430px] bg-background relative flex flex-col overflow-hidden sm:rounded-[3rem] sm:shadow-2xl sm:border sm:border-outline-variant">
        {renderView()}
      </div>
    </div>
  );
}
