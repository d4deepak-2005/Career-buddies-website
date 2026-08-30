import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  Mail, 
  Linkedin, 
  ChevronRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { PageView } from '../../types';
import { LEADERSHIP_PROFILES, LEADERSHIP_PHILOSOPHY } from '../../config/leadership';
import { PageHeaderControls } from '../common/PageHeaderControls';
import { PageBottomNav } from '../common/PageBottomNav';

interface LeadershipScreenProps {
  onNavigate: (page: PageView) => void;
  onOpenCounselling: () => void;
}

export const LeadershipScreen: React.FC<LeadershipScreenProps> = ({
  onNavigate,
  onOpenCounselling
}) => {
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);

  const activeLeader = LEADERSHIP_PROFILES.find(l => l.id === selectedLeaderId);

  return (
    <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation Controls: Top Left Back & Top Right Home */}
        <PageHeaderControls
          currentPage="leadership"
          onNavigate={onNavigate}
          titleOverride="Leadership & Mentors"
        />

        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dae2ff] border border-[#cbdaff] text-xs font-black text-[#002869] mb-3">
            <Users className="w-3.5 h-3.5 text-[#006e29]" />
            <span>Meet Our Leadership Team</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#061b3b] tracking-tight">
            Practitioner-Led Career Guidance
          </h1>
          <p className="text-sm sm:text-base text-[#434652] mt-3">
            Founded and directed by industry practitioners passionate about democratizing strategic career mentorship, leveling clarity, and personalized growth roadmaps.
          </p>
        </div>

        {/* Leadership Cards Grid (Founder & Co-Founders) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
          {LEADERSHIP_PROFILES.map((leader) => (
            <div
              key={leader.id}
              className="bg-[#f9f9ff] rounded-3xl border border-[#cbdaff] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
            >
              <div>
                {/* Real Photograph Container with object-position: center top */}
                <div className="relative w-full aspect-[4/5] bg-[#e8edff] overflow-hidden">
                  <img
                    src={leader.avatar}
                    alt={`${leader.name} - ${leader.role}`}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-[#002869]/90 backdrop-blur-md text-white text-xs font-black tracking-wider uppercase shadow-xs">
                      {leader.role}
                    </span>
                  </div>
                </div>

                {/* Leader Info Content */}
                <div className="p-6">
                  <h2 className="text-xl font-black text-[#061b3b] group-hover:text-[#002869] transition-colors">
                    {leader.name}
                  </h2>
                  <div className="text-xs font-bold text-[#006e29] mt-0.5">
                    {leader.title}
                  </div>
                  <p className="text-xs text-[#434652] mt-3 font-medium leading-relaxed">
                    {leader.bio}
                  </p>

                    {/* Founder Email & Expertise Tags */}
                    <div className="mt-4 pt-4 border-t border-[#cbdaff]/70 flex flex-col gap-2.5">
                      <a
                        href={`mailto:${leader.email}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002869] hover:text-[#0b3d91] hover:underline"
                        title={`Email ${leader.name}`}
                      >
                        <Mail className="w-3.5 h-3.5 text-[#006e29] shrink-0" />
                        <span className="font-mono text-[11px] sm:text-xs break-all">{leader.email}</span>
                      </a>

                      <div>
                        <div className="text-[11px] font-black uppercase text-[#002869] tracking-wider mb-1.5">
                          Core Focus & Mentorship
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {leader.expertise.slice(0, 3).map((exp, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#cbdaff] text-[11px] font-bold text-[#002869]"
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 flex items-center gap-2">
                <button
                  onClick={() => setSelectedLeaderId(leader.id)}
                  className="flex-1 py-2.5 bg-white hover:bg-[#dae2ff] text-[#002869] font-bold text-xs rounded-xl border border-[#cbdaff] transition-all cursor-pointer text-center"
                >
                  View Profile & Highlights
                </button>
                <button
                  onClick={onOpenCounselling}
                  className="px-3.5 py-2.5 bg-[#002869] hover:bg-[#0b3d91] text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  title="Request Strategic Counseling with Leadership Team"
                >
                  <Sparkles className="w-4 h-4 text-[#79fd8d]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Leader Modal Details */}
        {activeLeader && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#cbdaff] max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
              <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <img
                    src={activeLeader.avatar}
                    alt={activeLeader.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover object-top border-2 border-[#002869]"
                  />
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#dae2ff] text-[#002869] text-[10px] font-black uppercase tracking-wider">
                      {activeLeader.role}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#061b3b] mt-1">
                      {activeLeader.name}
                    </h3>
                    <div className="text-xs text-[#006e29] font-bold">{activeLeader.title}</div>
                    <a
                      href={`mailto:${activeLeader.email}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002869] hover:underline mt-1"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#006e29]" />
                      <span className="font-mono text-xs">{activeLeader.email}</span>
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLeaderId(null)}
                  className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="py-6 space-y-5">
                <div>
                  <div className="text-xs font-black uppercase text-[#002869] tracking-wider mb-1.5">
                    Strategic Contribution
                  </div>
                  <p className="text-xs sm:text-sm text-[#434652] font-medium leading-relaxed">
                    {activeLeader.contribution}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-black uppercase text-[#002869] tracking-wider mb-2">
                    Key Career Highlights & Track Record
                  </div>
                  <ul className="space-y-2">
                    {activeLeader.careerHighlights.map((hl, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#434652] font-medium leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-xs font-black uppercase text-[#002869] tracking-wider mb-2">
                    Areas of 1:1 Guidance
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeLeader.areasOfGuidance.map((area, i) => (
                      <span key={i} className="px-3 py-1 bg-[#f1f3ff] rounded-lg text-xs font-bold text-[#002869] border border-[#cbdaff]">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedLeaderId(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#cbdaff] text-xs font-bold text-[#434652] hover:bg-[#f1f3ff]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedLeaderId(null);
                    onOpenCounselling();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-black flex items-center gap-2 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#79fd8d]" />
                  <span>Book Free 1:1 Counselling</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leadership Philosophy Block */}
        <div className="bg-[#f9f9ff] rounded-3xl border border-[#cbdaff] p-8 sm:p-10 mb-12">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <div className="text-xs font-black uppercase text-[#006e29] tracking-wider mb-2">
              Our Guiding Philosophy
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#061b3b] tracking-tight">
              "{LEADERSHIP_PHILOSOPHY.quote}"
            </h2>
            <p className="text-sm text-[#434652] mt-3">
              {LEADERSHIP_PHILOSOPHY.subtext}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LEADERSHIP_PHILOSOPHY.principles.map((p, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-[#cbdaff]">
                <div className="w-8 h-8 rounded-xl bg-[#dae2ff] text-[#002869] flex items-center justify-center font-black text-xs mb-3">
                  0{i + 1}
                </div>
                <div className="text-sm font-black text-[#061b3b] mb-1.5">{p.title}</div>
                <div className="text-xs text-[#434652] font-medium leading-relaxed">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Page Navigation (Previous / Next) */}
        <PageBottomNav
          currentPage="leadership"
          onNavigate={onNavigate}
        />

      </div>
    </div>
  );
};

export default LeadershipScreen;
