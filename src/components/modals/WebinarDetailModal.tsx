import React from 'react';
import { WebinarItem } from '../../types';
import { DEFAULT_SITE_CONFIG } from '../../config/siteConfig';
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  GraduationCap, 
  Video, 
  Award, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck,
  Home
} from 'lucide-react';
import { HandshakeIcon } from '../common/HandshakeIcon';

interface WebinarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  webinar: WebinarItem | null;
  onRegister: (webinar: WebinarItem) => void;
  onBackToHome?: () => void;
}

export const WebinarDetailModal: React.FC<WebinarDetailModalProps> = ({
  isOpen,
  onClose,
  webinar,
  onRegister,
  onBackToHome
}) => {
  if (!isOpen || !webinar) return null;

  const price = webinar.priceINR || DEFAULT_SITE_CONFIG.webinarDefaultPriceINR;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061b3b]/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-[#cbdaff] shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        
        {/* Navigation & Header Bar */}
        <div className="bg-[#002869] text-white p-6 sm:p-7 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#79fd8d]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col gap-3">
            {/* Top Action Nav Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {onBackToHome && (
                  <button
                    onClick={() => {
                      onClose();
                      onBackToHome();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>← Home</span>
                  </button>
                )}
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-[#79fd8d] border border-white/15">
                  {webinar.category}
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans',sans-serif] leading-snug text-white">
              {webinar.title}
            </h2>

            <p className="text-xs sm:text-sm text-[#dae2ff] leading-relaxed">
              {webinar.tagline}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-white">
              <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-[#79fd8d]" />
                <span className="font-semibold">{webinar.date}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-[#79fd8d]" />
                <span>{webinar.time} ({webinar.duration})</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#79fd8d]/25 text-[#79fd8d] px-3 py-1.5 rounded-xl font-bold border border-[#79fd8d]/30">
                <span>Pass: ₹{price}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex flex-col gap-6">
          
          {/* Speaker Card */}
          <div className="p-5 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff] flex items-center gap-4">
            <img
              src={webinar.speaker.avatar}
              alt={webinar.speaker.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#002869]/20 shadow-xs shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#747783] tracking-wider">
                Featured Masterclass Speaker
              </span>
              <h4 className="font-bold text-base text-[#061b3b]">
                {webinar.speaker.name}
              </h4>
              <span className="text-xs font-bold text-[#006e29]">
                {webinar.speaker.role} • {webinar.speaker.company}
              </span>
              <p className="text-xs text-[#434652] mt-1 leading-relaxed">
                {webinar.speaker.bio}
              </p>
            </div>
          </div>

          {/* Key Learnings & Takeaways */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#002869]">
              What You Will Master in this 90-Min Session:
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {(webinar.whatYouWillLearn || []).map((takeaway, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#061b3b] bg-[#f9f9ff] p-3 rounded-xl border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{takeaway}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          {webinar.targetAudience && webinar.targetAudience.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#002869]">
                Who This Masterclass is Ideal For:
              </h4>
              <div className="flex flex-wrap gap-2">
                {webinar.targetAudience.map((aud, aIdx) => (
                  <span key={aIdx} className="text-xs text-[#001947] bg-[#dae2ff]/50 px-3 py-1.5 rounded-xl border border-[#cbdaff] font-medium">
                    {aud}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What's Included in Pass */}
          <div className="p-4 rounded-2xl bg-[#f1f3ff] border border-[#cbdaff] flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#002869] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#006e29]" />
              <span>Standard Pass Includes (₹{price}):</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#061b3b]">
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#006e29]" />
                Live interactive Google Meet session
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#006e29]" />
                Live Q&A with {webinar.speaker.name}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#006e29]" />
                Full HD Recording & Slides
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#006e29]" />
                Certificate of Attendance
              </span>
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions with Back & Next navigation */}
        <div className="p-5 bg-[#f1f3ff] border-t border-[#cbdaff] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-bold text-[#434652] hover:text-[#061b3b] cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Masterclasses</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onRegister(webinar);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-[#002869] hover:bg-[#0b3d91] text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Register for ₹{price}</span>
            <ArrowRight className="w-4 h-4 text-[#79fd8d]" />
          </button>
        </div>

      </div>
    </div>
  );
};
