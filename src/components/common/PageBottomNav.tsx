import React from 'react';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { PageView } from '../../types';
import { getPreviousPage, getNextPage } from '../../config/navigation';

interface PageBottomNavProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  className?: string;
}

export const PageBottomNav: React.FC<PageBottomNavProps> = ({
  currentPage,
  onNavigate,
  className = ''
}) => {
  const prev = getPreviousPage(currentPage);
  const next = getNextPage(currentPage);

  return (
    <div
      className={`w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pt-8 mt-12 border-t border-[#cbdaff]/80 ${className}`}
    >
      {/* 1. Previous Page Button */}
      {prev ? (
        <button
          id={`bottom-nav-prev-${currentPage}`}
          onClick={() => {
            onNavigate(prev.id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex-1 sm:flex-none inline-flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-white hover:bg-[#f1f3ff] text-[#002869] text-xs font-black transition-all border border-[#cbdaff] active:scale-95 cursor-pointer shadow-2xs group"
          title={`Go to Previous Page: ${prev.label}`}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#002869] group-hover:-translate-x-1 transition-transform" />
          <span>← Previous: {prev.label}</span>
        </button>
      ) : (
        <div className="hidden sm:block min-w-[120px]" />
      )}

      {/* 2. Direct Home Navigation Button */}
      <button
        id={`bottom-nav-home-${currentPage}`}
        onClick={() => {
          onNavigate('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#dae2ff]/60 hover:bg-[#dae2ff] text-[#002869] text-xs font-black transition-all border border-[#cbdaff] active:scale-95 cursor-pointer shadow-2xs"
        title="Return to CareerBuddies Homepage"
      >
        <Home className="w-3.5 h-3.5 text-[#002869]" />
        <span>Home</span>
      </button>

      {/* 3. Next Page Button */}
      {next ? (
        <button
          id={`bottom-nav-next-${currentPage}`}
          onClick={() => {
            onNavigate(next.id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex-1 sm:flex-none inline-flex items-center justify-center sm:justify-end gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer group"
          title={`Go to Next Page: ${next.label}`}
        >
          <span>Next: {next.label} →</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#79fd8d] group-hover:translate-x-1 transition-transform" />
        </button>
      ) : (
        <div className="hidden sm:block min-w-[120px]" />
      )}
    </div>
  );
};

export default PageBottomNav;
