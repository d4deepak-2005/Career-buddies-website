import React, { useState } from 'react';
import { STRUCTURED_SERVICES, CAREER_PLANS, MOCK_FAQS } from '../../data/mockData';
import { DEFAULT_SITE_CONFIG, JOURNEY_TIMELINE } from '../../config/siteConfig';
import { Mentor, PageView, ServiceItem, PlanItem } from '../../types';
import { BrandTagline } from '../BrandTagline';
import { FindYourNextStep } from '../common/FindYourNextStep';
import { WhyTrustSection } from '../common/WhyTrustSection';
import { LeadershipSection } from '../common/LeadershipSection';
import { SectionHeading } from '../common/SectionHeading';
import { 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  Star, 
  ArrowRight, 
  Sparkles, 
  Briefcase,
  Users,
  Calendar,
  Compass,
  GraduationCap,
  Video,
  Award,
  ChevronRight,
  PhoneCall,
  HeartHandshake,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  Layers,
  Zap,
  Target,
  ArrowUpRight
} from 'lucide-react';

interface HomeScreenProps {
  onSelectMentor: (mentor: Mentor) => void;
  onBookMentor: (mentor: Mentor) => void;
  onStartMatching: () => void;
  onBecomeMentor: () => void;
  onOpenCounselling: () => void;
  onSelectService: (service: ServiceItem) => void;
  onSelectPlan: (plan: PlanItem) => void;
  setActivePage: (page: PageView) => void;
  onSelectLeader?: (slug: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectMentor,
  onBookMentor,
  onStartMatching,
  onBecomeMentor,
  onOpenCounselling,
  onSelectService,
  onSelectPlan,
  setActivePage,
  onSelectLeader
}) => {
  const previewServices = STRUCTURED_SERVICES.slice(0, 6);

  // Quick Hero Lead Capture Form state
  const [heroForm, setHeroForm] = useState({
    name: '',
    mobile: '',
    email: '',
    goal: 'Career Direction & Mentorship'
  });
  const [heroSubmitted, setHeroSubmitted] = useState(false);
  const [heroLoading, setHeroLoading] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleHeroFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroForm.name || !heroForm.mobile) return;

    setHeroLoading(true);
    try {
      const parts = heroForm.name.trim().split(' ');
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: parts[0],
          lastName: parts.slice(1).join(' ') || '',
          mobile: heroForm.mobile.trim(),
          email: heroForm.email.trim() || 'counselling-lead@careerbuddies.in',
          currentRole: 'Professional',
          experience: '2-5 years',
          industry: 'Technology',
          requirement: heroForm.goal,
          planInterest: 'Free Diagnostic Counselling',
          source: 'Hero Quick Diagnostic'
        })
      });
      setHeroSubmitted(true);
    } catch (err) {
      console.error(err);
      setHeroSubmitted(true);
    } finally {
      setHeroLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-white">
      
      {/* 1. HERO SECTION (Left Content + Right Career Progression Visual Architecture) */}
      <section className="relative overflow-hidden bg-[#002869] text-white pt-8 sm:pt-12 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-10">
        {/* Atmospheric Career-Growth & Progression Background Visual */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-25">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1440 800" fill="none">
            <defs>
              <linearGradient id="heroGrowthGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#79fd8d" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#79fd8d" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#dae2ff" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="heroGridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dae2ff" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#79fd8d" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Subtle Career Growth Vectors & Progression Grid */}
            <path d="M-100 720 C 300 660, 600 480, 950 340 C 1200 240, 1400 140, 1600 70" stroke="url(#heroGrowthGrad)" strokeWidth="2" strokeDasharray="8 6" />
            <path d="M-50 780 C 350 720, 750 520, 1100 380 C 1300 290, 1480 180, 1650 90" stroke="url(#heroGrowthGrad)" strokeWidth="1.5" strokeOpacity="0.4" />
            
            {/* Ambient Tech Grid Nodes */}
            <circle cx="950" cy="340" r="4.5" fill="#79fd8d" fillOpacity="0.8" />
            <circle cx="1100" cy="250" r="5.5" fill="#79fd8d" fillOpacity="0.9" />
            <circle cx="1250" cy="160" r="6.5" fill="#79fd8d" />
            <circle cx="1250" cy="160" r="15" stroke="#79fd8d" strokeWidth="1.5" strokeOpacity="0.35" />
          </svg>
        </div>

        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#79fd8d]/10 rounded-full blur-3xl pointer-events-none -mr-28 -mt-28" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#dae2ff]/10 rounded-full blur-3xl pointer-events-none -ml-24 -mb-24" />

        <div className="relative z-10 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Clean, Left-Aligned Hero Content Hierarchy */}
          <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 text-left">
            
            {/* 1. Small Brand / Trust Badge */}
            <div className="w-fit">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 shadow-xs hover:bg-white/15 transition-all">
                <Sparkles className="w-3.5 h-3.5 text-[#79fd8d]" />
                <span className="text-xs font-bold text-[#dae2ff] tracking-wide">
                  Bridging the gap between aspiration and achievement
                </span>
              </div>
            </div>

            {/* 2. Main Hero Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-4.5xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.16] font-['Plus_Jakarta_Sans',sans-serif]">
              Accelerate Your Career with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#dae2ff] to-[#79fd8d]">
                Structured Practitioner Guidance
              </span>
            </h1>

            {/* 3. Supporting Description */}
            <p className="text-sm sm:text-base text-[#dae2ff]/90 leading-relaxed max-w-xl font-normal">
              Navigate career transitions, level up to Senior and Staff engineering, and master system design with verified leaders from top global technology ecosystems.
            </p>

            {/* 4 & 5. Primary and Secondary CTAs */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-3.5 pt-1">
              <button
                id="hero-advisor-cta-btn"
                onClick={onOpenCounselling}
                className="w-full sm:w-auto justify-center px-6 py-3.5 rounded-xl bg-[#006e29] hover:bg-[#00531d] text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <span>Connect with Our Advisor</span>
                <ArrowRight className="w-4 h-4 text-[#79fd8d]" />
              </button>

              <button
                id="hero-webinar-cta-btn"
                onClick={() => setActivePage('webinars')}
                className="w-full sm:w-auto justify-center px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 text-[#79fd8d]" />
                <span>Join Live Webinar (₹{DEFAULT_SITE_CONFIG.webinarDefaultPriceINR})</span>
              </button>

              <button
                id="hero-explore-programmes-btn"
                onClick={() => setActivePage('programmes')}
                className="w-full sm:w-auto justify-center px-4 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-[#dae2ff] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-[#79fd8d]" />
                <span>Explore Programmes</span>
              </button>
            </div>

            {/* Qualitative Trust Badges */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 border-t border-white/15 text-xs text-[#dae2ff]/90">
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#79fd8d] shrink-0" />
                Live Practitioner Masterclasses
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#79fd8d] shrink-0" />
                Dedicated Advisor Profile Alignment
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#79fd8d] shrink-0" />
                Personalized Industry Master Sessions
              </span>
            </div>

          </div>

          {/* Right Column: Seamless Integrated Career Progression & Mentorship Architecture Visual */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center py-2 lg:py-0">
            
            {/* Atmospheric Background Blending & Radial Highlights */}
            <div className="relative w-full max-w-[480px] lg:max-w-none aspect-[5/4] sm:aspect-[4/3] lg:aspect-[5/4] flex items-center justify-center">
              
              {/* Soft Ambient Depth Blooms merging seamlessly into the Hero background */}
              <div className="absolute top-1/4 right-6 w-52 h-52 bg-[#79fd8d]/12 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-4 left-8 w-60 h-60 bg-[#004bb5]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-radial from-white/[0.03] to-transparent rounded-full blur-2xl pointer-events-none" />

              {/* Integrated Vector System: Ascending Career Growth & Technology Architecture */}
              <svg 
                className="w-full h-full absolute inset-0 overflow-visible pointer-events-none select-none" 
                viewBox="0 0 500 420" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Gradients for Ascending Trajectories */}
                  <linearGradient id="heroAscGrad1" x1="40" y1="380" x2="440" y2="60" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#dae2ff" stopOpacity="0.1" />
                    <stop offset="35%" stopColor="#dae2ff" stopOpacity="0.4" />
                    <stop offset="70%" stopColor="#79fd8d" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#79fd8d" stopOpacity="1" />
                  </linearGradient>

                  <linearGradient id="heroAscGrad2" x1="60" y1="390" x2="460" y2="90" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#dae2ff" stopOpacity="0.05" />
                    <stop offset="50%" stopColor="#006e29" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#79fd8d" stopOpacity="0.6" />
                  </linearGradient>

                  <filter id="heroApexGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="10" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Layer 1: Ambient Tech Constellation & Depth Grid */}
                <g opacity="0.2">
                  <line x1="60" y1="120" x2="440" y2="120" stroke="#dae2ff" strokeWidth="1" strokeDasharray="4 8" strokeOpacity="0.4" />
                  <line x1="60" y1="220" x2="440" y2="220" stroke="#dae2ff" strokeWidth="1" strokeDasharray="4 8" strokeOpacity="0.3" />
                  <line x1="60" y1="320" x2="440" y2="320" stroke="#dae2ff" strokeWidth="1" strokeDasharray="4 8" strokeOpacity="0.2" />
                  <circle cx="160" cy="120" r="2" fill="#dae2ff" fillOpacity="0.6" />
                  <circle cx="340" cy="220" r="2" fill="#dae2ff" fillOpacity="0.6" />
                  <circle cx="220" cy="320" r="2" fill="#dae2ff" fillOpacity="0.6" />
                </g>

                {/* Layer 2: Guided Trajectory Energy Conduits (Mentor to Mentee Growth Arc) */}
                <path 
                  d="M 50 370 C 130 360, 180 290, 240 240 C 310 180, 360 130, 430 75" 
                  stroke="url(#heroAscGrad2)" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  opacity="0.5"
                />
                <path 
                  d="M 60 360 C 140 345, 190 270, 255 220 C 325 165, 380 110, 440 60" 
                  stroke="url(#heroAscGrad1)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
                <path 
                  d="M 75 350 C 150 330, 200 250, 270 200 C 340 145, 395 95, 450 50" 
                  stroke="#79fd8d" 
                  strokeWidth="1.5" 
                  strokeDasharray="5 7" 
                  strokeOpacity="0.5"
                />

                {/* Layer 3: Career Stage Stepping Platforms (Integrated Depth Vectors) */}
                {/* Stage 1: Diagnostic */}
                <g transform="translate(60, 330)">
                  <ellipse cx="25" cy="18" rx="35" ry="12" fill="#001f52" fillOpacity="0.7" stroke="#dae2ff" strokeWidth="1" strokeOpacity="0.3" />
                  <circle cx="25" cy="18" r="4.5" fill="#dae2ff" fillOpacity="0.8" />
                  <line x1="25" y1="18" x2="25" y2="-15" stroke="#dae2ff" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.5" />
                </g>

                {/* Stage 2: Masterclass & Skill Expansion */}
                <g transform="translate(160, 240)">
                  <ellipse cx="30" cy="20" rx="42" ry="14" fill="#002869" fillOpacity="0.8" stroke="#79fd8d" strokeWidth="1" strokeOpacity="0.4" />
                  <circle cx="30" cy="20" r="5" fill="#79fd8d" fillOpacity="0.9" />
                  <line x1="30" y1="20" x2="30" y2="-20" stroke="#79fd8d" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.6" />
                </g>

                {/* Stage 3: 1:1 Senior Engineering & Systems Architecture */}
                <g transform="translate(285, 150)">
                  <ellipse cx="35" cy="22" rx="48" ry="16" fill="#003d8f" fillOpacity="0.7" stroke="#79fd8d" strokeWidth="1.2" strokeOpacity="0.6" />
                  <circle cx="35" cy="22" r="6" fill="#79fd8d" />
                  <line x1="35" y1="22" x2="35" y2="-25" stroke="#79fd8d" strokeWidth="1.2" strokeDasharray="2 3" strokeOpacity="0.8" />
                </g>

                {/* Stage 4: Staff & Principal Leadership Apex */}
                <g transform="translate(405, 45)">
                  <circle cx="35" cy="20" r="28" fill="#79fd8d" fillOpacity="0.12" filter="url(#heroApexGlow)" />
                  <circle cx="35" cy="20" r="16" fill="#79fd8d" fillOpacity="0.25" />
                  <ellipse cx="35" cy="20" rx="44" ry="16" fill="#001f52" fillOpacity="0.85" stroke="#79fd8d" strokeWidth="1.5" />
                  <circle cx="35" cy="20" r="7" fill="#79fd8d" />
                  <circle cx="35" cy="20" r="11" stroke="#79fd8d" strokeWidth="1" strokeOpacity="0.5" />
                </g>

                {/* Upward Career Trajectory Vector Arrowhead */}
                <polygon points="450,45 462,55 448,60" fill="#79fd8d" opacity="0.9" />
              </svg>

              {/* Layer 4: Seamless Integrated Floating Milestone Elements */}
              <div className="relative z-10 w-full h-full flex flex-col justify-between p-2 sm:p-4">
                
                {/* Top Floating Node: Staff & Principal Apex Goal */}
                <div className="self-end mr-1 sm:mr-4">
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-white/[0.12] to-white/[0.04] backdrop-blur-md border border-white/20 shadow-xl">
                    <div className="w-6 h-6 rounded-lg bg-[#79fd8d]/20 border border-[#79fd8d]/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-[#79fd8d]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-extrabold text-white tracking-wide">Staff & Principal Track</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#79fd8d] animate-pulse" />
                      </div>
                      <span className="text-[10px] text-[#79fd8d] font-semibold">High-Impact Architecture & Leadership</span>
                    </div>
                  </div>
                </div>

                {/* Mid-Tier Node: 1:1 Senior Mentor Alignment (Center) */}
                <div className="self-center ml-2 sm:ml-6 my-auto">
                  <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-white/[0.09] to-white/[0.03] backdrop-blur-md border border-[#79fd8d]/30 shadow-lg">
                    <div className="w-6 h-6 rounded-lg bg-[#006e29]/40 border border-[#79fd8d]/50 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 text-[#79fd8d]" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white">1:1 Practitioner Mentorship</span>
                        <span className="text-[9px] font-bold text-[#002869] bg-[#79fd8d] px-1.5 py-0.2 rounded-full">Active</span>
                      </div>
                      <p className="text-[10px] text-[#dae2ff]/90">FAANG+ & Tier-1 Tech Ecosystem Leaders</p>
                    </div>
                  </div>
                </div>

                {/* Lower Foundation Node: Profile Diagnostic & Structured Path */}
                <div className="self-start ml-1 sm:ml-3">
                  <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.07] backdrop-blur-sm border border-white/15 shadow-md">
                    <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                      <Target className="w-3 h-3 text-[#dae2ff]" />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-white block">Diagnostic & Roadmap Formulation</span>
                      <span className="text-[9px] text-[#dae2ff]/70">Step-by-step career acceleration plan</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. FIND YOUR NEXT STEP (Decision Grid) */}
      <FindYourNextStep 
        onNavigate={setActivePage} 
        onOpenCounselling={onOpenCounselling} 
      />

      {/* 3. HOW CAREERBUDDIES WORKS (7-Step Real Customer Journey) */}
      <section className="relative overflow-hidden w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-[#002869] text-white">
        {/* Subtle Ambient Brand Glows matching hero visual tone */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#79fd8d]/8 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#dae2ff]/8 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 max-w-[1280px] mx-auto flex flex-col gap-10 sm:gap-12">
          
          <SectionHeading
            eyebrow="THE REAL 7-STAGE JOURNEY"
            title="How CareerBuddies Accelerates Your Career"
            description="A structured, transparent pathway from your first live mentor masterclass to dedicated profile overhaul and personalized master sessions."
            badgeIcon={Layers}
            badgeColor="blue"
            dark={true}
            align="center"
          />

          {/* 7-Step Progression Grid with Unified Architectural Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
            {[
              {
                step: "01",
                title: "Live Mentor Webinar",
                badge: "₹199 Entry",
                desc: "Start with an affordable 90-minute live masterclass led by senior mentors from top tech companies.",
                icon: Calendar,
                color: "green"
              },
              {
                step: "02",
                title: "Express Interest",
                badge: "Next Step",
                desc: "Genuinely interested professionals continue their journey and request a personalized strategy conversation.",
                icon: ArrowUpRight,
                color: "blue"
              },
              {
                step: "03",
                title: "Advisor Discussion",
                badge: "Requirement Stage",
                desc: "A dedicated Career Advisor analyzes your background, current challenges, and goals to recommend the right plan.",
                icon: Users,
                color: "blue"
              },
              {
                step: "04",
                title: "Choose 1 of 3 Plans",
                badge: "Tailored Options",
                desc: "Select the most suitable plan (Foundation Sprint, Transition Track, or Executive Mastery) for your career stage.",
                icon: Layers,
                color: "green"
              },
              {
                step: "05",
                title: "Programme Enrolment",
                badge: "Onboarding",
                desc: "Formally enrol in your chosen programme to unlock dedicated team resources and milestone tracking.",
                icon: CheckCircle2,
                color: "blue"
              },
              {
                step: "06",
                title: "Dedicated Profile Work",
                badge: "Hands-on",
                desc: "Our specialized team completely overhauls your ATS resume, LinkedIn profile, and portfolio assets.",
                icon: Sparkles,
                color: "green"
              },
              {
                step: "07",
                title: "Personalized Master Session",
                badge: "Personalized Master Session",
                desc: "In the following week, engage in an in-depth master session with a verified practitioner matched to your domain.",
                icon: Award,
                color: "blue"
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="bg-[#142d4f]/90 border border-white/10 rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative hover:border-[#79fd8d]/60 hover:bg-[#18365e] transition-all duration-200 shadow-md hover:shadow-xl group"
              >
                <div>
                  {/* Step Header with Step Badge, Milestone Counter & Subtle Progression Cue */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-white/10 border border-white/15 text-[#dae2ff] group-hover:text-[#79fd8d] group-hover:border-[#79fd8d]/40 text-xs font-black flex items-center justify-center transition-colors">
                        {item.step}
                      </span>
                      <span className="text-[11px] font-bold text-white/50 group-hover:text-white/80 transition-colors uppercase tracking-wider">
                        Stage {item.step}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                      item.color === 'green' ? 'bg-[#79fd8d]/20 text-[#79fd8d] border border-[#79fd8d]/30' : 'bg-white/10 text-[#dae2ff] border border-white/15'
                    }`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 font-['Plus_Jakarta_Sans',sans-serif] group-hover:text-[#79fd8d] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#dae2ff]/80 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3.5 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-[#79fd8d] group-hover:text-white transition-colors">
                  <span>Explore Stage {item.step}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </div>
            ))}

            {/* Stage 8 Summary / Journey Action Callout Card */}
            <div className="bg-gradient-to-br from-[#003d8f] to-[#002256] text-white rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-lg border border-white/20 hover:border-[#79fd8d]/40 transition-all">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-bold text-[#79fd8d] mb-3.5 border border-white/10">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The Complete Journey</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
                  Ready to Start at Step 1?
                </h3>
                <p className="text-xs text-[#dae2ff] leading-relaxed">
                  Join our next live mentor webinar to learn directly from leading industry practitioners.
                </p>
              </div>

              <button
                onClick={() => setActivePage('webinars')}
                className="mt-5 w-full py-2.5 rounded-xl bg-[#79fd8d] hover:bg-[#5cf272] text-[#002869] font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Join Live Webinar (₹{DEFAULT_SITE_CONFIG.webinarDefaultPriceINR})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex justify-center pt-2 sm:pt-4">
            <button
              onClick={() => setActivePage('how-it-works')}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>View Detailed 7-Stage Methodology</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* 4. THREE STRUCTURED CAREER PLANS SHOWCASE */}
      <section className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-[#f1f3ff] border-y border-[#cbdaff]">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-10 sm:gap-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <div className="max-w-2xl flex flex-col gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-bold w-fit">
                <Layers className="w-3.5 h-3.5 text-[#002869]" />
                <span>Step 4: Three Tailored Plans</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                Choose the Right CareerBuddies Plan for Your Stage
              </h2>
              <p className="text-sm text-[#434652] leading-relaxed">
                After attending your ₹199 webinar, your Career Advisor will match you with one of our three structured plans. Dedicated profile work begins immediately upon enrolment.
              </p>
            </div>

            <button
              onClick={() => setActivePage('programmes')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#002869] text-white hover:bg-[#0b3d91] text-xs font-bold transition-all shadow-2xs cursor-pointer w-fit shrink-0"
            >
              <span>Compare All 3 Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {CAREER_PLANS.slice(0, 3).map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-200 hover:shadow-lg relative ${
                  plan.isRecommended ? 'border-[#002869] ring-2 ring-[#002869]/20' : 'border-[#cbdaff]'
                }`}
              >
                {plan.isRecommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-[#002869] text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                    Recommended Track
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
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

                  <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#e0e8ff] mb-5">
                    <div className="text-xs font-bold text-[#061b3b] mb-1">
                      {plan.sessionsCount}
                    </div>
                    <div className="text-[11px] text-[#747783]">
                      {plan.supportType}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mb-6">
                    <span className="text-[11px] font-bold uppercase text-[#747783] tracking-wider">
                      Included Deliverables:
                    </span>
                    {plan.features.slice(0, 4).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0 mt-0.5" />
                        <span className="text-[#434652]">{feat.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-[#002869] font-['Plus_Jakarta_Sans',sans-serif]">
                      {plan.priceINR}
                    </span>
                    <span className="text-[11px] text-[#747783] block">
                      {plan.period}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectPlan(plan)}
                    className="px-4 py-2.5 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View Plan Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. LIVE & UPCOMING WEBINARS SPOTLIGHT (Section 5 & 6) */}
      <section className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-[#f9f9ff]">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-10 sm:gap-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <div className="max-w-2xl flex flex-col gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#79fd8d]/25 text-[#00531d] text-xs font-bold w-fit">
                <GraduationCap className="w-3.5 h-3.5 text-[#006e29]" />
                <span>Live Learning Masterclasses</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                Join High-Impact Weekend Masterclasses
              </h2>
              <p className="text-sm text-[#434652] leading-relaxed">
                Focused 90-minute live deep dives with staff practitioners covering system design, AI architectures, and product strategy. Accessible at ₹{DEFAULT_SITE_CONFIG.webinarDefaultPriceINR} per session.
              </p>
            </div>

            <button
              onClick={() => setActivePage('webinars')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#002869] text-white hover:bg-[#0b3d91] text-xs font-bold transition-all shadow-2xs cursor-pointer w-fit shrink-0"
            >
              <span>View All Masterclasses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* 5. CAREER CHECK-IN TEASER (Section 9) */}
      <section className="w-full py-14 sm:py-18 px-4 sm:px-6 lg:px-10 bg-[#f1f3ff]">
        <div className="max-w-[1280px] mx-auto bg-[#002869] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#79fd8d]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
            <div className="max-w-2xl flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-[#79fd8d] w-fit">
                <Compass className="w-3.5 h-3.5" />
                <span>Career Clarity Discovery Tool</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',sans-serif]">
                Feeling unsure about your next career move?
              </h2>
              <p className="text-xs sm:text-sm text-[#dae2ff] leading-relaxed">
                Take our 2-minute interactive Career Check-In to evaluate where you stand, identify your core bottleneck, and receive a tailored recommendation for guidance.
              </p>
            </div>

            <button
              onClick={() => setActivePage('career-check-in')}
              className="px-6 py-3.5 rounded-xl bg-[#79fd8d] hover:bg-[#5cf272] text-[#002869] font-extrabold text-xs sm:text-sm transition-all shadow-md whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0"
            >
              <span>Start 2-Min Career Check-In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. STRUCTURED SERVICES PREVIEW */}
      <section className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-10 sm:gap-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <div className="max-w-2xl flex flex-col gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-bold w-fit">
                <Briefcase className="w-3.5 h-3.5 text-[#002869]" />
                <span>12 Tailored Growth Tracks</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                Structured Mentorship & Career Programs
              </h2>
              <p className="text-sm text-[#434652] leading-relaxed">
                Proven blueprints designed for software engineers, product managers, data scientists, and technical leaders navigating pivotal career moments.
              </p>
            </div>

            <button
              onClick={() => setActivePage('services')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002869] hover:underline cursor-pointer shrink-0"
            >
              <span>View All 12 Tracks</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {previewServices.map((service) => (
              <div
                key={service.id}
                onClick={() => onSelectService(service)}
                className="bg-[#f9f9ff] rounded-2xl p-6 border border-[#e0e8ff] hover:border-[#002869]/50 transition-all duration-200 hover:shadow-2xs flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#dae2ff] text-[#001947] text-[11px] font-bold">
                      {service.category}
                    </span>
                    <span className="text-[11px] text-[#747783] font-medium">
                      {service.duration}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#061b3b] group-hover:text-[#002869] transition-colors mb-2">
                    {service.title}
                  </h3>

                  <p className="text-xs text-[#434652] leading-relaxed mb-4 line-clamp-3">
                    {service.shortDescription}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#002869]">
                  <span>Explore Track</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. FEATURED VERIFIED MENTORS ("Learn Directly from Industry Leaders") */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-10 sm:gap-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <div className="max-w-2xl flex flex-col gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dae2ff] text-[#001947] border border-[#cbdaff] text-xs font-bold w-fit">
                <Users className="w-3.5 h-3.5 text-[#006e29]" />
                <span>Top Senior Mentors</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                Learn Directly from Industry Leaders
              </h2>
              <p className="text-sm text-[#434652] leading-relaxed">
                Learn directly from verified practitioners who have scaled systems, led high-output teams, and conducted hundreds of hiring rounds.
              </p>
            </div>

            <button
              onClick={() => setActivePage('mentors')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer w-fit shrink-0"
            >
              <span>Explore All Mentors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* 8. MEET OUR LEADERSHIP SECTION (The 3 Founders) */}
      <LeadershipSection
        onSelectLeader={onSelectLeader}
        setActivePage={setActivePage}
        onOpenCounselling={onOpenCounselling}
        onBackToHome={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 9. AUTHENTIC JOURNEY TEASER (2022-2026) */}
      <section className="w-full py-14 sm:py-18 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-[1280px] mx-auto bg-[#f9f9ff] rounded-3xl p-8 sm:p-12 border border-[#cbdaff] flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="max-w-2xl flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-bold w-fit">
              <HeartHandshake className="w-3.5 h-3.5 text-[#006e29]" />
              <span>Authentic Brand Story</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
              "Career decisions often become more difficult when people have to make them alone."
            </h3>
            <p className="text-xs sm:text-sm text-[#434652] leading-relaxed">
              Started in 2022, CareerBuddies has grown into a structured technology-enabled ecosystem connecting ambitious learners with verified mentors, masterclasses, and actionable playbooks.
            </p>
          </div>

          <button
            onClick={() => setActivePage('about-us')}
            className="px-6 py-3.5 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs sm:text-sm font-bold transition-all shadow-2xs whitespace-nowrap flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Read Our Journey (2022–2026)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 10. WHY TRUST CAREERBUDDIES */}
      <WhyTrustSection />

      {/* 11. FAQ SECTION */}
      <section className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-[#f9f9ff]">
        <div className="max-w-[900px] mx-auto flex flex-col gap-10 sm:gap-12">
          
          <SectionHeading
            eyebrow="FREQUENTLY ASKED QUESTIONS"
            title="Common Questions About CareerBuddies"
            description="Everything you need to know about our mentorship model, pricing transparency, and diagnostic sessions."
            badgeIcon={HelpCircle}
            badgeColor="blue"
            align="center"
          />

          <div className="flex flex-col gap-3.5 sm:gap-4">
            {MOCK_FAQS.slice(0, 5).map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#cbdaff] rounded-2xl overflow-hidden transition-all duration-200 shadow-2xs hover:border-[#002869]/40"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-4 sm:py-4.5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50"
                  >
                    <span className="text-sm sm:text-base font-bold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#002869] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-2 text-xs sm:text-sm text-[#434652] leading-relaxed border-t border-gray-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 12. FINAL CALL TO ACTION */}
      <section className="w-full py-16 sm:py-22 px-4 sm:px-6 lg:px-10 bg-white text-[#061b3b]">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6 sm:gap-7">
          <div className="w-14 h-14 rounded-2xl bg-[#002869]/10 text-[#006e29] flex items-center justify-center shadow-2xs">
            <Sparkles className="w-7 h-7" />
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
            Start Your Structured Career Journey Today
          </h2>

          <p className="text-sm sm:text-base text-[#434652] max-w-xl leading-relaxed">
            Begin with an accessible ₹{DEFAULT_SITE_CONFIG.webinarDefaultPriceINR} live mentor-led masterclass, connect with a dedicated Career Advisor, and accelerate with our proven 3-tier career plans.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 pt-2">
            <button
              onClick={() => setActivePage('webinars')}
              className="px-8 py-3.5 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-[#002869]/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Join Live Mentor Webinar (₹{DEFAULT_SITE_CONFIG.webinarDefaultPriceINR})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActivePage('programmes')}
              className="px-6 py-3.5 bg-[#f0f5ff] hover:bg-[#e1edff] border border-[#cbdaff] text-[#002869] text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              Explore 3 Career Plans
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
