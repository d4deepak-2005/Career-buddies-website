import React from 'react';
import { Home, ArrowLeft, ArrowRight } from 'lucide-react';

interface PageNavigationControlsProps {
  onBackToHome: () => void;
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  currentStepLabel?: string;
  className?: string;
}

export const PageNavigationControls: React.FC<PageNavigationControlsProps> = ({
  onBackToHome,
  onBack,
  onNext,
  backLabel = 'Previous',
  nextLabel = 'Next',
  currentStepLabel,
  className = ''
}) => {
  return (
    <div
      className={`w-full flex flex-wrap items-center justify-between gap-3 py-3 px-4 sm:px-6 bg-white/90 backdrop-blur-md rounded-2xl border border-[#cbdaff] shadow-2xs mb-6 ${className}`}
    >
      {/* Left Action Buttons: Previous & Home */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Previous / Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#f9f9ff] text-[#002869] text-xs font-black transition-all border border-[#cbdaff] active:scale-95 cursor-pointer shadow-2xs"
            title={`Go back to previous page: ${backLabel}`}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#002869]" />
            <span>← {backLabel}</span>
          </button>
        )}

        {/* Back to Home Button */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#dae2ff]/70 hover:bg-[#dae2ff] text-[#002869] text-xs font-black transition-all border border-[#cbdaff] active:scale-95 cursor-pointer shadow-2xs"
          title="Return to CareerBuddies Home"
        >
          <Home className="w-3.5 h-3.5 text-[#002869]" />
          <span>Home</span>
        </button>
      </div>

      {/* Middle Step or Breadcrumb Label (Optional) */}
      {currentStepLabel && (
        <div className="hidden md:flex items-center gap-2 text-xs font-black text-[#061b3b]">
          <span className="w-2 h-2 rounded-full bg-[#006e29]" />
          <span>{currentStepLabel}</span>
        </div>
      )}

      {/* Right Action: Next Button (if applicable) */}
      {onNext && (
        <button
          onClick={onNext}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black transition-all shadow-2xs active:scale-95 cursor-pointer ml-auto"
          title={`Proceed to next page: ${nextLabel}`}
        >
          <span>{nextLabel} →</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#79fd8d]" />
        </button>
      )}
    </div>
  );
};

export default PageNavigationControls;
