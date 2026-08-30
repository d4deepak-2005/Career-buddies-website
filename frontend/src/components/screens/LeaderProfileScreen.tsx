import React, { useState, useEffect } from 'react';
import { LeaderProfile, LEADERSHIP_DATA, getLeaderBySlug, getLeaderByIndex } from '../../config/leadershipData';
import { PageView } from '../../types';
import { PageNavigationControls } from '../common/PageNavigationControls';
import { StandardCandidateForm, StandardCandidateFormData } from '../common/StandardCandidateForm';
import { 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  Mail, 
  Linkedin, 
  CheckCircle2, 
  Quote, 
  Sparkles, 
  ShieldCheck, 
  Briefcase, 
  Compass, 
  Award, 
  Users, 
  Send,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { HandshakeIcon } from '../common/HandshakeIcon';
import { LeaderPortrait } from '../common/LeaderPortrait';

interface LeaderProfileScreenProps {
  slug?: string;
  onSelectLeader: (slug: string) => void;
  setActivePage: (page: PageView) => void;
  onOpenCounselling?: () => void;
  previousPage?: PageView;
}

export const LeaderProfileScreen: React.FC<LeaderProfileScreenProps> = ({
  slug = 'nishant-sharma',
  onSelectLeader,
  setActivePage,
  onOpenCounselling,
  previousPage = 'about-us'
}) => {
  const currentLeader: LeaderProfile = getLeaderBySlug(slug) || LEADERSHIP_DATA[0];
  const currentIndex = LEADERSHIP_DATA.findIndex(l => l.profileSlug === currentLeader.profileSlug);
  
  const prevLeader = getLeaderByIndex(currentIndex - 1);
  const nextLeader = getLeaderByIndex(currentIndex + 1);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setImageLoaded(false);
  }, [slug]);

  const handleFormSubmit = async (data: StandardCandidateFormData) => {
    setSubmitting(true);
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
          requirement: `Direct Message to ${currentLeader.name} (${currentLeader.role}): ${data.additionalInfo || 'Leadership Advisory Connect'}`,
          planInterest: `Leadership Connect - ${currentLeader.name}`,
          source: `Leader Profile Page - ${currentLeader.name}`
        })
      });
      setSubmittedName(data.firstName);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 6000);
    } catch (err) {
      console.error('Error sending message:', err);
      setSubmittedName(data.firstName);
      setSubmitSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#f9f9ff] py-8 sm:py-12 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1240px] mx-auto flex flex-col gap-10 sm:gap-12">

        {/* 1. TOP NAVIGATION CONTROLS */}
        <PageNavigationControls
          onBackToHome={() => {
            setActivePage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBack={() => {
            setActivePage(previousPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNext={() => {
            onSelectLeader(nextLeader.profileSlug);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          backLabel={`Back to ${previousPage === 'about-us' ? 'About Us' : 'Previous'}`}
          nextLabel={`Next: ${nextLeader.name}`}
          currentStepLabel={`Leader Profile: ${currentLeader.name}`}
        />

        {/* Quick Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#747783] -mt-4 pb-2 border-b border-[#e0e8ff]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePage('home')}
              className="hover:text-[#002869] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <button
              onClick={() => setActivePage('about-us')}
              className="hover:text-[#002869] transition-colors cursor-pointer"
            >
              Meet Our Leadership
            </button>
            <span>/</span>
            <span className="font-bold text-[#061b3b]">{currentLeader.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#006e29] bg-[#d7f8df] px-2.5 py-0.5 rounded-full">
              Verified Leadership Profile
            </span>
          </div>
        </div>

        {/* 2. LARGE PROFILE HERO */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#cbdaff] shadow-xs relative overflow-hidden flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#dae2ff]/30 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

          {/* Large Actual Photograph with Consistent Aspect Ratio */}
          <div className="w-full sm:w-80 lg:w-96 shrink-0 flex flex-col items-center">
            <div className="w-full rounded-3xl overflow-hidden shadow-lg border-2 border-[#002869]/20">
              <LeaderPortrait
                slug={currentLeader.profileSlug}
                name={currentLeader.name}
                role={currentLeader.role}
                title={currentLeader.title}
                yearsOfExperience={currentLeader.yearsOfExperience}
                imageSrc={currentLeader.image}
                aspectRatio="aspect-[4/4.8]"
                showBadges={true}
              />
            </div>

            {/* Direct Connect Buttons & Full Email under Photo */}
            <div className="w-full flex flex-col gap-2 mt-4">
              <a
                href={`mailto:${currentLeader.email}`}
                className="py-2.5 px-3 rounded-xl bg-[#f1f3ff] hover:bg-[#002869] text-[#002869] hover:text-white text-xs font-bold transition-all border border-[#cbdaff] flex items-center justify-center gap-1.5 shadow-2xs group/mail"
                title={`Send email to ${currentLeader.name}`}
              >
                <Mail className="w-3.5 h-3.5 text-[#006e29] group-hover/mail:text-white shrink-0" />
                <span className="font-mono text-[11px] sm:text-xs break-all">{currentLeader.email}</span>
              </a>

              {currentLeader.linkedIn && (
                <a
                  href={currentLeader.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-[#f1f3ff] hover:bg-[#0077b5] text-[#002869] hover:text-white text-xs font-bold transition-all border border-[#cbdaff] flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Linkedin className="w-3.5 h-3.5 shrink-0" />
                  <span>Connect on LinkedIn</span>
                </a>
              )}
            </div>
          </div>

          {/* Hero Details Column */}
          <div className="flex-1 flex flex-col gap-6 text-center lg:text-left z-10">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-black uppercase tracking-wider self-center lg:self-start">
                <Sparkles className="w-3.5 h-3.5 text-[#006e29]" />
                <span>{currentLeader.role} • CareerBuddies</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight leading-tight">
                {currentLeader.name}
              </h1>

              <p className="text-base sm:text-lg font-bold text-[#006e29]">
                {currentLeader.title}
              </p>

              {/* Verified Experience Badge */}
              <div className="inline-flex items-center gap-2 self-center lg:self-start px-4 py-2 rounded-2xl bg-[#002869] text-white text-xs sm:text-sm font-bold shadow-xs mt-1">
                <Award className="w-4 h-4 text-[#79fd8d]" />
                <span>{currentLeader.yearsOfExperience}</span>
              </div>
            </div>

            {/* Headline Subtext */}
            <p className="text-sm sm:text-base text-[#434652] leading-relaxed font-medium">
              {currentLeader.headline}
            </p>

            {/* Key Expertise Chips */}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#747783]">
                Core Competencies & Strategic Domains:
              </span>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                {currentLeader.expertise.map((exp, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-[#f1f3ff] text-[#001947] text-xs font-bold border border-[#cbdaff] shadow-2xs"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onOpenCounselling}
                className="px-6 py-3 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <HandshakeIcon size="sm" />
                <span>Book 1:1 Career Consultation</span>
              </button>

              <button
                onClick={() => {
                  const element = document.getElementById('leadership-direct-message');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3 rounded-xl bg-white hover:bg-[#f1f3ff] text-[#002869] text-xs sm:text-sm font-bold transition-all border border-[#cbdaff] shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#006e29]" />
                <span>Send Direct Inquiry</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. ABOUT SECTION */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#cbdaff] shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#002869] text-white flex items-center justify-center shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase text-[#006e29] tracking-wider">
                Professional Profile
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                About {currentLeader.name}
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-4 text-xs sm:text-sm text-[#434652] leading-relaxed">
            {currentLeader.about.map((paragraph, pIdx) => (
              <p key={pIdx} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* 4. PROFESSIONAL EXPERIENCE SECTION */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#cbdaff] shadow-xs flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#006e29] text-white flex items-center justify-center shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-[#002869] tracking-wider">
                  Experience & Track Record
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Professional Experience
                </h2>
              </div>
            </div>

            <span className="px-3.5 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-black">
              {currentLeader.yearsOfExperience}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#434652] leading-relaxed font-medium">
            {currentLeader.experienceSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {currentLeader.experienceHighlights.map((exp, idx) => (
              <div
                key={idx}
                className="bg-[#f9f9ff] p-6 rounded-2xl border border-[#cbdaff] flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-[#061b3b]">
                      {exp.roleTitle}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#006e29]">
                    {exp.focus}
                  </span>
                  <p className="text-xs text-[#434652] leading-relaxed mt-1">
                    {exp.summary}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-gray-200/60">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#002869]">
                    Key Deliverables & Impact:
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {exp.keyDeliverables.map((item, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2 text-xs text-[#434652]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#006e29] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. AREAS OF FOCUS / EXPERTISE */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#cbdaff] shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#002869] text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase text-[#006e29] tracking-wider">
                Domains of Competency
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                Areas of Focus & Strategic Expertise
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentLeader.focusAreas.map((area, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#f1f3ff] border border-[#cbdaff]/80 flex items-center gap-3 shadow-2xs hover:bg-[#dae2ff]/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-[#002869] text-white flex items-center justify-center shrink-0 text-xs font-black">
                  {idx + 1}
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#061b3b]">
                  {area}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. ROLE AT CAREERBUDDIES */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#cbdaff] shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#002869] text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase text-[#006e29] tracking-wider">
                Leadership Function
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                Role at CareerBuddies
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#434652] leading-relaxed">
            {currentLeader.roleAtCareerBuddies}
          </p>

          <div className="bg-[#f9f9ff] p-6 rounded-2xl border border-[#cbdaff] flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#002869]">
              Core Executive Responsibilities:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentLeader.roleResponsibilities.map((resp, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#061b3b] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0 mt-0.5" />
                  <span>{resp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7. LEADERSHIP PHILOSOPHY */}
        <div className="bg-[#002869] text-white rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#79fd8d]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-[#79fd8d] flex items-center justify-center shrink-0 border border-white/20">
              <Quote className="w-7 h-7" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-black uppercase text-[#79fd8d] tracking-wider">
                Leadership Philosophy
              </span>
              <blockquote className="text-base sm:text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] leading-snug">
                "{currentLeader.philosophy.quote}"
              </blockquote>
              <p className="text-xs sm:text-sm text-[#dae2ff] leading-relaxed">
                — {currentLeader.name}, {currentLeader.role} • {currentLeader.philosophy.context}
              </p>
            </div>
          </div>
        </div>

        {/* DIRECT MESSAGE / CONNECT BOX */}
        <div id="leadership-direct-message" className="bg-white rounded-3xl p-6 sm:p-10 border border-[#cbdaff] shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#006e29] text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase text-[#002869] tracking-wider">
                Direct Communication
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                Connect with {currentLeader.name}
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#434652]">
            Have a question about CareerBuddies programs, mentorship partnerships, or career advisory? Send a direct note to {currentLeader.name}'s desk.
          </p>

          {submitSuccess ? (
            <div className="p-6 rounded-2xl bg-[#d7f8df] border border-[#006e29]/30 text-[#00531d] flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold">Message received, {submittedName}!</span> We have forwarded your message to {currentLeader.name} and the advisory team. Expect a response shortly at your provided email/phone.
              </div>
            </div>
          ) : (
            <StandardCandidateForm
              submitButtonText={`Send Note to ${currentLeader.name}`}
              submitButtonColor="blue"
              contextTag={`Leadership Desk: ${currentLeader.name} (${currentLeader.role})`}
              additionalInfoLabel={`Message for ${currentLeader.name}`}
              additionalInfoPlaceholder={`Hi ${currentLeader.name}, I would like your guidance on...`}
              onSubmit={handleFormSubmit}
              isLoading={submitting}
            />
          )}
        </div>

        {/* 8. NAVIGATION TO ANOTHER LEADERSHIP PROFILE */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Previous Leader Button */}
          <button
            onClick={() => {
              onSelectLeader(prevLeader.profileSlug);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#f1f3ff] hover:bg-[#002869] text-[#002869] hover:text-white border border-[#cbdaff] text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <div className="text-left">
              <span className="block text-[10px] text-[#747783] group-hover:text-[#dae2ff] uppercase font-bold">
                Previous Leader
              </span>
              <span>{prevLeader.name} ({prevLeader.role})</span>
            </div>
          </button>

          {/* 9. BACK TO HOME */}
          <button
            onClick={() => {
              setActivePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          {/* Next Leader Button */}
          <button
            onClick={() => {
              onSelectLeader(nextLeader.profileSlug);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#f1f3ff] hover:bg-[#002869] text-[#002869] hover:text-white border border-[#cbdaff] text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
          >
            <div className="text-right">
              <span className="block text-[10px] text-[#747783] group-hover:text-[#dae2ff] uppercase font-bold">
                Next Leader
              </span>
              <span>{nextLeader.name} ({nextLeader.role})</span>
            </div>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </div>
  );
};
