import React, { useState } from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  TrendingUp, 
  Users, 
  Crown, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Calendar,
  ChevronRight
} from 'lucide-react';
import { PageView } from '../../types';
import { WEBINAR_ENTRY_PRICE_INR } from '../../config/webinars';

interface StageRecommendation {
  stageId: string;
  title: string;
  tagline: string;
  icon: React.ElementType;
  badge: string;
  summary: string;
  keyChallenges: string[];
  recommendedServices: { title: string; desc: string }[];
  recommendedProgramme: { name: string; duration: string; fee: string; highlight: string };
  recommendedWebinar: { title: string; price: number; time: string };
  actionText: string;
}

const STAGES: StageRecommendation[] = [
  {
    stageId: 'student',
    title: 'Student / Graduate',
    tagline: 'Building high-signal fundamentals, ATS resumes, and landing your first offer',
    icon: GraduationCap,
    badge: 'Campus to Corporate',
    summary: 'Tailored for students and fresh graduates seeking high-conviction job placement strategies and technical interview preparation.',
    keyChallenges: [
      'Lack of relevant industry experience on resume',
      'Unclear expectations regarding technical interview bars',
      'Cold outreach and networking rejections'
    ],
    recommendedServices: [
      { title: 'ATS Resume Reconstruction', desc: 'Transform academic projects into high-signal professional bullet points.' },
      { title: 'Foundational Mock Interviews', desc: 'Practice real coding and HR rounds with senior industry mentors.' }
    ],
    recommendedProgramme: {
      name: 'Early Career & Campus-to-Corporate Launchpad',
      duration: '4 Weeks',
      fee: '₹4,999',
      highlight: 'ATS-proof resume + 1:1 technical interview drills'
    },
    recommendedWebinar: {
      title: 'Production Generative AI & LLM Systems for Applied Engineers',
      price: WEBINAR_ENTRY_PRICE_INR,
      time: 'Live Weekend Session'
    },
    actionText: 'Book Free Graduate Diagnostic'
  },
  {
    stageId: 'early-career',
    title: 'Early Career (0 - 3 Years)',
    tagline: 'Accelerating early promotions, mastering core stacks, and beating salary stagnation',
    icon: Briefcase,
    badge: '0-3 Yrs Experience',
    summary: 'Focused on junior to mid-level engineers and analysts seeking faster promotions, higher compensation, and strong engineering fundamentals.',
    keyChallenges: [
      'Feeling boxed into routine maintenance or low-impact tasks',
      'Unsure how to stand out during annual performance evaluations',
      'Navigating first major job switch for significant compensation bump'
    ],
    recommendedServices: [
      { title: '1:1 Career Progression Roadmap', desc: 'Identify critical leveling gaps and construct a 12-month promotion plan.' },
      { title: 'Interview Strategy & Offer Negotiation', desc: 'Learn exact phrasing and leverage points to maximize offer packages.' }
    ],
    recommendedProgramme: {
      name: 'Early Career & Campus-to-Corporate Launchpad',
      duration: '4 Weeks',
      fee: '₹4,999',
      highlight: 'Leveling up engineering communication and portfolio impact'
    },
    recommendedWebinar: {
      title: 'Executive Presence & Compensation Negotiation Masterclass',
      price: WEBINAR_ENTRY_PRICE_INR,
      time: 'Saturday 05:00 PM IST'
    },
    actionText: 'Book Free 1:1 Growth Audit'
  },
  {
    stageId: 'experienced',
    title: 'Experienced IC (3 - 8 Years)',
    tagline: 'Mastering distributed systems, Staff+ leveling, and clearing Tier-1 bars',
    icon: TrendingUp,
    badge: '3-8 Yrs Experience',
    summary: 'Designed for mid-to-senior engineers aiming for Senior (L5) and Staff (L6) roles at top-tier technology enterprises.',
    keyChallenges: [
      'Failing complex System Design and architectural interview rounds',
      'Difficulty demonstrating cross-team architectural leadership',
      'Overcoming mid-career salary plateaus'
    ],
    recommendedServices: [
      { title: 'Staff+ System Design Deep-Dives', desc: '1:1 architectural teardowns of real-world distributed systems.' },
      { title: 'Senior Leveling Strategy', desc: 'Audit your achievements against Tier-1 Staff/Principal rubrics.' }
    ],
    recommendedProgramme: {
      name: 'Software Engineering & Staff+ Architecture Track',
      duration: '8 Weeks',
      fee: '₹14,999',
      highlight: 'Distributed systems, microservices & Staff interview simulations'
    },
    recommendedWebinar: {
      title: 'Mastering Large-Scale System Design for Senior & Staff Roles',
      price: WEBINAR_ENTRY_PRICE_INR,
      time: 'Saturday 06:00 PM IST'
    },
    actionText: 'Book Senior Diagnostic'
  },
  {
    stageId: 'manager',
    title: 'Manager & Emerging Leader',
    tagline: 'Transitioning from IC to engineering management, team leverage, and culture',
    icon: Users,
    badge: 'Engineering Management',
    summary: 'Empowering newly appointed and aspiring managers to navigate people dynamics, stakeholder diplomacy, and team delivery.',
    keyChallenges: [
      'Shifting mindset from hands-on coding to team delegation and leverage',
      'Handling difficult performance conversations and 1:1 coaching',
      'Managing up and aligning with executive leadership priorities'
    ],
    recommendedServices: [
      { title: 'Engineering Management Frameworks', desc: 'Structured advisory on team cadences, OKRs, and performance management.' },
      { title: 'Stakeholder Diplomacy Audits', desc: 'Master cross-functional alignment with Product, Design, and Executive teams.' }
    ],
    recommendedProgramme: {
      name: 'Executive Career Acceleration Track',
      duration: '12 Weeks',
      fee: '₹24,999',
      highlight: 'Strategic leadership, stakeholder alignment & executive presence'
    },
    recommendedWebinar: {
      title: 'Executive Presence & Compensation Negotiation Masterclass',
      price: WEBINAR_ENTRY_PRICE_INR,
      time: 'Live Weekend Masterclass'
    },
    actionText: 'Book Leadership Strategy Call'
  },
  {
    stageId: 'senior-leader',
    title: 'Senior Leader & Director (8+ Yrs)',
    tagline: 'Organizational strategy, board communication, and executive compensation loops',
    icon: Crown,
    badge: 'Executive Tier',
    summary: 'Confidential executive guidance for Directors, Heads of Engineering, and VPs steering multi-team organizations.',
    keyChallenges: [
      'Leading multi-department organizational change and strategy',
      'Evaluating complex equity, phantom stock, and executive compensation',
      'Executive narrative construction for board and C-suite interviews'
    ],
    recommendedServices: [
      { title: 'Executive Presence Advisory', desc: 'Confidential 1:1 strategy with seasoned technology VPs and founders.' },
      { title: 'Executive Compensation Structuring', desc: 'Benchmark executive packages, RSUs, vesting cliffs, and perks.' }
    ],
    recommendedProgramme: {
      name: 'Executive Career Acceleration Track',
      duration: '12 Weeks',
      fee: '₹24,999',
      highlight: 'Direct executive mentorship & confidential career counsel'
    },
    recommendedWebinar: {
      title: 'Executive Presence & Compensation Negotiation Masterclass',
      price: WEBINAR_ENTRY_PRICE_INR,
      time: 'Executive Weekend Session'
    },
    actionText: 'Schedule Executive Diagnostic'
  },
  {
    stageId: 'transition',
    title: 'Career Transition / Domain Pivot',
    tagline: 'Pivoting into Product Management, Data/AI, or modern engineering domains',
    icon: RefreshCw,
    badge: 'Domain Transition',
    summary: 'A structured blueprint for professionals transitioning between roles (e.g. Engineering to Product, QA to Fullstack, or Analytics to AI).',
    keyChallenges: [
      'Recruiters rejecting applications due to lack of direct domain title',
      'Translating past technical/analytical experience into new domain currency',
      'Building a credible case study portfolio from scratch'
    ],
    recommendedServices: [
      { title: 'Domain Transferable Skills Audit', desc: 'Map your past wins directly into the target role competency rubric.' },
      { title: 'Portfolio & PRD Review', desc: 'Build and refine recruiter-ready case studies with active hiring managers.' }
    ],
    recommendedProgramme: {
      name: 'Product Management Transition Blueprint',
      duration: '6 Weeks',
      fee: '₹9,999',
      highlight: 'Build 2 comprehensive PRDs + PM mock case interview mastery'
    },
    recommendedWebinar: {
      title: 'The Product Transition Blueprint: From Engineering to PM',
      price: WEBINAR_ENTRY_PRICE_INR,
      time: 'Sunday 11:00 AM IST'
    },
    actionText: 'Book Free Transition Audit'
  }
];

interface CareerJourneyNavigatorProps {
  onNavigate: (page: PageView) => void;
  onOpenCounselling: () => void;
  className?: string;
}

export const CareerJourneyNavigator: React.FC<CareerJourneyNavigatorProps> = ({
  onNavigate,
  onOpenCounselling,
  className = ''
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>('experienced');

  const currentStage = STAGES.find(s => s.stageId === selectedStageId) || STAGES[2];

  return (
    <section className={`w-full py-12 px-4 sm:px-6 lg:px-8 bg-[#f9f9ff] rounded-3xl border border-[#cbdaff] shadow-sm ${className}`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dae2ff] border border-[#cbdaff] text-xs font-black text-[#002869] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#006e29]" />
            <span>Interactive Diagnostic Navigator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#061b3b] tracking-tight">
            Where are you in your career journey?
          </h2>
          <p className="text-sm sm:text-base text-[#434652] mt-3">
            Select your current professional stage below to unlock tailored guidance, recommended cohort tracks, and relevant masterclasses.
          </p>
        </div>

        {/* Stage Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            const isSelected = stage.stageId === selectedStageId;
            return (
              <button
                key={stage.stageId}
                onClick={() => setSelectedStageId(stage.stageId)}
                className={`flex flex-col items-center text-center p-4 rounded-2xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#002869] text-white border-[#002869] shadow-md scale-[1.02]'
                    : 'bg-white text-[#061b3b] border-[#cbdaff] hover:border-[#002869] hover:bg-[#f1f3ff]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${
                    isSelected ? 'bg-white/15 text-[#79fd8d]' : 'bg-[#e8edff] text-[#002869]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xs font-black line-clamp-2 leading-tight">
                  {stage.title}
                </div>
                <div className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-[#79fd8d]' : 'text-[#434652]'}`}>
                  {stage.badge}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail & Recommendations Panel */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-sm animate-in fade-in duration-300">
          
          {/* Stage Overview Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#cbdaff]/70">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#002869] text-[#79fd8d] flex items-center justify-center shrink-0 shadow-xs">
                {React.createElement(currentStage.icon, { className: 'w-6 h-6' })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#79fd8d]/30 text-[#00531d] text-[10px] font-black uppercase tracking-wider">
                    {currentStage.badge}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#061b3b] mt-1">
                  {currentStage.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#434652] font-semibold mt-0.5">
                  {currentStage.tagline}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenCounselling}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-[#79fd8d]" />
              <span>{currentStage.actionText}</span>
            </button>
          </div>

          {/* 3-Column Recommendations Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            
            {/* Column 1: Core Challenges Addressed */}
            <div className="bg-[#f9f9ff] rounded-2xl p-5 border border-[#cbdaff]/80 flex flex-col justify-between">
              <div>
                <div className="text-xs font-black uppercase text-[#002869] tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#002869]" />
                  <span>Key Roadblocks We Solve</span>
                </div>
                <ul className="space-y-2.5">
                  {currentStage.keyChallenges.map((challenge, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#434652] font-medium leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0 mt-0.5" />
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 mt-4 border-t border-[#cbdaff]/60">
                <button
                  onClick={() => onNavigate('services')}
                  className="w-full py-2 bg-white hover:bg-[#dae2ff] text-[#002869] font-bold text-xs rounded-xl border border-[#cbdaff] flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span>Explore Tailored Services</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Column 2: Recommended Structured Track */}
            <div className="bg-[#f9f9ff] rounded-2xl p-5 border border-[#cbdaff]/80 flex flex-col justify-between">
              <div>
                <div className="text-xs font-black uppercase text-[#006e29] tracking-wider mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#006e29]" />
                  <span>Recommended Programme Track</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#cbdaff] mb-3">
                  <div className="text-xs font-black text-[#061b3b]">
                    {currentStage.recommendedProgramme.name}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#e8edff] text-[#002869] text-[10px] font-bold">
                      {currentStage.recommendedProgramme.duration}
                    </span>
                    <span className="text-xs font-black text-[#006e29]">
                      {currentStage.recommendedProgramme.fee}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#434652] mt-2 leading-relaxed">
                    {currentStage.recommendedProgramme.highlight}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('programmes')}
                className="w-full py-2 bg-[#002869] hover:bg-[#0b3d91] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                <span>View Programme Details</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#79fd8d]" />
              </button>
            </div>

            {/* Column 3: Live Weekend Webinar */}
            <div className="bg-[#f9f9ff] rounded-2xl p-5 border border-[#cbdaff]/80 flex flex-col justify-between">
              <div>
                <div className="text-xs font-black uppercase text-[#002869] tracking-wider mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#002869]" />
                  <span>Curated Live Webinar</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#cbdaff] mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#434652]">
                      {currentStage.recommendedWebinar.time}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#79fd8d]/30 text-[#00531d] text-[10px] font-black">
                      ₹{currentStage.recommendedWebinar.price}
                    </span>
                  </div>
                  <div className="text-xs font-black text-[#061b3b] line-clamp-2">
                    {currentStage.recommendedWebinar.title}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('webinars')}
                className="w-full py-2 bg-[#006e29] hover:bg-[#00531d] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                <span>Explore Live Webinars (₹{WEBINAR_ENTRY_PRICE_INR})</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#79fd8d]" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default CareerJourneyNavigator;
