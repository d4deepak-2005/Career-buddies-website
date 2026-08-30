import React, { useState } from 'react';
import { Mentor, BookedSession } from '../../types';
import { 
  X, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Video, 
  User,
  Phone,
  Mail,
  Briefcase,
  Linkedin,
  Lock
} from 'lucide-react';

interface BookingModalProps {
  mentor: Mentor | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (session: BookedSession) => void;
}

const AVAILABLE_DAYS = [
  { label: 'Tomorrow', dateStr: 'Tomorrow, Aug 28', dayName: 'Fri' },
  { label: 'Saturday', dateStr: 'Saturday, Aug 29', dayName: 'Sat' },
  { label: 'Monday', dateStr: 'Monday, Aug 31', dayName: 'Mon' },
  { label: 'Tuesday', dateStr: 'Tuesday, Sep 1', dayName: 'Tue' },
  { label: 'Wednesday', dateStr: 'Wednesday, Sep 2', dayName: 'Wed' }
];

const TIME_SLOTS = [
  '09:00 AM - 09:45 AM',
  '11:30 AM - 12:15 PM',
  '02:00 PM - 02:45 PM',
  '04:30 PM - 05:15 PM',
  '06:30 PM - 07:15 PM'
];

export const BookingModal: React.FC<BookingModalProps> = ({
  mentor,
  isOpen,
  onClose,
  onConfirmBooking
}) => {
  // 6 Mandatory Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [currentDesignation, setCurrentDesignation] = useState('');
  const [totalExperience, setTotalExperience] = useState('');

  // Booking & Optional Fields
  const [selectedDay, setSelectedDay] = useState(AVAILABLE_DAYS[0].dateStr);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[2]);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [alternateNumber, setAlternateNumber] = useState('');
  const [alternateEmail, setAlternateEmail] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdSession, setCreatedSession] = useState<BookedSession | null>(null);

  if (!isOpen || !mentor) return null;

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const validateMobile = (mobileStr: string) => {
    const cleaned = mobileStr.replace(/[^0-9+]/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15;
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    const newErrors: Record<string, string> = {};

    // 1. Mandatory First Name
    if (!firstName.trim()) {
      newErrors.firstName = 'First Name is required.';
    }

    // 2. Mandatory Last Name
    if (!lastName.trim()) {
      newErrors.lastName = 'Last Name is required.';
    }

    // 3. Mandatory Mobile Number
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile Number is required.';
    } else if (!validateMobile(mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number.';
    }

    // 4. Mandatory Email ID
    if (!email.trim()) {
      newErrors.email = 'Email ID is required.';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // 5. Mandatory Current Designation
    if (!currentDesignation.trim()) {
      newErrors.currentDesignation = 'Current Designation is required.';
    }

    // 6. Mandatory Total Work Experience
    if (!totalExperience.trim()) {
      newErrors.totalExperience = 'Total Work Experience is required.';
    }

    // Optional validations
    if (alternateEmail.trim() && !validateEmail(alternateEmail)) {
      newErrors.alternateEmail = 'Please enter a valid email address.';
    }

    if (alternateNumber.trim() && !validateMobile(alternateNumber)) {
      newErrors.alternateNumber = 'Please enter a valid mobile number.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGeneralError('Please fill in all mandatory fields (*) before submitting.');
      return;
    }

    const newSession: BookedSession = {
      id: `sess-${Date.now()}`,
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorTitle: mentor.title,
      mentorAvatar: mentor.avatar,
      date: selectedDay,
      timeSlot: selectedSlot,
      topic: topic || mentor.topics[0] || '1:1 Career Strategy & Leveling',
      notes: notes,
      status: 'confirmed',
      meetLink: `https://meet.google.com/cb-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };

    setCreatedSession(newSession);
    setIsSuccess(true);
    onConfirmBooking(newSession);

    // Also send lead to backend
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        mobile,
        email,
        currentRole: currentDesignation,
        experience: totalExperience,
        alternateNumber: alternateNumber || undefined,
        alternateEmail: alternateEmail || undefined,
        linkedinUrl: linkedinUrl || undefined,
        notes: `Mentor Session: ${mentor.name} (${mentor.title} @ ${mentor.company}) | Slot: ${selectedDay}, ${selectedSlot} | Topic: ${topic || 'General Strategy'} | Notes: ${notes || 'None'}`,
        requirement: `1:1 Session with ${mentor.name}`,
        planInterest: `Mentor Booking - ${mentor.name}`,
        source: 'Booking Modal'
      })
    }).catch(console.error);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setCreatedSession(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#cbdaff] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#002869] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[#dae2ff]" />
            <h3 className="font-bold text-base font-['Plus_Jakarta_Sans',sans-serif]">
              {isSuccess ? 'Session Confirmed!' : `Book Master Session with ${mentor.name}`}
            </h3>
          </div>
          <button 
            onClick={handleReset}
            className="p-1.5 rounded-lg text-[#dae2ff] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess && createdSession ? (
          /* SUCCESS VIEW */
          <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center text-center gap-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-[#79fd8d]/30 text-[#006e29] flex items-center justify-center mb-1">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h4 className="text-xl font-bold text-[#061b3b]">You're Scheduled, {firstName}!</h4>
            <p className="text-xs text-[#434652] max-w-md">
              A calendar invite and preparation agenda have been added to your CareerBuddies dashboard and sent to <strong>{email}</strong>.
            </p>

            {/* Session Card */}
            <div className="w-full bg-[#f9f9ff] border border-[#cbdaff] rounded-2xl p-4 text-left flex flex-col gap-3 my-2">
              <div className="flex items-center gap-3">
                <img 
                  src={mentor.avatar} 
                  alt={mentor.name} 
                  className="w-12 h-12 rounded-xl object-cover border border-white shadow-xs" 
                />
                <div>
                  <h5 className="font-bold text-sm text-[#061b3b]">{mentor.name}</h5>
                  <p className="text-xs text-[#434652]">{mentor.title} @ {mentor.company}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#cbdaff]/60">
                <div>
                  <span className="text-[#747783] block">Date & Time</span>
                  <span className="font-bold text-[#061b3b]">{createdSession.date}</span>
                  <span className="text-[#434652] block">{createdSession.timeSlot}</span>
                </div>
                <div>
                  <span className="text-[#747783] block">Topic</span>
                  <span className="font-bold text-[#002869]">{createdSession.topic}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#cbdaff]/60 flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#cbdaff]/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#002869]">
                  <Video className="w-4 h-4 text-[#006e29]" />
                  <span>Google Meet Video Link</span>
                </div>
                <a 
                  href={createdSession.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#002869] bg-[#dae2ff] px-2.5 py-1 rounded-lg hover:bg-[#cbdaff]"
                >
                  Open Link
                </a>
              </div>
            </div>

            <div className="w-full flex items-center justify-between text-xs text-[#006e29] bg-[#79fd8d]/20 px-3.5 py-2 rounded-xl font-medium">
              <span>✓ 100% Covered by CareerBuddies Satisfaction Guarantee</span>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 bg-[#002869] hover:bg-[#0b3d91] text-white font-bold text-xs rounded-xl shadow-xs transition-all mt-2 cursor-pointer"
            >
              Done & View My Dashboard
            </button>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleBooking} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
            {/* Mentor mini card */}
            <div className="flex items-center gap-3 p-3 bg-[#f9f9ff] rounded-2xl border border-[#cbdaff]">
              <img 
                src={mentor.avatar} 
                alt={mentor.name} 
                className="w-12 h-12 rounded-xl object-cover border border-white shadow-xs" 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-[#061b3b] truncate">{mentor.name}</h4>
                  <span className="px-2 py-0.5 rounded bg-[#dae2ff] text-[#001947] text-[10px] font-bold">
                    {mentor.company}
                  </span>
                </div>
                <p className="text-xs text-[#434652] truncate">{mentor.title}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[#006e29]">${mentor.hourlyRate}</span>
                <span className="text-[10px] text-[#747783] block">45-min session</span>
              </div>
            </div>

            {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">
                {generalError}
              </div>
            )}

            {/* Row 1: First Name * & Last Name * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">
                  First Name <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) setErrors({ ...errors, firstName: '' });
                    }}
                    placeholder="e.g. Rahul"
                    className={`w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] ${
                      errors.firstName ? 'border-red-400 bg-red-50/40' : 'border-[#cbdaff]'
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-[11px] text-red-600 font-bold mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">
                  Last Name <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) setErrors({ ...errors, lastName: '' });
                    }}
                    placeholder="e.g. Sharma"
                    className={`w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] ${
                      errors.lastName ? 'border-red-400 bg-red-50/40' : 'border-[#cbdaff]'
                    }`}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-[11px] text-red-600 font-bold mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Row 2: Mobile Number * & Email ID * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">
                  Mobile Number <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value);
                      if (errors.mobile) setErrors({ ...errors, mobile: '' });
                    }}
                    placeholder="10-digit mobile number"
                    className={`w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] ${
                      errors.mobile ? 'border-red-400 bg-red-50/40' : 'border-[#cbdaff]'
                    }`}
                  />
                </div>
                {errors.mobile && (
                  <p className="text-[11px] text-red-600 font-bold mt-1">{errors.mobile}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">
                  Email ID <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="rahul.sharma@example.com"
                    className={`w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] ${
                      errors.email ? 'border-red-400 bg-red-50/40' : 'border-[#cbdaff]'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-red-600 font-bold mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Row 3: Current Designation * & Total Work Experience * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">
                  Current Designation <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={currentDesignation}
                    onChange={(e) => {
                      setCurrentDesignation(e.target.value);
                      if (errors.currentDesignation) setErrors({ ...errors, currentDesignation: '' });
                    }}
                    placeholder="e.g. Senior Software Engineer"
                    className={`w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] ${
                      errors.currentDesignation ? 'border-red-400 bg-red-50/40' : 'border-[#cbdaff]'
                    }`}
                  />
                </div>
                {errors.currentDesignation && (
                  <p className="text-[11px] text-red-600 font-bold mt-1">{errors.currentDesignation}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">
                  Total Work Experience <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={totalExperience}
                    onChange={(e) => {
                      setTotalExperience(e.target.value);
                      if (errors.totalExperience) setErrors({ ...errors, totalExperience: '' });
                    }}
                    className={`w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] cursor-pointer ${
                      errors.totalExperience ? 'border-red-400 bg-red-50/40' : 'border-[#cbdaff]'
                    }`}
                  >
                    <option value="">Select Total Experience</option>
                    <option value="0-1 Year (Student / Fresher)">0-1 Year (Student / Fresher)</option>
                    <option value="1-3 Years (Junior / Mid)">1-3 Years (Junior / Mid)</option>
                    <option value="3-6 Years (Senior Level)">3-6 Years (Senior Level)</option>
                    <option value="6-10 Years (Lead / Staff Level)">6-10 Years (Lead / Staff Level)</option>
                    <option value="10+ Years (Executive / Principal)">10+ Years (Executive / Principal)</option>
                  </select>
                </div>
                {errors.totalExperience && (
                  <p className="text-[11px] text-red-600 font-bold mt-1">{errors.totalExperience}</p>
                )}
              </div>
            </div>

            {/* Select Day */}
            <div className="pt-2 border-t border-[#cbdaff]/60">
              <label className="block text-xs font-bold text-[#061b3b] mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#002869]" />
                <span>Select Available Date</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_DAYS.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDay(d.dateStr)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedDay === d.dateStr
                        ? 'border-[#002869] bg-[#dae2ff]/40 font-bold text-[#002869] ring-2 ring-[#002869]/20'
                        : 'border-[#cbdaff] hover:bg-[#f9f9ff] text-[#061b3b]'
                    }`}
                  >
                    <span className="text-[10px] text-[#747783] block font-normal">{d.dayName}</span>
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Time Slot */}
            <div>
              <label className="block text-xs font-bold text-[#061b3b] mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#002869]" />
                <span>Select Time Slot (Your Local Timezone)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                      selectedSlot === slot
                        ? 'border-[#002869] bg-[#002869] text-white font-bold'
                        : 'border-[#cbdaff] hover:bg-[#f9f9ff] text-[#061b3b]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Fields */}
            <div className="pt-2 border-t border-[#cbdaff]/70 flex flex-col gap-3.5">
              <span className="text-[11px] font-bold uppercase text-[#747783] tracking-wider">
                Session Focus & Details (Optional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#434652] mb-1">
                    Primary Goal / Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={`e.g. ${mentor.topics[0] || 'System design mock interview'}`}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#434652] mb-1">
                    LinkedIn Profile (Optional)
                  </label>
                  <div className="relative">
                    <Linkedin className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#434652] mb-1">
                  Specific Questions or Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share your resume link, PRD draft, or specific questions for the mentor..."
                  className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869]"
                />
              </div>
            </div>

            {/* Guarantee info */}
            <div className="flex items-start gap-2 bg-[#f1f3ff] p-3 rounded-xl text-[11px] text-[#434652] border border-[#cbdaff]">
              <ShieldCheck className="w-4 h-4 text-[#006e29] shrink-0 mt-0.5" />
              <span>
                <strong>100% Risk-Free Guarantee:</strong> If this session doesn't provide direct actionable clarity, you receive a full refund within 48 hours.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-[#002869] hover:bg-[#0b3d91] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Confirm & Lock In Session (${mentor.hourlyRate})</span>
            </button>

            <p className="text-[10px] text-center text-[#747783]">
              🔒 Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory. Your details are confidential.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

