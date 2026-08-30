import React, { useState } from 'react';
import { LEADERSHIP_DATA, LEADERSHIP_SECTION_HEADER, LeaderProfile } from '../../config/leadershipData';
import { PageView, FounderInfo } from '../../types';
import { SectionHeading } from './SectionHeading';
import { LeadershipProfileModal } from '../modals/LeadershipProfileModal';
import { HandshakeIcon } from './HandshakeIcon';
import { LeaderPortrait } from './LeaderPortrait';
import { 
  Quote, 
  Mail, 
  Linkedin, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Award
} from 'lucide-react';

interface LeadershipSectionProps {
  onOpenCounselling?: () => void;
  onBackToHome?: () => void;
  onSelectLeader?: (slug: string) => void;
  setActivePage?: (page: PageView) => void;
}

export const LeadershipSection: React.FC<LeadershipSectionProps> = ({
  onOpenCounselling,
  onBackToHome,
  onSelectLeader,
  setActivePage
}) => {
  const [modalFounder, setModalFounder] = useState<FounderInfo | null>(null);

  const handleViewProfile = (leader: LeaderProfile) => {
    if (onSelectLeader) {
      onSelectLeader(leader.profileSlug);
    } else if (setActivePage) {
      setActivePage('leader-profile');
    } else {
      // Fallback to modal if standalone
      setModalFounder({
        name: leader.name,
        role: leader.role,
        title: leader.title,
        email: leader.email,
        avatar: leader.image,
        bio: leader.shortBio,
        contribution: leader.roleAtCareerBuddies,
        expertise: leader.expertise,
        linkedIn: leader.linkedIn
      });
    }
  };

  return (
    <section id="leadership-section" className="relative overflow-hidden w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-gradient-to-r from-[#002256] via-[#014d59] to-[#006226] text-white">
      {/* Soft Background Brand Ambient Glows */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#79fd8d]/8 rounded-full blur-3xl pointer-events-none -mr-36 -mt-36" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#001947]/25 rounded-full blur-3xl pointer-events-none -ml-36 -mb-36" />

      <div className="relative z-10 max-w-[1280px] mx-auto flex flex-col gap-10 sm:gap-12">
        
        {/* Section Header */}
        <SectionHeading
          eyebrow={LEADERSHIP_SECTION_HEADER.eyebrow}
          title={LEADERSHIP_SECTION_HEADER.headline}
          description={LEADERSHIP_SECTION_HEADER.supportingText}
          badgeIcon={Sparkles}
          badgeColor="blue"
          dark={true}
          align="center"
          size="xl"
        />

        {/* Leadership Philosophy Callout */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#79fd8d]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5 sm:gap-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-[#002869] text-[#79fd8d] flex items-center justify-center shrink-0 shadow-xs">
              <Quote className="w-7 h-7" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-black uppercase text-[#006e29] tracking-wider">
                Our Shared Leadership Principle
              </span>
              <blockquote className="text-base sm:text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif] leading-snug">
                "Career guidance is personal. The right advice at the right moment can influence the direction of an entire career."
              </blockquote>
              <p className="text-xs sm:text-sm text-[#434652] leading-relaxed">
                Built by professionals focused on helping individuals navigate careers, build confidence and make informed professional decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Leaders Grid: 3 columns with equal visual importance, same dimensions and ratio */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {LEADERSHIP_DATA.map((leader) => (
            <div
              key={leader.id}
              className="bg-white rounded-3xl border border-[#cbdaff] hover:border-[#002869]/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between overflow-hidden group h-full"
            >
              <div className="flex flex-col flex-1">
                {/* Large Professional Portrait Image with Standardized 4:4.8 Aspect Ratio */}
                <LeaderPortrait
                  slug={leader.profileSlug}
                  name={leader.name}
                  role={leader.role}
                  title={leader.title}
                  yearsOfExperience={leader.yearsOfExperience}
                  imageSrc={leader.image}
                  aspectRatio="aspect-[4/4.8]"
                  showBadges={true}
                />

                {/* Content Body */}
                <div className="p-6 flex flex-col justify-between flex-1 gap-4">
                  {/* Short Professional Introduction */}
                  <p className="text-xs sm:text-sm text-[#434652] leading-relaxed line-clamp-3">
                    {leader.shortBio}
                  </p>

                  {/* Key Expertise Areas */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#747783]">
                      Key Expertise Areas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {leader.expertise.slice(0, 4).map((exp, expIdx) => (
                        <span
                          key={expIdx}
                          className="px-2.5 py-1 rounded-lg bg-[#f1f3ff] text-[#001947] text-[11px] font-bold border border-[#cbdaff]/70"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* View Full Profile CTA Button */}
                  <button
                    onClick={() => handleViewProfile(leader)}
                    className="w-full py-3 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-xs group-hover:shadow-md"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#79fd8d]" />
                    <span>View Full Profile</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* Card Footer with Direct Connect Links */}
              <div className="px-6 py-3.5 bg-[#f9f9ff] border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={`mailto:${leader.email}`}
                  className="text-xs font-bold text-[#002869] hover:text-[#0b3d91] hover:underline flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#006e29] shrink-0" />
                  <span className="break-all font-mono text-[11px] sm:text-xs">{leader.email}</span>
                </a>

                {leader.linkedIn && (
                  <a
                    href={leader.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-white border border-[#cbdaff] hover:bg-[#002869] hover:text-white text-[#002869] transition-all shadow-2xs shrink-0"
                    title={`Connect with ${leader.name} on LinkedIn`}
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Standalone Leadership Profile Modal if opened */}
      {modalFounder && (
        <LeadershipProfileModal
          founder={modalFounder}
          onClose={() => setModalFounder(null)}
          onOpenCounselling={onOpenCounselling}
          onBackToHome={onBackToHome}
        />
      )}
    </section>
  );
};
