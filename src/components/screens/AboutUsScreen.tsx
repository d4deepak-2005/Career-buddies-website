import React from 'react';
import { 
  DEFAULT_SITE_CONFIG, 
  JOURNEY_TIMELINE, 
  WHY_TRUST_POINTS 
} from '../../config/siteConfig';
import { PageView } from '../../types';
import { LeadershipSection } from '../common/LeadershipSection';
import { SectionHeading } from '../common/SectionHeading';
import { PageNavigationControls } from '../common/PageNavigationControls';
import { 
  HeartHandshake, 
  Compass, 
  Sparkles, 
  Mail, 
  MapPin, 
  ArrowRight, 
  CheckCircle2,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface AboutUsScreenProps {
  setActivePage: (page: PageView) => void;
  onStartMatching?: () => void;
  onBecomeMentor?: () => void;
  onOpenCounselling?: () => void;
  onSelectLeader?: (slug: string) => void;
}

export const AboutUsScreen: React.FC<AboutUsScreenProps> = ({
  setActivePage,
  onOpenCounselling,
  onSelectLeader
}) => {
  return (
    <div className="w-full bg-[#f9f9ff] py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-12 sm:gap-16">
        
        {/* Universal Navigation Controls */}
        <PageNavigationControls
          onBackToHome={() => {
            setActivePage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBack={() => {
            setActivePage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNext={() => {
            setActivePage('how-it-works');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          backLabel="Home"
          nextLabel="Our Journey (2022–2026)"
          currentStepLabel="About CareerBuddies"
        />

        {/* Mission & Purpose Banner */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-black uppercase tracking-wider">
            <HeartHandshake className="w-4 h-4 text-[#006e29]" />
            <span>Our Purpose & Founding Belief</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
            Grounded Career Guidance for Ambitious Minds.
          </h1>

          <p className="text-sm sm:text-base text-[#434652] leading-relaxed max-w-2xl font-medium">
            Career decisions are among the most pivotal choices we make in life. We build human-centric mentorship, practical masterclasses, and structured diagnostics so no professional has to navigate career dilemmas alone.
          </p>
        </div>

        {/* The Core Story Box */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#cbdaff] shadow-xs flex flex-col lg:flex-row items-center gap-10">
          <div className="lg:w-3/5 flex flex-col gap-4">
            <span className="text-xs font-black text-[#006e29] uppercase tracking-wider">
              Why We Started
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif] leading-snug">
              "CareerBuddies began its journey in 2022 with a simple observation: career decisions often become more difficult when people have to make them alone."
            </h2>

            <p className="text-xs sm:text-sm text-[#434652] leading-relaxed">
              Whether you are a college graduate or an engineer with ten years of experience, professional growth is rarely linear. Too many people grapple with:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-1 text-xs text-[#061b3b] font-bold">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#002869]" />
                Career confusion & direction ambiguity
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#006e29]" />
                Lack of practical, objective guidance
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#002869]" />
                Skill gaps in modern tech stacks
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#006e29]" />
                Difficulty making career transitions
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#002869]" />
                Interview challenges & leveling barriers
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#006e29]" />
                Finding experienced, accessible mentors
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#434652] leading-relaxed">
              CareerBuddies replaces disconnected advice with structured career acceleration plans, live masterclasses, and tailored 90-day action blueprints.
            </p>
          </div>

          <div className="lg:w-2/5 w-full bg-[#f1f3ff] rounded-2xl p-6 sm:p-8 border border-[#cbdaff] flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#002869] text-white flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#061b3b]">Structured Direction</h4>
                <span className="text-[11px] text-[#747783]">No generic motivational talk</span>
              </div>
            </div>

            <p className="text-xs text-[#434652] leading-relaxed">
              Every mentor interaction, webinar, or diagnostic session starts with a structured audit of where you are, where you want to be, and the concrete milestones to bridge that gap.
            </p>

            <button
              onClick={onOpenCounselling}
              className="w-full py-3 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Book Free Counselling Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COMPANY JOURNEY TIMELINE (2022 - 2026) */}
        <div className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="AUTHENTIC EVOLUTION"
            title="Our Journey: 2022 to 2026"
            description="How an effort to understand real career bottlenecks evolved into a structured technology-enabled mentorship ecosystem."
            badgeIcon={Calendar}
            badgeColor="blue"
            align="center"
            size="xl"
          />

          <div className="relative border-l-2 border-[#002869]/20 ml-4 sm:ml-32 space-y-10 pl-6 sm:pl-8">
            {JOURNEY_TIMELINE.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Year Indicator on timeline */}
                <div className="absolute -left-[35px] sm:-left-[43px] top-1 w-8 h-8 rounded-full bg-[#002869] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-110 transition-transform">
                  {item.year.slice(2)}
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#e0e8ff] hover:border-[#002869]/40 transition-all hover:shadow-xs flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-[#002869]">
                        {item.year}
                      </span>
                      <span className="text-sm font-bold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                        — {item.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#006e29] bg-[#79fd8d]/20 px-2.5 py-0.5 rounded-full w-fit">
                      {item.tagline}
                    </span>
                  </div>

                  <p className="text-xs text-[#434652] leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                    {item.highlights.map((hl, hlIdx) => (
                      <div key={hlIdx} className="flex items-center gap-2 text-[11px] text-[#061b3b]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#006e29] shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REUSABLE LEADERSHIP SECTION WITH FULL PROFILES */}
        <div className="-mx-4 sm:-mx-6 lg:-mx-10">
          <LeadershipSection
            onSelectLeader={onSelectLeader}
            setActivePage={setActivePage}
            onOpenCounselling={onOpenCounselling}
            onBackToHome={() => {
              setActivePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>

        {/* QUALITATIVE TRUST SECTION */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#cbdaff] flex flex-col gap-8">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
              Why Trust CareerBuddies?
            </h3>
            <p className="text-xs sm:text-sm text-[#747783]">
              We evaluate our work by the clarity, depth, and practical impact delivered to each mentee.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_TRUST_POINTS.map((pt, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#f9f9ff] border border-[#e0e8ff] flex flex-col gap-2">
                <span className="font-bold text-sm text-[#061b3b]">{pt.title}</span>
                <p className="text-xs text-[#434652] leading-relaxed">{pt.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* REGISTERED OFFICE & CONTACT FOOTPRINT */}
        <div className="bg-[#f1f3ff] rounded-3xl p-8 sm:p-10 border border-[#cbdaff] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#002869]">
              <MapPin className="w-4 h-4 text-[#006e29]" />
              <span>Registered Headquarters</span>
            </div>
            <h4 className="font-bold text-base text-[#061b3b]">
              CareerBuddies Global Operations
            </h4>
            <p className="text-xs text-[#434652] max-w-lg leading-relaxed font-medium">
              {DEFAULT_SITE_CONFIG.officeAddress}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                setActivePage('contact');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 bg-white border border-[#002869]/20 text-[#002869] font-bold text-xs rounded-xl shadow-xs hover:bg-[#dae2ff]/30 transition-colors cursor-pointer"
            >
              Contact Desk
            </button>

            <button
              onClick={onOpenCounselling}
              className="px-5 py-2.5 bg-[#006e29] hover:bg-[#00531d] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Book Free Counselling Call
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
