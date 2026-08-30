import React, { useState } from 'react';
import { 
  Award, 
  Star, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Briefcase, 
  ShieldCheck,
  Quote
} from 'lucide-react';
import { PageView } from '../../types';
import { SUCCESS_STORIES } from '../../config/testimonials';
import { PageHeaderControls } from '../common/PageHeaderControls';
import { PageBottomNav } from '../common/PageBottomNav';

interface SuccessStoriesScreenProps {
  onNavigate: (page: PageView) => void;
  onOpenCounselling: () => void;
}

export const SuccessStoriesScreen: React.FC<SuccessStoriesScreenProps> = ({
  onNavigate,
  onOpenCounselling
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'promotion' | 'transition' | 'hike'>('all');

  const filteredStories = activeFilter === 'all'
    ? SUCCESS_STORIES
    : SUCCESS_STORIES.filter(s => s.outcomeType === activeFilter);

  return (
    <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation Controls */}
        <PageHeaderControls
          currentPage="success-stories"
          onNavigate={onNavigate}
          titleOverride="Success Stories & Outcomes"
        />

        {/* Page Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dae2ff] border border-[#cbdaff] text-xs font-black text-[#002869] mb-3">
            <Award className="w-3.5 h-3.5 text-[#006e29]" />
            <span>Verified Career Transformations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#061b3b] tracking-tight">
            Real Professionals. Measurable Outcomes.
          </h1>
          <p className="text-sm sm:text-base text-[#434652] mt-3">
            Discover how professionals across engineering, product management, and leadership achieved Staff-level promotions, successful career pivots, and compensation breakthroughs.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: 'all', label: 'All Stories' },
            { id: 'promotion', label: 'Promotions & Staff+ Leap' },
            { id: 'transition', label: 'Career Pivots & PM Blueprints' },
            { id: 'hike', label: 'Compensation & Offers' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activeFilter === f.id
                  ? 'bg-[#002869] text-white border-[#002869] shadow-xs'
                  : 'bg-[#f1f3ff] text-[#434652] border-[#cbdaff] hover:bg-[#dae2ff]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {filteredStories.map((story) => (
            <div
              key={story.id}
              className="bg-[#f9f9ff] rounded-3xl border border-[#cbdaff] p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative group"
            >
              <div>
                {/* Top Outcome Badge */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#79fd8d]/30 text-[#00531d] text-[11px] font-black flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006e29]" />
                    <span>{story.outcomeMetric}</span>
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(story.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                {/* Quote Body */}
                <div className="relative mb-6">
                  <Quote className="w-8 h-8 text-[#002869]/10 absolute -top-3 -left-2 -z-0" />
                  <p className="text-xs sm:text-sm text-[#434652] font-medium leading-relaxed relative z-10 italic">
                    "{story.story}"
                  </p>
                </div>

                {/* Service/Programme Tag */}
                <div className="text-[11px] font-bold text-[#002869] bg-white px-3 py-1.5 rounded-xl border border-[#cbdaff] inline-block mb-4">
                  Track: {story.serviceUsed}
                </div>
              </div>

              {/* Mentee Profile & Mentor Credit */}
              <div className="pt-4 border-t border-[#cbdaff] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={story.avatar}
                    alt={story.name}
                    className="w-11 h-11 rounded-xl object-cover border border-[#cbdaff]"
                    loading="lazy"
                  />
                  <div>
                    <div className="text-xs font-black text-[#061b3b]">
                      {story.name}
                    </div>
                    <div className="text-[11px] text-[#006e29] font-bold">
                      Now: {story.role} at {story.company}
                    </div>
                    <div className="text-[10px] text-[#737785]">
                      From: {story.previousRole}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-[#434652] uppercase font-bold">Mentor</div>
                  <div className="text-xs font-black text-[#002869]">{story.mentorName}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Diagnostic Callout Banner */}
        <div className="bg-[#002869] text-white rounded-3xl p-8 sm:p-10 text-center max-w-4xl mx-auto shadow-md mb-12">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ready to structure your next career breakthrough?
          </h2>
          <p className="text-sm text-[#dae2ff] mt-2.5 max-w-2xl mx-auto">
            Get personalized 1:1 counseling, resume diagnostics, and a tailored growth roadmap from experienced industry leaders.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenCounselling}
              className="px-6 py-3 rounded-xl bg-[#006e29] hover:bg-[#00531d] text-white font-black text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#79fd8d]" />
              <span>Book Free 1:1 Strategic Counselling</span>
            </button>
            <button
              onClick={() => onNavigate('programmes')}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs transition-all border border-white/20 cursor-pointer"
            >
              Explore Structured Programmes
            </button>
          </div>
        </div>

        {/* Bottom Page Navigation (Previous / Next) */}
        <PageBottomNav
          currentPage="success-stories"
          onNavigate={onNavigate}
        />

      </div>
    </div>
  );
};

export default SuccessStoriesScreen;
