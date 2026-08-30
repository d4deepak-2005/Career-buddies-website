import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Sparkles, Send, User, Phone, Mail, Briefcase, Clock, Linkedin } from 'lucide-react';

interface BecomeMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BecomeMentorModal: React.FC<BecomeMentorModalProps> = ({
  isOpen,
  onClose
}) => {
  // 6 Mandatory Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [currentDesignation, setCurrentDesignation] = useState('');
  const [totalExperience, setTotalExperience] = useState('');

  // Optional Fields
  const [currentCompany, setCurrentCompany] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [hourlyRate, setHourlyRate] = useState('80');
  const [motivation, setMotivation] = useState('');
  const [alternateNumber, setAlternateNumber] = useState('');
  const [alternateEmail, setAlternateEmail] = useState('');

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const validateMobile = (mobileStr: string) => {
    const cleaned = mobileStr.replace(/[^0-9+]/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);
    try {
      await fetch('/api/leads', {
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
          notes: `Mentor Application | Company: ${currentCompany || 'N/A'} | Track: ${category} | Rate: $${hourlyRate}/hr | Philosophy: ${motivation || 'N/A'}`,
          requirement: `Mentor Application - ${category}`,
          planInterest: 'Mentor Onboarding',
          source: 'Become a Mentor Modal'
        })
      });
    } catch (err) {
      console.error('Error submitting mentor application:', err);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#cbdaff] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#002869] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#79fd8d]" />
            <h3 className="font-bold text-base font-['Plus_Jakarta_Sans',sans-serif]">Apply to Become a CareerBuddies Mentor</h3>
          </div>
          <button 
            onClick={handleReset}
            className="p-1.5 rounded-lg text-[#dae2ff] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#79fd8d]/30 text-[#006e29] flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-[#061b3b]">Application Received!</h4>
            <p className="text-xs text-[#434652] max-w-md leading-relaxed">
              Thank you for applying to mentor with CareerBuddies, <strong>{firstName} {lastName}</strong>. Our mentor onboarding committee will review your profile within 48 hours and reach out to <strong>{email}</strong>.
            </p>
            <button
              onClick={handleReset}
              className="mt-2 px-6 py-2.5 bg-[#002869] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#0b3d91] transition-colors"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
            <p className="text-xs text-[#434652]">
              Join an elite network of senior practitioners from Google, Amazon, Uber, and Microsoft. Please fill out your details below.
            </p>

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
                    placeholder="e.g. Maya"
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
                    placeholder="e.g. Lin"
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
                    placeholder="maya@google.com"
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
                    placeholder="e.g. Staff Software Engineer"
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
                    <option value="">Select Experience Range</option>
                    <option value="3-5 Years (Mid-Senior)">3-5 Years (Mid-Senior)</option>
                    <option value="5-8 Years (Senior Practitioner)">5-8 Years (Senior Practitioner)</option>
                    <option value="8-12 Years (Lead / Staff / Principal)">8-12 Years (Lead / Staff / Principal)</option>
                    <option value="12+ Years (Engineering / Product Director)">12+ Years (Engineering / Product Director)</option>
                    <option value="15+ Years (VP / CXO Level)">15+ Years (VP / CXO Level)</option>
                  </select>
                </div>
                {errors.totalExperience && (
                  <p className="text-[11px] text-red-600 font-bold mt-1">{errors.totalExperience}</p>
                )}
              </div>
            </div>

            {/* Optional Mentor Details */}
            <div className="pt-2 border-t border-[#cbdaff]/70 flex flex-col gap-3.5">
              <span className="text-[11px] font-bold uppercase text-[#747783] tracking-wider">
                Additional Mentor Details (Optional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#434652] mb-1">
                    Current Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="e.g. Stripe, Google, Meta"
                    className="w-full px-3 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869]"
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
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#434652] mb-1">
                    Primary Track (Optional)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] cursor-pointer"
                  >
                    <option value="Engineering">Engineering (SWE / Infra / Arch)</option>
                    <option value="Product">Product Management</option>
                    <option value="Design">Product & UX Design</option>
                    <option value="Data & AI">Data & Applied AI</option>
                    <option value="Leadership">Engineering & Exec Leadership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#434652] mb-1">
                    Target Session Rate ($ / 45 min) (Optional)
                  </label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="80"
                    className="w-full px-3 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#434652] mb-1">
                  Coaching Philosophy or Bio (Optional)
                </label>
                <textarea
                  rows={2}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Tell us about how you guide and unblock other professionals..."
                  className="w-full px-3 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#002869] hover:bg-[#0b3d91] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting Application...' : 'Submit Mentor Application'}</span>
            </button>

            <p className="text-[10px] text-center text-[#747783]">
              🔒 Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory. Your details are strictly confidential.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

