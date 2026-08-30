import React from 'react';
import { Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { PageView } from '../../types';
import { PAGE_TITLES, getPreviousPage, getNextPage } from '../../config/navigation';

interface PageHeaderControlsProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  onBack?: () => void;
  titleOverride?: string;
  className?: string;
}

export const PageHeaderControls: React.FC<PageHeaderControlsProps> = ({
  currentPage,
  onNavigate,
  onBack,
  titleOverride,
  className = ''
}) => {
  if (currentPage === 'home') return null;

  const currentTitle = titleOverride || PAGE_TITLES[currentPage] || 'CareerBuddies';
  const prev = getPreviousPage(currentPage);
  const next = getNextPage(currentPage);

  const handlePrevious = () => {
    if (onBack) {
      onBack();
    } else if (prev) {
      onNavigate(prev.id);
    } else {
      onNavigate('home');
    }
  };

  return (
    <div
      className={`w-full flex items-center justify-between gap-3 py-3 px-4 sm:px-6 bg-white rounded-2xl border border-[#cbdaff] shadow-2xs mb-6 sm:mb-8 transition-all ${className}`}
    >
      {/* Top Left: ← Previous */}
      <button
        onClick={handlePrevious}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f1f3ff] hover:bg-[#dae2ff] text-[#002869] text-xs font-black transition-all border border-[#cbdaff] active:scale-95 cursor-pointer shadow-2xs"
        title="Navigate to previous page"
      >
        <ArrowLeft className="w-4 h-4 text-[#002869]" />
        <span>← Previous</span>
      </button>

      {/* Center: Current Section Title & Breadcrumb */}
      <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#061b3b]">
        <span className="w-2 h-2 rounded-full bg-[#006e29]" />
        <span>{currentTitle}</span>
      </div>

      {/* Top Right: Home + Next Page Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#f1f3ff] text-[#002869] text-xs font-black transition-all border border-[#cbdaff] active:scale-95 cursor-pointer shadow-2xs"
          title="Return directly to CareerBuddies Home"
        >
          <Home className="w-4 h-4 text-[#002869]" />
          <span>Home</span>
        </button>

        {next && (
          <button
            onClick={() => onNavigate(next.id)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black transition-all active:scale-95 cursor-pointer shadow-2xs"
            title={`Next: ${next.label}`}
          >
            <span>Next →</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeaderControls;
