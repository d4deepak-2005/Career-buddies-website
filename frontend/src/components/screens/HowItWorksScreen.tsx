import React, { useState } from 'react';
import { HOW_IT_WORKS_STEPS } from '../../data/mockData';
import { 
  Target, 
  Compass, 
  Search, 
  AlertCircle, 
  Users, 
  Sparkles, 
  Rocket,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { PageView } from '../../types';
import { PageNavigationControls } from '../common/PageNavigationControls';
import { SectionHeading } from '../common/SectionHeading';

interface HowItWorksScreenProps {
  onStartMatching: () => void;
  onOpenCounselling?: () => void;
  onBookCounselling?: () => void;
  onBecomeMentor?: () => void;
  setActivePage: (page: PageView) => void;
}

export const HowItWorksScreen: React.FC<HowItWorksScreenProps> = ({
  onStartMatching,
  onOpenCounselling,
  onBookCounselling,
  onBecomeMentor,
  setActivePage
}) => {
  const handleCounselling = onOpenCounselling || onBookCounselling || (() => {});
  const [selectedStep, setSelectedStep] = useState<number>(1);

  const getStepIcon = (name: string) => {
    switch (name) {
      case 'Target': return <Target className="w-5 h-5" />;
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'Search': return <Search className="w-5 h-5" />;
      case 'AlertCircle': return <AlertCircle className="w-5 h-5" />;
      case 'Users': return <Users className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Rocket': return <Rocket className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const activeStepData = HOW_IT_WORKS_STEPS.find(s => s.step === selectedStep) || HOW_IT_WORKS_STEPS[0];

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-10">
        
        {/* Universal Navigation Controls */}
        <PageNavigationControls
          onBackToHome={() => {
            setActivePage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBack={() => {
            setActivePage('about-us');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNext={() => {
            setActivePage('features');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          backLabel="About Us"
          nextLabel="Find a Mentor (1:1)"
          currentStepLabel="Our Journey & Methodology"
        />

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-black uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#002869]" />
            <span>The 5-Step Career Transformation System</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
            How CareerBuddies Works
          </h1>

          <p className="text-sm sm:text-base text-[#434652] leading-relaxed max-w-2xl font-medium">
            We replace random networking with a predictable, diagnostic methodology. Every step is engineered by hiring managers from top tech companies to ensure measurable career progression.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setActivePage('webinars')}
              className="px-6 py-3 bg-[#006e29] hover:bg-[#00531d] text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Step 1: Join Live Webinar (₹199)</span>
            </button>
            <button
              onClick={handleCounselling}
              className="px-6 py-3 bg-[#e8edff] hover:bg-[#d7e2ff] text-[#002869] font-black text-xs sm:text-sm rounded-xl transition-all cursor-pointer border border-[#cbdaff] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#006e29]" />
              <span>Connect With Our Advisor</span>
            </button>
          </div>
        </div>

        {/* 7-Step Interactive Journey Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Step Selector List (5 Cols) */}
          <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-3xl border border-[#cbdaff] shadow-xs flex flex-col gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-[#002869] mb-1 px-2">
              Progression Steps
            </span>

            {HOW_IT_WORKS_STEPS.map((stepItem) => {
              const isSelected = selectedStep === stepItem.step;
              return (
                <button
                  key={stepItem.step}
                  onClick={() => setSelectedStep(stepItem.step)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#002869] text-white shadow-xs'
                      : 'hover:bg-[#f1f3ff] text-[#061b3b]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isSelected
                        ? 'bg-[#79fd8d] text-[#001947]'
                        : 'bg-[#dae2ff] text-[#002869]'
                    }`}
                  >
                    0{stepItem.step}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-[#061b3b]'}`}>
                      {stepItem.title}
                    </h4>
                    <p className={`text-[11px] truncate ${isSelected ? 'text-white/80' : 'text-[#747783]'}`}>
                      {stepItem.subtitle}
                    </p>
                  </div>

                  <ArrowRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#79fd8d]' : 'text-gray-300'}`} />
                </button>
              );
            })}
          </div>

          {/* Active Step Deep-Dive Details (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#cbdaff] shadow-xs flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#002869] text-white flex items-center justify-center shadow-xs">
                  {getStepIcon(activeStepData.icon)}
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase text-[#006e29] tracking-wider">
                    Stage 0{activeStepData.step} of 05
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                    {activeStepData.title}
                  </h3>
                </div>
              </div>

              <span className="hidden sm:inline-block px-3 py-1 bg-[#dae2ff] text-[#001947] text-xs font-black rounded-full">
                {activeStepData.subtitle}
              </span>
            </div>

            <p className="text-sm text-[#434652] leading-relaxed">
              {activeStepData.description}
            </p>

            {/* Key Deliverables & Outcomes */}
            <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-[#cbdaff] flex flex-col gap-3">
              <h5 className="text-xs font-black uppercase tracking-wider text-[#002869]">
                Core Deliverable at This Stage:
              </h5>
              <div className="flex items-start gap-2.5 text-xs font-bold text-[#061b3b]">
                <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0 mt-0.5" />
                <span>{activeStepData.deliverable}</span>
              </div>
            </div>

            {/* Step-Specific Quick Action */}
            {activeStepData.step === 3 && (
              <div className="p-4 rounded-2xl bg-[#002869]/5 border border-[#cbdaff] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-[#061b3b]">
                  <div className="font-black text-[#002869]">Profile-Dependent Plan Matching</div>
                  <p className="text-[11px] text-[#434652] mt-0.5">Plans and support are curated based on your current role and goals.</p>
                </div>
                <button
                  onClick={handleCounselling}
                  className="px-4 py-2 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Connect With Our Advisor to Know Your Suitable Plan
                </button>
              </div>
            )}

            {/* Bottom Actions for Active Step */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  if (selectedStep > 1) setSelectedStep(selectedStep - 1);
                }}
                disabled={selectedStep === 1}
                className="px-4 py-2 text-xs font-bold text-[#434652] disabled:opacity-30 cursor-pointer"
              >
                ← Previous Stage
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage('webinars')}
                  className="px-4 py-2 bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer"
                >
                  Join ₹199 Webinar
                </button>

                <button
                  onClick={() => {
                    if (selectedStep < HOW_IT_WORKS_STEPS.length) {
                      setSelectedStep(selectedStep + 1);
                    } else {
                      setActivePage('programmes');
                    }
                  }}
                  className="px-4 py-2 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>{selectedStep === HOW_IT_WORKS_STEPS.length ? 'Explore Programmes' : 'Next Stage'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
