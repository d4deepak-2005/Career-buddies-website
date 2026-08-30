import React, { useState } from 'react';
import { FounderInfo } from '../../types';
import { StandardCandidateForm, StandardCandidateFormData } from '../common/StandardCandidateForm';
import { 
  X, 
  Mail, 
  Linkedin, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  MessageSquare, 
  Send, 
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight,
  Home
} from 'lucide-react';
import { HandshakeIcon } from '../common/HandshakeIcon';
import { LeaderPortrait } from '../common/LeaderPortrait';

interface LeadershipProfileModalProps {
  founder: FounderInfo | null;
  onClose: () => void;
  onOpenCounselling?: () => void;
  onBackToHome?: () => void;
}

export const LeadershipProfileModal: React.FC<LeadershipProfileModalProps> = ({
  founder,
  onClose,
  onOpenCounselling,
  onBackToHome
}) => {
  if (!founder) return null;

  const [sentSuccess, setSentSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
          requirement: `Direct Message to ${founder.name} (${founder.role}): ${data.additionalInfo || 'Leadership Desk Inquiry'}`,
          planInterest: `Leadership Connect - ${founder.name}`,
          source: `Founder Profile - ${founder.name}`
        })
      });
      setSubmittedName(data.firstName);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error submitting leadership inquiry:', err);
      setSubmittedName(data.firstName);
      setSentSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061b3b]/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#cbdaff] shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header with Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#f1f3ff] border-b border-[#cbdaff] shrink-0">
          <div className="flex items-center gap-2">
            {onBackToHome && (
              <button
                onClick={() => {
                  onClose();
                  onBackToHome();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#cbdaff] text-[#002869] text-xs font-bold hover:bg-[#dae2ff] transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>← Home</span>
              </button>
            )}
            <span className="text-xs font-bold text-[#747783] hidden sm:inline">
              Leadership Profile
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#434652] hover:text-[#061b3b] hover:bg-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex flex-col gap-6">
          {/* Profile Header Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-[#f9f9ff] p-6 rounded-3xl border border-[#e0e8ff]">
            {/* Authentic Photograph */}
            <div className="w-36 sm:w-44 shrink-0 rounded-2xl overflow-hidden shadow-md border-2 border-[#002869]/20">
              <LeaderPortrait
                slug={founder.name.toLowerCase().replace(/\s+/g, '-')}
                name={founder.name}
                role={founder.role}
                title={founder.title || founder.role}
                yearsOfExperience={founder.experienceYears ? `${founder.experienceYears}+ Yrs` : '10+ Yrs'}
                imageSrc={founder.avatar}
                aspectRatio="aspect-[4/4.8]"
                showBadges={false}
              />
            </div>

            {/* Core Info */}
            <div className="flex flex-col gap-3 text-center sm:text-left flex-1">
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  {founder.name}
                </h3>
                <p className="text-sm font-bold text-[#006e29] mt-0.5">
                  {founder.title}
                </p>
                <p className="text-xs text-[#747783]">
                  CareerBuddies Core Leadership Team
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <a
                  href={`mailto:${founder.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#cbdaff] text-[#002869] text-xs font-bold hover:bg-[#dae2ff] transition-all shadow-2xs"
                >
                  <Mail className="w-3.5 h-3.5 text-[#006e29]" />
                  <span>{founder.email}</span>
                </a>

                {founder.linkedIn && (
                  <a
                    href={founder.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#002869] text-white text-xs font-bold hover:bg-[#0b3d91] transition-all shadow-2xs"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
              </div>

              {/* Tagline Badge */}
              <div className="mt-2 pt-2 border-t border-gray-200/70 inline-flex items-center gap-2 text-xs font-bold text-[#002869]">
                <HandshakeIcon size="xs" />
                <span>Your Career | Our Guidance</span>
              </div>
            </div>
          </div>

          {/* Biography & Mission */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#002869]">
              Leadership Vision & Bio
            </h4>
            <p className="text-xs sm:text-sm text-[#434652] leading-relaxed">
              {founder.bio}
            </p>
          </div>

          {/* Core Contribution & Architecture */}
          {founder.contribution && (
            <div className="p-4 rounded-2xl bg-[#dae2ff]/40 border border-[#cbdaff] flex flex-col gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#001947] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#006e29]" />
                <span>Key Platform Architecture & Focus</span>
              </span>
              <p className="text-xs sm:text-sm text-[#061b3b] font-medium leading-relaxed">
                {founder.contribution}
              </p>
            </div>
          )}

          {/* Core Areas of Focus */}
          {founder.expertise && founder.expertise.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#002869]">
                Areas of Strategic Expertise
              </h4>
              <div className="flex flex-wrap gap-2">
                {founder.expertise.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-[#f1f3ff] text-[#002869] text-xs font-bold border border-[#cbdaff]"
                  >
                    • {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Direct Connect / Advisory Form */}
          <div className="bg-[#f9f9ff] p-5 sm:p-6 rounded-3xl border border-[#cbdaff] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#006e29]" />
                <h4 className="text-sm font-bold text-[#061b3b]">
                  Send a Message or Advisory Request to {founder.name}
                </h4>
              </div>
              <span className="text-[11px] text-[#747783] hidden sm:inline">
                Direct Leadership Desk
              </span>
            </div>

            {sentSuccess ? (
              <div className="p-4 rounded-2xl bg-[#79fd8d]/25 border border-[#006e29]/30 text-xs font-bold text-[#00531d] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#006e29]" />
                <span>Thank you, {submittedName}! Your advisory request has been forwarded to {founder.name}. Our team will respond shortly.</span>
              </div>
            ) : (
              <StandardCandidateForm
                submitButtonText={`Send Note to ${founder.name}`}
                submitButtonColor="blue"
                contextTag={`Leadership Desk: ${founder.name} (${founder.role})`}
                additionalInfoLabel={`Message for ${founder.name}`}
                additionalInfoPlaceholder={`Write your career question or advisory goal for ${founder.name}...`}
                onSubmit={handleFormSubmit}
                isLoading={submitting}
              />
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-[#f1f3ff] border-t border-[#cbdaff] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-bold text-[#434652] hover:text-[#061b3b] cursor-pointer"
          >
            ← Close Profile
          </button>

          {onOpenCounselling && (
            <button
              onClick={() => {
                onClose();
                onOpenCounselling();
              }}
              className="w-full sm:w-auto px-4 py-2 bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#79fd8d]" />
              <span>Book Free 1:1 Strategic Counselling</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
