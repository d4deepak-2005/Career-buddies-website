import React from 'react';
import { Mentor } from '../../types';
import { 
  X, 
  Star, 
  ShieldCheck, 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  Award, 
  MessageSquare,
  Clock,
  Sparkles,
  Building
} from 'lucide-react';

interface MentorProfileModalProps {
  mentor: Mentor | null;
  isOpen: boolean;
  onClose: () => void;
  onBookCall: (mentor: Mentor) => void;
}

export const MentorProfileModal: React.FC<MentorProfileModalProps> = ({
  mentor,
  isOpen,
  onClose,
  onBookCall
}) => {
  if (!isOpen || !mentor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#e0e8ff] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#002869] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#79fd8d]" />
            <h3 className="font-bold text-base">Verified Mentor Profile</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#dae2ff] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Top Profile Summary */}
          <div className="flex flex-col sm:flex-row items-start gap-5 pb-6 border-b border-[#e0e8ff]">
            <img 
              src={mentor.avatar} 
              alt={mentor.name} 
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-[#061b3b]">{mentor.name}</h2>
                {mentor.verified && (
                  <span className="inline-flex items-center gap-1 bg-[#79fd8d]/30 text-[#00531d] text-[11px] px-2 py-0.5 rounded-full font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
                {mentor.superMentor && (
                  <span className="inline-flex items-center gap-1 bg-[#dae2ff] text-[#001947] text-[11px] px-2 py-0.5 rounded-full font-bold">
                    <Sparkles className="w-3 h-3 text-[#002869]" />
                    Top Rated
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-[#002869] mt-0.5">
                {mentor.title} @ {mentor.company}
              </p>

              <div className="flex items-center gap-4 mt-2 text-xs text-[#434652] flex-wrap">
                <span className="flex items-center gap-1 font-bold text-[#061b3b]">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {mentor.rating} ({mentor.reviewCount} reviews)
                </span>
                <span>• {mentor.sessionsCompleted} sessions completed</span>
                <span>• {mentor.experienceYears} years total experience</span>
              </div>
            </div>
          </div>

          {/* About & Bio */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#002869] mb-2">
              About & Mentoring Approach
            </h4>
            <p className="text-xs sm:text-sm text-[#434652] leading-relaxed">
              {mentor.longBio}
            </p>
          </div>

          {/* Mentorship Focus Areas */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#002869] mb-2.5">
              Mentorship Focus Topics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mentor.topics.map((t, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-2 p-2.5 bg-[#f9f9ff] border border-[#e0e8ff] rounded-lg text-xs font-medium text-[#061b3b]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Past Companies & Background */}
          {mentor.pastCompanies && mentor.pastCompanies.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#002869] mb-2">
                Previous Experience
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {mentor.pastCompanies.map((c, idx) => (
                  <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-[#f1f3ff] text-[#001947] text-xs font-bold rounded-lg border border-[#cbdaff]/70">
                    <Building className="w-3 h-3 text-[#002869]" />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Reviews */}
          {mentor.reviews && mentor.reviews.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#002869] mb-3">
                Mentee Reviews ({mentor.reviews.length})
              </h4>
              <div className="flex flex-col gap-3">
                {mentor.reviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 bg-[#f9f9ff] border border-[#e0e8ff] rounded-xl text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#061b3b]">{rev.author}</span>
                      <span className="text-[10px] text-[#747783]">{rev.date}</span>
                    </div>
                    <p className="text-[11px] text-[#747783] mb-1.5">{rev.role}</p>
                    <p className="text-xs text-[#434652] leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 bg-[#f9f9ff] border-t border-[#e0e8ff] flex items-center justify-between gap-4">
          <div>
            <span className="text-base font-bold text-[#006e29]">
              ${mentor.hourlyRate}
            </span>
            <span className="text-xs text-[#747783]"> / 45-min session</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#434652] hover:text-[#061b3b]"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBookCall(mentor);
              }}
              className="px-6 py-2.5 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            >
              Book 1:1 Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
