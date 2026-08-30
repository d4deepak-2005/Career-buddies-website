import React, { useState } from 'react';
import { MOCK_MENTORS } from '../../data/mockData';
import { Mentor } from '../../types';
import { 
  Sparkles, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Star, 
  ShieldCheck, 
  Calendar, 
  Briefcase, 
  Target, 
  Zap 
} from 'lucide-react';

interface SmartMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMentor: (mentor: Mentor) => void;
  onBookMentor: (mentor: Mentor) => void;
}

export const SmartMatchingModal: React.FC<SmartMatchingModalProps> = ({
  isOpen,
  onClose,
  onSelectMentor,
  onBookMentor
}) => {
  const [step, setStep] = useState<number>(1);
  const [currentRole, setCurrentRole] = useState<string>('Software Engineer');
  const [targetRole, setTargetRole] = useState<string>('Staff / Principal Engineer');
  const [experience, setExperience] = useState<string>('3-6 years');
  const [primaryGoal, setPrimaryGoal] = useState<string>('Promotion & Leveling');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setStep(4); // Results screen
    }, 1200);
  };

  const handleReset = () => {
    setStep(1);
    setIsCalculating(false);
  };

  // Determine top 3 matches based on inputs
  const matchedMentors = MOCK_MENTORS.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#e0e8ff] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#002869] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#79fd8d]" />
            <h3 className="font-bold text-base">Smart Matchmaker (AI Grounded)</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#dae2ff] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step Progress Bar */}
          {step <= 3 && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-[#434652] mb-2">
                <span>Step {step} of 3</span>
                <span className="text-[#002869]">
                  {step === 1 ? 'Career Trajectory' : step === 2 ? 'Experience & Level' : 'Primary Objective'}
                </span>
              </div>
              <div className="w-full bg-[#f1f3ff] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#002869] h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h4 className="text-lg font-bold text-[#061b3b]">What is your current discipline?</h4>
                <p className="text-xs text-[#434652] mt-0.5">We'll pair you with a mentor who deeply understands your stack and role dynamics.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  'Software Engineer',
                  'Product Manager',
                  'Product Designer',
                  'Data & AI Engineer',
                  'Engineering Manager',
                  'Growth & Marketing'
                ].map((role) => (
                  <button
                    key={role}
                    onClick={() => setCurrentRole(role)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      currentRole === role
                        ? 'border-[#002869] bg-[#dae2ff]/30 text-[#002869] ring-2 ring-[#002869]/20'
                        : 'border-[#e0e8ff] hover:bg-[#f9f9ff] text-[#061b3b]'
                    }`}
                  >
                    <span>{role}</span>
                    {currentRole === role && <Check className="w-4 h-4 text-[#002869]" />}
                  </button>
                ))}
              </div>

              <div className="mt-2">
                <label className="block text-xs font-bold text-[#061b3b] mb-1.5">
                  Where do you want to be next? (Target Role)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Staff / Principal Engineer',
                    'Director / VP of Product',
                    'Design Lead / Head of UX',
                    'CTO / Founder Transition',
                    'Senior / Team Lead',
                    'Targeting FAANG / Top Tech'
                  ].map((target) => (
                    <button
                      key={target}
                      onClick={() => setTargetRole(target)}
                      className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        targetRole === target
                          ? 'border-[#006e29] bg-[#79fd8d]/20 text-[#00531d] ring-2 ring-[#006e29]/20'
                          : 'border-[#e0e8ff] hover:bg-[#f9f9ff] text-[#061b3b]'
                      }`}
                    >
                      <span>{target}</span>
                      {targetRole === target && <Check className="w-4 h-4 text-[#006e29]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h4 className="text-lg font-bold text-[#061b3b]">What is your current experience level?</h4>
                <p className="text-xs text-[#434652] mt-0.5">Helps us select a mentor with the exact seniority delta to accelerate your growth.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Early Career (0-2 years)', desc: 'Focus on core execution & rapid learning' },
                  { label: 'Mid-Level (3-6 years)', desc: 'Transitioning to Senior & increasing scope' },
                  { label: 'Senior (7-10 years)', desc: 'Staff archetype, architecture, or management track' },
                  { label: 'Staff+ / Leadership (10+ yrs)', desc: 'Executive presence, org strategy & VP roles' }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setExperience(item.label)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      experience === item.label
                        ? 'border-[#002869] bg-[#dae2ff]/30 ring-2 ring-[#002869]/20'
                        : 'border-[#e0e8ff] hover:bg-[#f9f9ff]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#061b3b]">{item.label}</span>
                      {experience === item.label && <Check className="w-4 h-4 text-[#002869]" />}
                    </div>
                    <p className="text-[11px] text-[#434652] mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h4 className="text-lg font-bold text-[#061b3b]">What is your #1 focus right now?</h4>
                <p className="text-xs text-[#434652] mt-0.5">We match mentors based on proven track records solving this exact challenge.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Promotion & Leveling Packet', desc: 'Crafting persuasive evidence of impact for upcoming cycle' },
                  { label: 'System Design & Arch Mastery', desc: 'Cracking complex distributed systems interviews' },
                  { label: 'Executive Stakeholder Alignment', desc: 'Cross-functional influence, diplomacy, and board reviews' },
                  { label: 'Salary Negotiation & Offer Review', desc: 'Maximizing equity, bonuses, and competing offers' },
                  { label: 'Zero to One Product Launch', desc: 'Strategy, customer discovery, and roadmapping' },
                  { label: 'Engineering Management Pivot', desc: 'Transitioning from individual contributor to high-trust manager' }
                ].map((goal) => (
                  <button
                    key={goal.label}
                    onClick={() => setPrimaryGoal(goal.label)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      primaryGoal === goal.label
                        ? 'border-[#002869] bg-[#dae2ff]/30 ring-2 ring-[#002869]/20'
                        : 'border-[#e0e8ff] hover:bg-[#f9f9ff]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#061b3b]">{goal.label}</span>
                      {primaryGoal === goal.label && <Check className="w-4 h-4 text-[#002869]" />}
                    </div>
                    <p className="text-[11px] text-[#434652] mt-1">{goal.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: RESULTS */}
          {step === 4 && (
            <div className="flex flex-col gap-6 animate-in fade-in">
              <div className="bg-[#f1f3ff] p-4 rounded-xl border border-[#cbdaff] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#006e29] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    3 Perfect Mentors Found
                  </span>
                  <p className="text-xs text-[#061b3b] mt-0.5">
                    Tailored for: <strong>{currentRole}</strong> → <strong>{targetRole}</strong> ({primaryGoal})
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-[#002869] font-bold hover:underline"
                >
                  Adjust Preferences
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {matchedMentors.map((mentor, index) => {
                  const matchPercentage = index === 0 ? 99 : index === 1 ? 97 : 94;
                  return (
                    <div
                      key={mentor.id}
                      className="p-4 rounded-xl border border-[#e0e8ff] hover:border-[#002869] bg-[#f9f9ff] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={mentor.avatar}
                          alt={mentor.name}
                          className="w-14 h-14 rounded-xl object-cover border border-white shadow-xs shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-[#061b3b]">{mentor.name}</h5>
                            <span className="px-2 py-0.5 rounded bg-[#dae2ff] text-[#001947] text-[10px] font-bold">
                              {mentor.company}
                            </span>
                            <span className="bg-[#79fd8d]/30 text-[#00531d] text-[10px] px-2 py-0.5 rounded-full font-bold">
                              {matchPercentage}% Match
                            </span>
                          </div>
                          <p className="text-xs text-[#434652]">{mentor.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#747783]">
                            <span className="flex items-center text-amber-500 font-bold">
                              ★ {mentor.rating}
                            </span>
                            <span>• {mentor.sessionsCompleted} sessions</span>
                            <span className="text-[#006e29] font-bold">• ${mentor.hourlyRate}/session</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectMentor(mentor);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-[#002869] hover:bg-[#dae2ff]/50 rounded-lg"
                        >
                          View Bio
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onBookMentor(mentor);
                          }}
                          className="px-4 py-1.5 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-bold rounded-lg shadow-xs active:scale-95"
                        >
                          Book 1:1
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#f9f9ff] border-t border-[#e0e8ff] flex items-center justify-between">
          {step > 1 && step <= 3 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#434652] hover:text-[#061b3b]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#002869] text-white text-xs font-bold rounded-lg hover:bg-[#0b3d91] active:scale-95 transition-all shadow-xs"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : step === 3 ? (
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#006e29] text-white text-xs font-bold rounded-lg hover:bg-[#00531d] active:scale-95 transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCalculating ? 'Matching with 1,200+ Mentors...' : 'Generate My Matches'}</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#002869] text-white text-xs font-bold rounded-lg hover:bg-[#0b3d91]"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
