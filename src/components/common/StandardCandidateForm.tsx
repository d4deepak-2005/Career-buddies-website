import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Clock, 
  Linkedin, 
  MessageSquare, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export interface StandardCandidateFormData {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  currentDesignation: string;
  totalExperience: string;
  alternateNumber?: string;
  alternateEmail?: string;
  linkedinUrl?: string;
  additionalInfo?: string;
}

interface StandardCandidateFormProps {
  initialValues?: Partial<StandardCandidateFormData>;
  submitButtonText?: string;
  submitButtonColor?: 'green' | 'blue';
  contextTag?: string;
  additionalInfoLabel?: string;
  additionalInfoPlaceholder?: string;
  showAlternateFields?: boolean;
  onSubmit: (data: StandardCandidateFormData) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const StandardCandidateForm: React.FC<StandardCandidateFormProps> = ({
  initialValues,
  submitButtonText = 'Submit Details',
  submitButtonColor = 'green',
  contextTag,
  additionalInfoLabel = 'Additional Information',
  additionalInfoPlaceholder = 'Share specific career goals, target companies, or questions...',
  showAlternateFields = true,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  // 6 Mandatory Form Fields
  const [firstName, setFirstName] = useState(initialValues?.firstName || '');
  const [lastName, setLastName] = useState(initialValues?.lastName || '');
  const [mobile, setMobile] = useState(initialValues?.mobile || '');
  const [email, setEmail] = useState(initialValues?.email || '');
  const [currentDesignation, setCurrentDesignation] = useState(initialValues?.currentDesignation || '');
  const [totalExperience, setTotalExperience] = useState(initialValues?.totalExperience || '');
  
  // Optional Fields
  const [alternateNumber, setAlternateNumber] = useState(initialValues?.alternateNumber || '');
  const [alternateEmail, setAlternateEmail] = useState(initialValues?.alternateEmail || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialValues?.linkedinUrl || '');
  const [additionalInfo, setAdditionalInfo] = useState(initialValues?.additionalInfo || '');

  // Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const validateMobile = (val: string) => {
    const cleaned = val.replace(/[\s\-()]/g, '');
    return /^(\+?\d{1,4})?[6-9]\d{9}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    setGeneralError(null);

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

    // Optional validations if provided
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

    setErrors({});
    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobile: mobile.trim(),
      email: email.trim().toLowerCase(),
      currentDesignation: currentDesignation.trim(),
      totalExperience: totalExperience.trim(),
      alternateNumber: alternateNumber.trim() || undefined,
      alternateEmail: alternateEmail.trim() ? alternateEmail.trim().toLowerCase() : undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      additionalInfo: additionalInfo.trim() || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {contextTag && (
        <div className="flex items-center gap-2 p-2.5 bg-[#f1f3ff] rounded-xl border border-[#cbdaff] text-xs font-bold text-[#002869]">
          <ShieldCheck className="w-4 h-4 text-[#006e29] shrink-0" />
          <span>{contextTag}</span>
        </div>
      )}

      {generalError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{generalError}</span>
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
              <option value="0 - 1 Year (Early Career / Fresher)">0 - 1 Year (Early Career / Fresher)</option>
              <option value="1 - 3 Years (Junior / Mid Level)">1 - 3 Years (Junior / Mid Level)</option>
              <option value="3 - 6 Years (Senior Level)">3 - 6 Years (Senior Level)</option>
              <option value="6 - 10 Years (Lead / Staff Level)">6 - 10 Years (Lead / Staff Level)</option>
              <option value="10+ Years (Principal / Director / Executive)">10+ Years (Principal / Director / Executive)</option>
            </select>
          </div>
          {errors.totalExperience && (
            <p className="text-[11px] text-red-600 font-bold mt-1">{errors.totalExperience}</p>
          )}
        </div>
      </div>

      {/* Row 4: Optional Fields */}
      <div className="pt-2 border-t border-[#cbdaff]/70 flex flex-col gap-3.5">
        <span className="text-[11px] font-bold uppercase text-[#747783] tracking-wider">
          Additional Details (Optional)
        </span>

        {showAlternateFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[#434652] mb-1">
                Alternate Number <span className="text-[#747783] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={alternateNumber}
                  onChange={(e) => {
                    setAlternateNumber(e.target.value);
                    if (errors.alternateNumber) setErrors({ ...errors, alternateNumber: '' });
                  }}
                  placeholder="Alternate phone / WhatsApp"
                  className={`w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] ${
                    errors.alternateNumber ? 'border-red-400 bg-red-50/40' : 'border-[#cbdaff]'
                  }`}
                />
              </div>
              {errors.alternateNumber && (
                <p className="text-[11px] text-red-600 font-bold mt-1">{errors.alternateNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#434652] mb-1">
                Alternate Email ID <span className="text-[#747783] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#747783] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={alternateEmail}
                  onChange={(e) => {
                    setAlternateEmail(e.target.value);
                    if (errors.alternateEmail) setErrors({ ...errors, alternateEmail: '' });
                  }}
                  placeholder="personal.email@example.com"
                  className={`w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] ${
                    errors.alternateEmail ? 'border-red-400 bg-red-50/40' : 'border-[#cbdaff]'
                  }`}
                />
              </div>
              {errors.alternateEmail && (
                <p className="text-[11px] text-red-600 font-bold mt-1">{errors.alternateEmail}</p>
              )}
            </div>
          </div>
        )}

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

        <div>
          <label className="block text-xs font-medium text-[#434652] mb-1">
            {additionalInfoLabel} <span className="text-[#747783] font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-[#747783] absolute left-3 top-3" />
            <textarea
              rows={2}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder={additionalInfoPlaceholder}
              className="w-full pl-9 pr-3 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869]"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#cbdaff] text-[#434652] hover:bg-[#f1f3ff] text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-3 rounded-xl text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
            submitButtonColor === 'green'
              ? 'bg-[#006e29] hover:bg-[#00531d]'
              : 'bg-[#002869] hover:bg-[#0b3d91]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span>{submitButtonText}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <p className="text-[10px] text-center text-[#747783]">
        🔒 Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory. Your information is strictly confidential.
      </p>
    </form>
  );
};

export default StandardCandidateForm;

