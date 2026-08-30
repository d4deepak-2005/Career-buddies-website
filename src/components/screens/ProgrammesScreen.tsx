import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Filter, 
  Users, 
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { PageView, ProgrammeItem } from '../../types';
import { PROGRAMMES_CATALOGUE } from '../../config/programmes';
import { CAREER_PLANS } from '../../data/mockData';
import { PageHeaderControls } from '../common/PageHeaderControls';
import { PageBottomNav } from '../common/PageBottomNav';

interface ProgrammesScreenProps {
  onNavigate: (page: PageView) => void;
  onOpenCounselling: () => void;
}

export const ProgrammesScreen: React.FC<ProgrammesScreenProps> = ({
  onNavigate,
  onOpenCounselling
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedCurriculumId, setExpandedCurriculumId] = useState<string | null>(null);

  const categories = [
    'All',
    'Leadership Development',
    'Skill Development Tracks',
    'Career Transition Programmes',
    'Career Guidance Programmes',
    'Structured Growth Tracks'
  ];

  const filteredProgrammes = selectedCategory === 'All'
    ? PROGRAMMES_CATALOGUE
    : PROGRAMMES_CATALOGUE.filter(p => p.category === selectedCategory);

  const toggleCurriculum = (id: string) => {
    setExpandedCurriculumId(expandedCurriculumId === id ? null : id);
  };

  return (
    <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation Controls: Top Left Back & Top Right Home */}
        <PageHeaderControls
          currentPage="programmes"
          onNavigate={onNavigate}
          titleOverride="Programmes & Career Plans"
        />

        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dae2ff] border border-[#cbdaff] text-xs font-black text-[#002869] mb-3">
            <Layers className="w-3.5 h-3.5 text-[#006e29]" />
            <span>Step 4 of the 7-Stage CareerBuddies Journey</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Choose Your Career Plan
          </h1>
          <p className="text-sm sm:text-base text-[#434652] mt-3 leading-relaxed">
            Following your ₹199 live mentor webinar and advisor requirement review, choose from our three structured plans. Dedicated profile overhaul begins immediately upon enrolment.
          </p>
        </div>

        {/* 3 Core Career Plans Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                The Three Career Plans
              </h2>
              <p className="text-xs sm:text-sm text-[#434652]">
                Tailored for every career pivot, promotion sprint, and leadership transition.
              </p>
            </div>
            <button
              onClick={() => onNavigate('how-it-works')}
              className="text-xs font-bold text-[#002869] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View 7-Step Journey</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {CAREER_PLANS.slice(0, 3).map((plan) => (
              <div
                key={plan.id}
                className={`bg-[#f9f9ff] rounded-3xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-200 hover:shadow-lg relative ${
                  plan.isRecommended ? 'border-[#002869] ring-2 ring-[#002869]/20' : 'border-[#cbdaff]'
                }`}
              >
                {plan.isRecommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#002869] text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                    Most Popular Choice
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black uppercase text-[#006e29] tracking-wider">
                      {plan.tagline}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#dae2ff] text-[#001947] text-[10px] font-bold">
                      {plan.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif] mb-2">
                    {plan.name}
                  </h3>

                  <p className="text-xs text-[#434652] leading-relaxed mb-5">
                    {plan.description}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#e0e8ff] mb-5">
                    <div className="text-xs font-bold text-[#061b3b]">
                      {plan.sessionsCount}
                    </div>
                    <div className="text-[11px] text-[#747783] mt-0.5">
                      {plan.supportType}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-6">
                    <span className="text-[11px] font-bold uppercase text-[#747783] tracking-wider">
                      Key Deliverables:
                    </span>
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0 mt-0.5" />
                        <span className="text-[#434652]">{feat.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#cbdaff] flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-[#002869] font-['Plus_Jakarta_Sans',sans-serif]">
                      {plan.priceINR}
                    </span>
                    <span className="text-[11px] text-[#747783] block">
                      {plan.period}
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigate('webinars')}
                    className="px-4 py-2.5 rounded-xl bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Start with ₹199 Webinar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Specialized Domain Tracks Header */}
        <div className="pt-8 border-t border-gray-200 mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif] mb-2">
            Explore All Specialized Domain Tracks
          </h2>
          <p className="text-xs sm:text-sm text-[#434652]">
            Detailed curriculums for software engineering, product management, AI, and engineering leadership.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-[#002869] text-white border-[#002869] shadow-xs'
                  : 'bg-[#f1f3ff] text-[#434652] border-[#cbdaff] hover:bg-[#dae2ff]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Programmes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {filteredProgrammes.map((programme) => {
            const isCurriculumOpen = expandedCurriculumId === programme.id;

            return (
              <div
                key={programme.id}
                className="bg-[#f9f9ff] rounded-3xl border border-[#cbdaff] p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
              >
                <div>
                  {/* Card Header & Badge */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-[#dae2ff] text-[#002869] text-[11px] font-black uppercase tracking-wider">
                      {programme.category}
                    </span>
                    {programme.badge && (
                      <span className="px-3 py-1 rounded-full bg-[#79fd8d]/30 text-[#00531d] text-[11px] font-black">
                        {programme.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <h2 className="text-xl sm:text-2xl font-black text-[#061b3b] group-hover:text-[#002869] transition-colors">
                    {programme.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#434652] mt-2 font-medium leading-relaxed">
                    {programme.tagline}
                  </p>

                  {/* Meta Specs (Duration, Cohort Date, Mentor) */}
                  <div className="grid grid-cols-2 gap-3 my-5 py-4 px-4 bg-white rounded-2xl border border-[#cbdaff]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#002869] shrink-0" />
                      <div>
                        <div className="text-[10px] text-[#434652] uppercase font-bold">Duration</div>
                        <div className="text-xs font-black text-[#061b3b]">{programme.duration}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#006e29] shrink-0" />
                      <div>
                        <div className="text-[10px] text-[#434652] uppercase font-bold">Cohort Start</div>
                        <div className="text-xs font-black text-[#061b3b]">{programme.cohortStartDate.replace('Next Cohort: ', '')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Mentor Assigned */}
                  <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#cbdaff]/70 mb-5">
                    <img
                      src={programme.mentorAvatar}
                      alt={programme.mentorName}
                      className="w-10 h-10 rounded-xl object-cover border border-[#cbdaff]"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[#061b3b] truncate">
                        Lead Mentor: {programme.mentorName}
                      </div>
                      <div className="text-[11px] text-[#434652] truncate">
                        {programme.mentorRole} • {programme.mentorCompany}
                      </div>
                    </div>
                  </div>

                  {/* Key Highlights */}
                  <div className="mb-5">
                    <div className="text-xs font-black uppercase text-[#002869] tracking-wider mb-2.5">
                      Key Highlights & Deliverables
                    </div>
                    <ul className="space-y-2">
                      {programme.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#434652] font-medium leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#006e29] shrink-0 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expandable Curriculum Accordion */}
                  <div className="border-t border-[#cbdaff]/60 pt-4 mb-6">
                    <button
                      onClick={() => toggleCurriculum(programme.id)}
                      className="w-full flex items-center justify-between text-xs font-black text-[#002869] hover:text-[#0b3d91] cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#002869]" />
                        <span>Curriculum Roadmap ({programme.curriculum.length} Modules)</span>
                      </span>
                      {isCurriculumOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isCurriculumOpen && (
                      <div className="mt-3 space-y-2.5 animate-in fade-in">
                        {programme.curriculum.map((mod, i) => (
                          <div key={i} className="p-3 bg-white rounded-xl border border-[#cbdaff] text-xs">
                            <div className="font-bold text-[#002869]">{mod.week}: {mod.topic}</div>
                            <div className="text-[11px] text-[#434652] mt-0.5">{mod.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Pricing & CTA */}
                <div className="pt-4 border-t border-[#cbdaff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] text-[#434652] uppercase font-bold">Programme Investment</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#061b3b]">
                        ₹{programme.feeINR.toLocaleString()}
                      </span>
                      {programme.originalFeeINR && (
                        <span className="text-xs text-[#737785] line-through">
                          ₹{programme.originalFeeINR.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={onOpenCounselling}
                    className="px-6 py-3 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Apply for Programme</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#79fd8d]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Page Navigation (Previous / Next) */}
        <PageBottomNav
          currentPage="programmes"
          onNavigate={onNavigate}
        />

      </div>
    </div>
  );
};

export default ProgrammesScreen;
