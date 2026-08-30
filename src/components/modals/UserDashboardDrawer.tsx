import React from 'react';
import { BookedSession, Mentor } from '../../types';
import { MOCK_MENTORS } from '../../data/mockData';
import { 
  X, 
  Calendar, 
  Video, 
  Clock, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Bookmark, 
  Target,
  User,
  ArrowRight
} from 'lucide-react';

interface UserDashboardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: BookedSession[];
  onCancelSession: (id: string) => void;
  onSelectMentor: (mentor: Mentor) => void;
  onStartMatching: () => void;
  onOpenFullDashboard?: () => void;
}

export const UserDashboardDrawer: React.FC<UserDashboardDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  onCancelSession,
  onSelectMentor,
  onStartMatching,
  onOpenFullDashboard
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-[#e0e8ff] animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#002869] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Candidate Dashboard</h3>
              <span className="text-xs text-[#dae2ff]">Enrolled Candidate • Active</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#dae2ff] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action to open Full Dashboard */}
        {onOpenFullDashboard && (
          <div className="p-4 bg-[#f1f3ff] border-b border-[#cbdaff] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#006e29]" />
              <span className="text-xs font-bold text-[#061b3b]">Full Candidate Portal</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenFullDashboard();
              }}
              className="px-3 py-1.5 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          
          {/* Active Career Goal Milestone Card */}
          <div className="bg-[#f1f3ff] rounded-2xl p-4 border border-[#cbdaff] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#002869] flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#006e29]" />
                90-Day Career Milestone
              </span>
              <span className="text-[11px] font-bold text-[#006e29] bg-[#79fd8d]/30 px-2 py-0.5 rounded-full">
                60% Progress
              </span>
            </div>
            <p className="text-xs font-semibold text-[#061b3b]">
              Promotion to Staff SWE / Level L6
            </p>
            <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#cbdaff]/60">
              <div className="bg-[#002869] h-full w-3/5 rounded-full" />
            </div>
            <div className="flex flex-col gap-1.5 pt-1 text-[11px] text-[#434652]">
              <span className="flex items-center gap-1.5 text-[#006e29] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Baseline leveling rubric diagnosed
              </span>
              <span className="flex items-center gap-1.5 text-[#006e29] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> System design mock completed
              </span>
              <span className="flex items-center gap-1.5 text-[#747783]">
                ○ Final executive promo packet alignment
              </span>
            </div>
          </div>

          {/* Booked Sessions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-[#061b3b] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#002869]" />
                Upcoming 1:1 Counseling & Master Sessions ({sessions.length})
              </h4>
            </div>

            {sessions.length === 0 ? (
              <div className="p-6 bg-[#f9f9ff] border border-[#e0e8ff] rounded-xl text-center flex flex-col items-center gap-2">
                <Calendar className="w-8 h-8 text-[#747783] opacity-60" />
                <p className="text-xs font-bold text-[#061b3b]">No sessions scheduled yet</p>
                <p className="text-[11px] text-[#434652] max-w-xs">
                  Schedule a 1:1 counseling or master session to receive tailored review on your career trajectory.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onStartMatching();
                  }}
                  className="mt-2 px-4 py-2 bg-[#002869] text-white text-xs font-bold rounded-lg hover:bg-[#0b3d91] cursor-pointer"
                >
                  Explore Industry Leaders
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sessions.map((sess) => (
                  <div 
                    key={sess.id}
                    className="p-4 bg-white border border-[#cbdaff] rounded-xl shadow-2xs flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={sess.mentorAvatar} 
                          alt={sess.mentorName} 
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100" 
                        />
                        <div>
                          <h5 className="font-bold text-xs text-[#061b3b]">{sess.mentorName}</h5>
                          <p className="text-[11px] text-[#434652]">{sess.mentorTitle}</p>
                        </div>
                      </div>
                      <span className="bg-[#79fd8d]/30 text-[#00531d] text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Confirmed
                      </span>
                    </div>

                    <div className="bg-[#f9f9ff] p-2.5 rounded-lg text-xs flex flex-col gap-1 border border-[#e0e8ff]">
                      <div className="flex items-center justify-between text-[#061b3b] font-semibold">
                        <span>{sess.date}</span>
                        <span className="text-[#002869]">{sess.timeSlot}</span>
                      </div>
                      <p className="text-[11px] text-[#747783] truncate">Topic: {sess.topic}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={sess.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#002869] hover:bg-[#0b3d91] px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Video className="w-3.5 h-3.5 text-[#79fd8d]" />
                        <span>Join Call</span>
                      </a>

                      <button
                        onClick={() => onCancelSession(sess.id)}
                        className="p-1.5 text-gray-400 hover:text-[#ba1a1a] rounded transition-colors"
                        title="Cancel Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Recommended Mentors */}
          <div>
            <h4 className="font-bold text-sm text-[#061b3b] mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#006e29]" />
              Recommended for You
            </h4>
            <div className="flex flex-col gap-2.5">
              {MOCK_MENTORS.slice(0, 2).map((mentor) => (
                <div 
                  key={mentor.id}
                  onClick={() => {
                    onClose();
                    onSelectMentor(mentor);
                  }}
                  className="p-3 bg-[#f9f9ff] hover:bg-[#f1f3ff] border border-[#e0e8ff] rounded-xl flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={mentor.avatar} 
                      alt={mentor.name} 
                      className="w-10 h-10 rounded-lg object-cover" 
                    />
                    <div>
                      <h5 className="font-bold text-xs text-[#061b3b]">{mentor.name}</h5>
                      <p className="text-[10px] text-[#434652]">{mentor.title} @ {mentor.company}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#002869]" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f9f9ff] border-t border-[#e0e8ff] text-center">
          <button
            onClick={() => {
              onClose();
              onStartMatching();
            }}
            className="w-full py-2.5 bg-[#002869] text-white text-xs font-bold rounded-xl hover:bg-[#0b3d91] cursor-pointer"
          >
            Launch Smart Matchmaker
          </button>
        </div>

      </div>
    </div>
  );
};
