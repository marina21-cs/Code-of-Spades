import { View } from '../types';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { Search, Library as LibraryIcon, HelpCircle, Lock, ArrowRight, FlaskConical } from 'lucide-react';

interface SubjectProps {
  navigate: (view: View) => void;
}

export function Subject({ navigate }: SubjectProps) {
  return (
    <div className="flex-1 flex flex-col bg-background h-full relative overflow-hidden">
      <TopBar title="Suri" backTo="library" navigate={navigate} />
      
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-32 no-scrollbar">
        {/* Subject Header & Search */}
        <section className="mb-10 w-full relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 relative">
            <div className="relative w-full pr-24">
              <span className="text-sm font-sans font-semibold text-primary uppercase tracking-widest mb-2 block">Grade 10</span>
              <h2 className="text-4xl font-display font-extrabold text-on-background leading-tight">
                Agham <span className="text-on-surface-variant font-display text-2xl block mt-1">(Science)</span>
              </h2>
            </div>
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqwqGB5DmpaF6AyNLDmewaRbkTsB776lWri3eWRBHVjfZYQhSBy3jxePTMfwfLRvwDjOZjG-3QPVscbbMEQtneJfuwbJDSykE_PVQSTfApfWWnD9MyyWPaD08BuRNXDh7jP9dln1sA_nbt6VCXhaWcOaTBHL6rIHaGl94ujywV1sn9FNiUcaHcDaJ-j27pZ4Z_Ixy10HpmfSdZCezviiZT26fQ3AFw9vfWa5p2rVmQf4AgD7LzIskedLHAQj5EGqvW8c_FpBVpN_A" 
              alt="Mascot" 
              className="absolute top-0 right-0 w-24 h-24 object-contain animate-float pointer-events-none -mt-4"
            />
            
            <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-4 flex items-center gap-4 mt-4 shadow-sm z-10 w-max">
              <FlaskConical className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs font-sans font-semibold text-on-surface-variant">Overall Progress</p>
                <p className="text-xl font-display font-bold text-primary">64%</p>
              </div>
            </div>
          </div>
          
          <div className="relative w-full mt-6 shadow-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-full py-4 pl-12 pr-4 text-base font-sans text-on-background placeholder:text-on-surface-variant transition-colors outline-none" 
              placeholder="Search modules, concepts, or MELCs..." 
              type="text" 
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-10 grid grid-cols-1 gap-4">
          <button className="bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-3xl p-5 flex items-center justify-between group transition-all text-left shadow-sm">
            <div className="flex items-center gap-5 w-full">
              <div className="bg-surface-container-high p-4 rounded-full text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors shrink-0">
                <LibraryIcon className="w-7 h-7" />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="text-xl font-display font-bold text-on-background mb-1 truncate">Start Reviewer</h3>
                <p className="text-base font-sans text-on-surface-variant line-clamp-2">Comprehensive notes for exams.</p>
              </div>
              <ArrowRight className="w-6 h-6 text-outline group-hover:text-primary transition-colors shrink-0 ml-auto" />
            </div>
          </button>
          
          <button 
            onClick={() => navigate('quizHub')}
            className="bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-3xl p-5 flex items-center justify-between group transition-all text-left shadow-sm"
          >
            <div className="flex items-center gap-5 w-full">
              <div className="bg-surface-container-high p-4 rounded-full text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors shrink-0">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="text-xl font-display font-bold text-on-background mb-1 truncate">Take a Practice Quiz</h3>
                <p className="text-base font-sans text-on-surface-variant line-clamp-2">Test your knowledge on key topics.</p>
              </div>
              <ArrowRight className="w-6 h-6 text-outline group-hover:text-primary transition-colors shrink-0 ml-auto" />
            </div>
          </button>
        </section>

        {/* Modules List */}
        <section className="w-full">
          <div className="flex justify-between items-end mb-6 border-b border-outline-variant pb-2">
            <h3 className="text-2xl font-display font-bold text-on-background">Modules (DepEd MELCs)</h3>
            <span className="text-sm font-sans font-medium text-on-surface-variant mb-1">Quarter 1</span>
          </div>
          
          <div className="space-y-4">
            {/* Module 1 */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 flex flex-col gap-5 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute bottom-0 left-0 h-1.5 bg-surface-container w-full">
                <div className="h-full bg-primary rounded-r-full w-[80%]"></div>
              </div>
              
              <div className="flex justify-between items-start">
                <div className="bg-surface-container-low text-primary w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xl font-display font-bold">1</span>
                </div>
                <span className="text-xs font-sans font-bold text-primary bg-primary-fixed px-2.5 py-1 rounded-md">80% Complete</span>
              </div>
              
              <div>
                <h4 className="text-xl font-display font-bold text-on-background mb-2">Earth and Space</h4>
                <p className="text-base font-sans text-on-surface-variant line-clamp-2">Describe the distribution of active volcanoes, earthquake epicenters, and major mountain belts.</p>
              </div>
              
              <div className="flex gap-3 w-full mt-2">
                <button className="flex-1 bg-surface-container border border-outline-variant text-on-background py-3 rounded-full text-sm font-sans font-medium hover:bg-surface-container-high transition-colors">Notes</button>
                <button className="flex-1 bg-primary text-on-primary py-3 rounded-full text-sm font-sans font-medium hover:bg-primary-container transition-colors shadow-sm">Continue</button>
              </div>
            </div>

            {/* Module 2 */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 flex flex-col gap-5 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute bottom-0 left-0 h-1.5 bg-surface-container w-full">
                <div className="h-full bg-primary rounded-r-full w-[25%]"></div>
              </div>
              
              <div className="flex justify-between items-start">
                <div className="bg-surface-container-low text-primary w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xl font-display font-bold">2</span>
                </div>
                <span className="text-xs font-sans font-bold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-md">25% Complete</span>
              </div>
              
              <div>
                <h4 className="text-xl font-display font-bold text-on-background mb-2">Plate Tectonics</h4>
                <p className="text-base font-sans text-on-surface-variant line-clamp-2">Describe the different types of plate boundaries and the geological events occurring along them.</p>
              </div>
              
              <div className="flex gap-3 w-full mt-2">
                <button className="flex-1 bg-surface-container border border-outline-variant text-on-background py-3 rounded-full text-sm font-sans font-medium hover:bg-surface-container-high transition-colors">Notes</button>
                <button className="flex-1 bg-primary text-on-primary py-3 rounded-full text-sm font-sans font-medium hover:bg-primary-container transition-colors shadow-sm">Continue</button>
              </div>
            </div>

            {/* Module 3 (Locked) */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 flex flex-col gap-5 opacity-75 grayscale-[20%]">
              <div className="flex justify-between items-start">
                <div className="bg-surface-container-high text-on-surface-variant w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-xs font-sans font-bold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-md">Not Started</span>
              </div>
              
              <div>
                <h4 className="text-xl font-display font-bold text-on-surface-variant mb-2">Electromagnetic Spectrum</h4>
                <p className="text-base font-sans text-on-surface-variant line-clamp-2">Compare the relative wavelengths of different forms of electromagnetic waves.</p>
              </div>
              
              <div className="flex w-full mt-2">
                <button disabled className="w-full bg-surface-container border border-outline-variant text-on-surface-variant py-3 rounded-full text-sm font-sans font-medium opacity-80 cursor-not-allowed">Start Module</button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <BottomNav currentView="library" navigate={navigate} />
    </div>
  );
}
