import React from 'react';
import { NEXT_STEP_OPTIONS } from '../../config/siteConfig';
import { PageView } from '../../types';
import { 
  Compass, 
  RefreshCw, 
  TrendingUp, 
  GraduationCap, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface FindYourNextStepProps {
  onNavigate: (page: PageView) => void;
  onOpenCounselling?: () => void;
}

export const FindYourNextStep: React.FC<FindYourNextStepProps> = ({
  onNavigate,
  onOpenCounselling
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'clarity':
        return <Compass className="w-5 h-5 text-[#002869]" />;
      case 'change':
        return <RefreshCw className="w-5 h-5 text-[#006e29]" />;
      case 'grow':
        return <TrendingUp className="w-5 h-5 text-[#002869]" />;
      case 'learn':
        return <GraduationCap className="w-5 h-5 text-[#006e29]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#002869]" />;
    }
  };

  const handleCardClick = (targetPage: string) => {
    if (targetPage === 'counselling' && onOpenCounselling) {
      onOpenCounselling();
    } else {
      onNavigate(targetPage as PageView);
    }
  };

  return (
    <section className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-[#f9f9ff] border-y border-[#e0e8ff]/70">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-10 sm:gap-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="max-w-2xl flex flex-col gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-bold w-fit">
              <Compass className="w-3.5 h-3.5 text-[#002869]" />
              <span>Interactive Decision Path</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              What do you need help with right now?
            </h2>
            <p className="text-sm sm:text-base text-[#434652] leading-relaxed">
              Every career journey faces distinct inflection points. Select your primary goal below to immediately access the most relevant guidance, mentors, or learning programs.
            </p>
          </div>

          <button
            onClick={() => onNavigate('career-check-in')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#002869]/20 text-[#002869] hover:bg-[#dae2ff]/30 text-xs font-bold transition-all shadow-xs w-fit cursor-pointer shrink-0"
          >
            <span>Unsure? Take 2-min Career Check-In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Decision Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {NEXT_STEP_OPTIONS.map((opt) => {
            const isGreen = opt.color === 'green';
            return (
              <div
                key={opt.id}
                onClick={() => handleCardClick(opt.targetPage)}
                className={`bg-white rounded-3xl p-6 border transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between group ${
                  isGreen 
                    ? 'border-[#a6f5b7]/60 hover:border-[#006e29]' 
                    : 'border-[#cbdaff]/70 hover:border-[#002869]'
                }`}
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className={`p-2.5 rounded-xl ${
                      isGreen ? 'bg-[#79fd8d]/20 text-[#006e29]' : 'bg-[#dae2ff] text-[#002869]'
                    }`}>
                      {getIcon(opt.id)}
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isGreen ? 'bg-[#79fd8d]/25 text-[#00531d]' : 'bg-[#dae2ff] text-[#001947]'
                    }`}>
                      {opt.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-lg font-bold text-[#061b3b] group-hover:text-[#002869] transition-colors mb-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                    {opt.title}
                  </h3>

                  <p className="text-xs font-medium text-[#747783] mb-3">
                    {opt.subtitle}
                  </p>

                  <p className="text-xs text-[#434652] leading-relaxed mb-4">
                    {opt.description}
                  </p>
                </div>

                {/* Card Action Link */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${
                    isGreen ? 'text-[#006e29]' : 'text-[#002869]'
                  }`}>
                    {opt.ctaText}
                  </span>
                  <div className={`p-1 rounded-full transition-transform group-hover:translate-x-1 ${
                    isGreen ? 'bg-[#79fd8d]/25 text-[#006e29]' : 'bg-[#dae2ff] text-[#002869]'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
