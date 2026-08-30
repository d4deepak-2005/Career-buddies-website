import React, { useState } from 'react';
import { PageView } from '../../types';
import { 
  Compass, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Users, 
  GraduationCap, 
  BookOpen, 
  PhoneCall,
  RefreshCw,
  Target,
  ShieldCheck
} from 'lucide-react';
import { PageNavigationControls } from '../common/PageNavigationControls';

interface CareerCheckInScreenProps {
  onNavigate: (page: PageView) => void;
  onOpenCounselling: (planName?: string) => void;
}

export const CareerCheckInScreen: React.FC<CareerCheckInScreenProps> = ({
  onNavigate,
  onOpenCounselling
}) => {
  const [step, setStep] = useState<number>(1);
  const [stage, setStage] = useState<string>('');
  const [direction, setDirection] = useState<string>('');
  const [challenge, setChallenge] = useState<string>('');
  const [support, setSupport] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const stageOptions = [
    { id: 'student', title: 'Student / Recent Graduate', desc: 'Preparing to break into tech or landing first full-time role' },
    { id: 'early', title: 'Early Career (1 - 3 Years)', desc: 'Strengthening technical fundamentals and building confidence' },
    { id: 'mid', title: 'Mid-Career (4 - 8 Years)', desc: 'Targeting Senior/Lead roles or navigating domain transitions' },
    { id: 'senior', title: 'Senior & Leadership (8+ Years)', desc: 'Aiming for Staff+, Principal, Engineering Management, or Director level' }
  ];

  const directionOptions = [
    { id: 'exploring', title: 'Exploring Options & Seeking Clarity', desc: 'Unsure which path matches strengths and long-term market demand' },
    { id: 'switching', title: 'Switching Role or Tech Stack', desc: 'Pivoting from QA/Analyst to Dev, or Backend to AI/Product' },
    { id: 'growing', title: 'Accelerating Promotion in Current Track', desc: 'Seeking L5/L6 leveling, higher visibility, and compensation growth' },
    { id: 'interviewing', title: 'Actively Interviewing at Top Companies', desc: 'Polishing system design, behavioral storytelling, and negotiation' }
  ];

  const challengeOptions = [
    { id: 'direction', title: 'Lack of Clear Career Direction', desc: 'Feeling overwhelmed by options and needing an objective sounding board' },
    { id: 'system_design', title: 'System Design & High-Level Architecture', desc: 'Struggling with Staff-level ambiguity and trade-off discussions' },
    { id: 'resumes', title: 'Low Resume Shortlists & Interview Conversions', desc: 'Applications getting filtered without actionable feedback' },
    { id: 'transition', title: 'Skill Gap & Tech Stack Pivot Barriers', desc: 'Difficulty proving hands-on competency in a new domain' },
    { id: 'salary', title: 'Compensation Stagnation & Leveling Ceilings', desc: 'Stuck at current band without clear promotion visibility' }
  ];

  const supportOptions = [
    { id: '1on1', title: 'Dedicated Master Sessions & Guidance', desc: 'Ongoing strategic sessions, code/architecture teardowns, and mock interviews' },
    { id: 'webinars', title: 'Live Interactive Masterclasses & Webinars', desc: 'Affordable (₹199) deep-dive weekend workshops on specific topics' },
    { id: 'counselling', title: 'Free 30-Min Diagnostic Counselling', desc: 'Quick assessment call with our team to diagnose roadblocks and next steps' },
    { id: 'resources', title: 'Self-Paced Playbooks & Frameworks', desc: 'Curated promotion rubrics, salary negotiation scripts, and system design templates' }
  ];

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setStep(1);
    setStage('');
    setDirection('');
    setChallenge('');
    setSupport('');
    setSubmitted(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Universal Navigation Controls */}
        <PageNavigationControls
          onBackToHome={() => {
            onNavigate('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBack={() => {
            onNavigate('features');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNext={() => {
            onNavigate('counselling');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          backLabel="Find a Mentor"
          nextLabel="Free 1:1 Counselling"
          currentStepLabel="Interactive Career Check-In"
        />

        {/* Header */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-bold">
            <Compass className="w-3.5 h-3.5 text-[#002869]" />
            <span>Interactive Career Diagnostic</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Career Check-In
          </h1>

          <p className="text-sm sm:text-base text-[#434652] max-w-2xl leading-relaxed">
            Answer 4 quick questions to reflect on your current career stage, pinpoint your core challenge, and receive a customized recommendation for your next steps.
          </p>
        </div>

        {/* Diagnostic Form Container */}
        {!submitted ? (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#cbdaff] shadow-sm flex flex-col gap-8">
            
            {/* Progress Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#747783]">
                <span>Question {step} of 4</span>
                <span className="text-[#002869]">{Math.round((step / 4) * 100)}% Complete</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#f1f3ff] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#002869] to-[#006e29] transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Step 1: Stage */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                    What stage are you currently at in your career?
                  </h3>
                  <p className="text-xs text-[#747783]">
                    Select the option that best reflects your current professional journey.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
                  {stageOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setStage(opt.id)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-150 flex flex-col gap-1.5 ${
                        stage === opt.id
                          ? 'border-[#002869] bg-[#dae2ff]/30 shadow-xs'
                          : 'border-[#e0e8ff] hover:border-[#002869]/40 bg-[#f9f9ff]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#061b3b]">{opt.title}</span>
                        {stage === opt.id && <CheckCircle2 className="w-4 h-4 text-[#002869]" />}
                      </div>
                      <p className="text-xs text-[#434652] leading-relaxed">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Direction */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                    Are you exploring, switching, or growing in your career?
                  </h3>
                  <p className="text-xs text-[#747783]">
                    Identify your primary directional intent over the next 6-12 months.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
                  {directionOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setDirection(opt.id)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-150 flex flex-col gap-1.5 ${
                        direction === opt.id
                          ? 'border-[#002869] bg-[#dae2ff]/30 shadow-xs'
                          : 'border-[#e0e8ff] hover:border-[#002869]/40 bg-[#f9f9ff]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#061b3b]">{opt.title}</span>
                        {direction === opt.id && <CheckCircle2 className="w-4 h-4 text-[#002869]" />}
                      </div>
                      <p className="text-xs text-[#434652] leading-relaxed">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Challenge */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                    What is your biggest current challenge?
                  </h3>
                  <p className="text-xs text-[#747783]">
                    What is the primary bottleneck slowing your career progress?
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  {challengeOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setChallenge(opt.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 flex items-center justify-between ${
                        challenge === opt.id
                          ? 'border-[#006e29] bg-[#79fd8d]/15 shadow-xs'
                          : 'border-[#e0e8ff] hover:border-[#006e29]/40 bg-[#f9f9ff]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-[#061b3b]">{opt.title}</span>
                        <span className="text-xs text-[#434652]">{opt.desc}</span>
                      </div>
                      {challenge === opt.id && <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0 ml-2" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Desired Support */}
            {step === 4 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                    What kind of support are you looking for?
                  </h3>
                  <p className="text-xs text-[#747783]">
                    Select the format that best fits your schedule and learning preferences.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
                  {supportOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setSupport(opt.id)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-150 flex flex-col gap-1.5 ${
                        support === opt.id
                          ? 'border-[#002869] bg-[#dae2ff]/30 shadow-xs'
                          : 'border-[#e0e8ff] hover:border-[#002869]/40 bg-[#f9f9ff]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#061b3b]">{opt.title}</span>
                        {support === opt.id && <CheckCircle2 className="w-4 h-4 text-[#002869]" />}
                      </div>
                      <p className="text-xs text-[#434652] leading-relaxed">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#434652] hover:bg-[#f1f3ff] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : <div />}

              <button
                disabled={
                  (step === 1 && !stage) ||
                  (step === 2 && !direction) ||
                  (step === 3 && !challenge) ||
                  (step === 4 && !support)
                }
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#002869] hover:bg-[#0b3d91] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>{step === 4 ? 'Generate Recommendation' : 'Continue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ) : (
          /* Tailored Result Screen */
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#cbdaff] shadow-md flex flex-col gap-8">
            
            {/* Recommendation Header */}
            <div className="bg-[#002869] text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#79fd8d]/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-[#79fd8d] w-fit">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Your Personalized Career Pathway</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Based on your responses, here is your recommended direction:
                </h2>

                <p className="text-sm text-[#dae2ff] leading-relaxed">
                  "Based on your responses, you may benefit from career guidance, mentor support or a focused learning session to bridge your current gap and structure a 90-day trajectory."
                </p>
              </div>
            </div>

            {/* Summary Tag Pills */}
            <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-[#f9f9ff] border border-[#e0e8ff] text-xs">
              <span className="font-bold text-[#061b3b]">Selected Profile:</span>
              <span className="px-2.5 py-1 rounded-md bg-[#dae2ff] text-[#001947] font-semibold">
                {stageOptions.find(s => s.id === stage)?.title}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#79fd8d]/30 text-[#00531d] font-semibold">
                {directionOptions.find(d => d.id === direction)?.title}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#f1f3ff] text-[#434652] font-semibold">
                Primary Goal: {challengeOptions.find(c => c.id === challenge)?.title}
              </span>
            </div>

            {/* Recommended Concrete Action Cards */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                Recommended Actions for You:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Free Counselling */}
                <div 
                  onClick={() => onOpenCounselling && onOpenCounselling()}
                  className="p-5 rounded-2xl border border-[#cbdaff] hover:border-[#002869] bg-white transition-all hover:shadow-xs cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-[#dae2ff] text-[#002869]">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#006e29]/15 text-[#006e29] text-[10px] font-bold">
                        100% Free
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#061b3b] group-hover:text-[#002869] transition-colors">
                      Book Free 1:1 Career Counselling
                    </h4>
                    <p className="text-xs text-[#434652]">
                      Speak with our senior advisory team to audit your current stage and pinpoint exact next steps.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#002869] mt-4 flex items-center gap-1">
                    Book Call Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* 2. Find a Mentor */}
                <div 
                  onClick={() => onNavigate('mentors')}
                  className="p-5 rounded-2xl border border-[#cbdaff] hover:border-[#002869] bg-white transition-all hover:shadow-xs cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-[#dae2ff] text-[#002869]">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#dae2ff] text-[#001947] text-[10px] font-bold">
                        1:1 Support
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#061b3b] group-hover:text-[#002869] transition-colors">
                      Connect with a Verified Mentor
                    </h4>
                    <p className="text-xs text-[#434652]">
                      Browse 12+ senior practitioners from Google, Meta, Stripe, and Amazon for ongoing guidance.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#002869] mt-4 flex items-center gap-1">
                    Explore Mentors <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* 3. Browse Webinars */}
                <div 
                  onClick={() => onNavigate('webinars')}
                  className="p-5 rounded-2xl border border-[#a6f5b7] hover:border-[#006e29] bg-white transition-all hover:shadow-xs cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-[#79fd8d]/20 text-[#006e29]">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#79fd8d]/30 text-[#00531d] text-[10px] font-bold">
                        ₹199 Access
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#061b3b] group-hover:text-[#006e29] transition-colors">
                      Join Live Weekend Masterclass
                    </h4>
                    <p className="text-xs text-[#434652]">
                      Participate in live 90-min masterclasses with industry leaders with full Q&A and recordings.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#006e29] mt-4 flex items-center gap-1">
                    Browse Upcoming Webinars <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* 4. Explore Resources */}
                <div 
                  onClick={() => onNavigate('resources')}
                  className="p-5 rounded-2xl border border-[#cbdaff] hover:border-[#002869] bg-white transition-all hover:shadow-xs cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-[#dae2ff] text-[#002869]">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#dae2ff] text-[#001947] text-[10px] font-bold">
                        Free Library
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#061b3b] group-hover:text-[#002869] transition-colors">
                      Read Curated Career Playbooks
                    </h4>
                    <p className="text-xs text-[#434652]">
                      Deep dive into salary negotiation rubrics, System Design cheatsheets, and PM transition guides.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#002869] mt-4 flex items-center gap-1">
                    Access Knowledge Hub <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

              </div>
            </div>

            {/* Restart Button */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#434652] hover:bg-[#f1f3ff] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Check-In</span>
              </button>

              <button
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#002869] text-white text-xs font-bold hover:bg-[#0b3d91] transition-colors cursor-pointer"
              >
                <span>Back to Home</span>
              </button>
            </div>

          </div>
        )}

        {/* Qualitative Transparency Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#e0e8ff] text-xs text-[#747783]">
          <ShieldCheck className="w-4 h-4 text-[#002869] shrink-0 mt-0.5" />
          <p>
            <strong>Transparency Note:</strong> The CareerBuddies Career Check-In is designed as an interactive discovery and guidance tool to help you reflect on your goals. It is not presented as a psychological assessment.
          </p>
        </div>

      </div>
    </div>
  );
};
