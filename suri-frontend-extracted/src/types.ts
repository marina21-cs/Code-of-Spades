export type View = 
  | 'landing'
  | 'onboarding'
  | 'chat'
  | 'library'
  | 'subject'
  | 'quizHub'
  | 'quizQuestion'
  | 'settings'
  | 'scanner'
  | 'sync'
  | 'syncDashboard'
  | 'activity'
  | 'streak'
  | 'evolution'
  | 'profileResult'
  | 'offline';

export interface AppContextType {
  currentView: View;
  navigate: (view: View) => void;
}
