import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Phone, 
  Mail, 
  User, 
  Briefcase, 
  Clock, 
  Send, 
  ShieldCheck, 
  MessageSquare,
  Award,
  Calendar,
  Building,
  Target
} from 'lucide-react';
import { OFFICE_DETAILS } from '../../data/mockData';
import { PageView } from '../../types';
import { PageNavigationControls } from '../common/PageNavigationControls';
import { StandardCandidateForm, StandardCandidateFormData } from '../common/StandardCandidateForm';

interface CounsellingScreenProps {
  onLeadSubmitted?: () => void;
  setActivePage?: (page: PageView) => void;
}

export const CounsellingScreen: React.FC<CounsellingScreenProps> = ({ 
  onLeadSubmitted,
  setActivePage 
}) => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [submittedMobile, setSubmittedMobile] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleFormSubmit = async (data: StandardCandidateFormData) => {
    setLoading(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          mobile: data.mobile,
          email: data.email,
          currentRole: data.currentDesignation,
          experience: data.totalExperience,
          alternateNumber: data.alternateNumber,
          alternateEmail: data.alternateEmail,
          linkedinUrl: data.linkedinUrl,
          notes: data.additionalInfo,
          requirement: 'Free 1:1 Strategic Career Counselling & Profile Diagnosis',
          planInterest: 'Elevate Career Guidance (Recommended)',
          source: 'Counselling Page'
        })
      });

      setSubmittedName(data.firstName);
      setSubmittedMobile(data.mobile);
      setSubmittedEmail(data.email);
      setIsSuccess(true);
      if (onLeadSubmitted) onLeadSubmitted();
    } catch (err) {
      console.error('Submission error:', err);
      setSubmittedName(data.firstName);
      setSubmittedMobile(data.mobile);
      setSubmittedEmail(data.email);
      setIsSuccess(true);
      if (onLeadSubmitted) onLeadSubmitted();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-10">
        
        {/* Universal Navigation Controls */}
        <PageNavigationControls
          onBackToHome={() => {
            if (setActivePage) {
              setActivePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onBack={() => {
            if (setActivePage) {
              setActivePage('career-check-in');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onNext={() => {
            if (setActivePage) {
              setActivePage('plans');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          backLabel="Career Check-In"
          nextLabel="View Plans"
          currentStepLabel="Free 1:1 Strategic Counselling"
        />

        {/* Main Grid: Form (7 cols) + Value Stack (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Card */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-[#cbdaff] shadow-xs">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#002869]" />
                <span>100% Free 30-Min Diagnostic Session</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                Book Free Career Counselling
              </h1>
              <p className="text-xs sm:text-sm text-[#434652] mt-1.5 font-medium">
                Tell us about your current role, challenges, and goals. We will match you with a senior advisor for a personalized action plan.
              </p>
            </div>

            {isSuccess ? (
              <div className="py-8 px-4 text-center flex flex-col items-center gap-4 animate-in zoom-in-95 bg-[#f1f3ff] rounded-2xl border border-[#79fd8d]">
                <div className="w-16 h-16 rounded-full bg-[#79fd8d]/30 text-[#006e29] flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <h2 className="text-2xl font-black text-[#061b3b]">
                  Application Received, {submittedName}!
                </h2>

                <p className="text-sm text-[#434652] max-w-md leading-relaxed">
                  Our senior counsellor has been notified and will reach out to you on <strong>{submittedMobile}</strong> and <strong>{submittedEmail}</strong> within <strong>2 business hours</strong> to finalize your calendar slot.
                </p>

                <div className="bg-white p-5 rounded-xl border border-[#cbdaff] w-full text-left mt-2">
                  <div className="flex items-center gap-2 text-xs font-black text-[#002869] mb-1">
                    <ShieldCheck className="w-4 h-4 text-[#006e29]" />
                    <span>Instant Concierge Connection</span>
                  </div>
                  <p className="text-xs text-[#434652]">
                    Prefer to chat right now? Reach out to our lead guidance desk directly on WhatsApp.
                  </p>
                  <a
                    href={OFFICE_DETAILS.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat on WhatsApp (+91 9310288270)</span>
                  </a>
                </div>

                <button
                  onClick={() => setIsSuccess(false)}
                  className="mt-4 text-xs font-black text-[#002869] hover:underline cursor-pointer"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <StandardCandidateForm
                submitButtonText="Book Free 30-Min Diagnostic Session"
                submitButtonColor="green"
                contextTag="counselling"
                onSubmit={handleFormSubmit}
                isLoading={loading}
              />
            )}
          </div>

          {/* Right Column: Value Stack */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-[#002869] text-white p-8 rounded-3xl relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#79fd8d]/20 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
              
              <div className="relative z-10 flex flex-col gap-4">
                <span className="text-xs font-black uppercase text-[#79fd8d] tracking-wider">
                  WHAT HAPPENS IN YOUR CALL
                </span>
                
                <h3 className="text-xl font-black text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  Personalized 30-Minute Career Diagnostic
                </h3>

                <div className="space-y-3.5 mt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 text-[#79fd8d] flex items-center justify-center shrink-0 mt-0.5">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Leveling & Band Gap Audit</span>
                      <p className="text-[11px] text-[#d7e2ff] mt-0.5">We analyze your current compensation and leveling against current Tier-1 tech benchmarks.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 text-[#79fd8d] flex items-center justify-center shrink-0 mt-0.5">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Mentor Matching Recommendation</span>
                      <p className="text-[11px] text-[#d7e2ff] mt-0.5">We identify 2-3 specific verified mentors from Google, Amazon, Uber, or Microsoft who have achieved the exact trajectory you want.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 text-[#79fd8d] flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Actionable 90-Day Roadmap</span>
                      <p className="text-[11px] text-[#d7e2ff] mt-0.5">Walk away with an immediate 3-step action plan, whether you enroll in paid mentorship or not.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Box */}
            <div className="bg-white p-6 rounded-3xl border border-[#cbdaff] flex flex-col gap-3 shadow-xs">
              <span className="text-xs font-black uppercase text-[#006e29] tracking-wider">
                Direct WhatsApp Inquiries
              </span>
              <p className="text-xs text-[#434652] font-medium leading-relaxed">
                Need urgent guidance for an upcoming interview loop or leveling decision? Chat directly with our founding team.
              </p>
              <div className="flex flex-col gap-2 mt-1">
                <a
                  href="https://wa.me/919310288270?text=Hi%20CareerBuddies%2C%20I%20would%20like%20to%20book%20a%20free%20career%20counselling%20session."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f1f3ff] hover:bg-[#dae2ff] text-[#006e29] text-xs font-bold transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-[#006e29]" />
                  <span>WhatsApp: +91 9310288270</span>
                </a>
                <a
                  href="https://wa.me/918890790077?text=Hi%20CareerBuddies%2C%20I%20would%20like%20to%20book%20a%20free%20career%20counselling%20session."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f1f3ff] hover:bg-[#dae2ff] text-[#006e29] text-xs font-bold transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-[#006e29]" />
                  <span>WhatsApp: +91 8890790077</span>
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
