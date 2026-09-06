import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, MessageSquare } from 'lucide-react';
import { OFFICE_DETAILS } from '../../data/mockData';
import { StandardCandidateForm, StandardCandidateFormData } from '../common/StandardCandidateForm';

interface CounsellingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: string;
  initialService?: string;
  /** When set to 'explore' or 'elevate', a successful submission redirects straight to the fixed-price Dodo Payments checkout instead of showing the "thank you" screen. */
  checkoutPlanId?: 'explore' | 'elevate' | null;
  onSuccess?: () => void;
  onLeadSubmitted?: () => void;
}

export const CounsellingModal: React.FC<CounsellingModalProps> = ({
  isOpen,
  onClose,
  initialPlan,
  initialService,
  checkoutPlanId,
  onSuccess,
  onLeadSubmitted
}) => {
  const [submittedName, setSubmittedName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false);
      setSubmittedName('');
      setCheckoutError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: StandardCandidateFormData) => {
    setLoading(true);
    setCheckoutError(null);
    let leadId: string | undefined;

    try {
      const response = await fetch('/api/leads', {
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
          notes: data.additionalInfo || undefined,
          requirement: initialService ? `Service: ${initialService}` : '1:1 Career Counseling & Plan Diagnosis',
          planInterest: initialPlan || 'General Counselling',
          source: initialPlan ? 'Plan Enquiry' : 'Counselling Modal'
        })
      });
      const leadResult = await response.json().catch(() => null);
      leadId = leadResult?.lead?.id;
    } catch (err) {
      console.error('Lead submission error:', err);
    }

    // Explore / Elevate are fixed-price paid plans: send the candidate straight
    // to the Dodo Payments checkout instead of the "we'll reach out" screen.
    if (checkoutPlanId) {
      try {
        const checkoutRes = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: checkoutPlanId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            mobile: data.mobile,
            leadId
          })
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutRes.ok && checkoutData.success && checkoutData.checkoutUrl) {
          if (onSuccess) onSuccess();
          if (onLeadSubmitted) onLeadSubmitted();
          window.location.href = checkoutData.checkoutUrl;
          return;
        }
        setCheckoutError(
          checkoutData.error || "We couldn't open the payment page automatically. Our team will reach out to complete your enrollment."
        );
      } catch (err) {
        console.error('Checkout redirect error:', err);
        setCheckoutError("We couldn't open the payment page automatically. Our team will reach out to complete your enrollment.");
      }
    }

    setSubmittedName(data.firstName);
    setIsSuccess(true);
    if (onSuccess) onSuccess();
    if (onLeadSubmitted) onLeadSubmitted();
    setLoading(false);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#cbdaff] flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#002869] text-white p-6 relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#79fd8d] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#dae2ff]">
                Free 1:1 Career Counselling
              </span>
            </div>
            <h3 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Book Free Career Counselling
            </h3>
            <p className="text-xs text-[#d7e2ff] mt-0.5">
              Speak with a senior advisor to evaluate your profile & select the right career plan.
            </p>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          {isSuccess ? (
            <div className="py-8 px-4 text-center flex flex-col items-center gap-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-[#79fd8d]/20 text-[#006e29] flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h4 className="text-xl font-bold text-[#061b3b]">
                Thank you, {submittedName}!
              </h4>

              <p className="text-sm text-[#434652] max-w-md leading-relaxed">
                We have received your details successfully. Our senior career team will review your profile and reach out on WhatsApp/Email within <strong>2 business hours</strong> to schedule your free 1:1 counselling session.
              </p>

              {checkoutError && (
                <div className="w-full p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl text-left">
                  {checkoutError}
                </div>
              )}

              <div className="bg-[#f1f3ff] p-4 rounded-2xl border border-[#cbdaff] w-full text-left mt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#002869] mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#006e29]" />
                  <span>Immediate Assistance Available</span>
                </div>
                <p className="text-xs text-[#434652]">
                  Need an urgent answer or wish to connect with an advisor immediately? You can also message our counselling desk directly on WhatsApp.
                </p>
                <a
                  href={OFFICE_DETAILS.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp (+91 9310288270)</span>
                </a>
              </div>

              <button
                onClick={handleResetAndClose}
                className="mt-4 px-6 py-2.5 bg-[#002869] text-white font-semibold text-xs rounded-xl hover:bg-[#0b3d91] transition-colors cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <StandardCandidateForm
              submitButtonText={initialPlan ? `Apply for ${initialPlan}` : 'Request Free Counselling Call'}
              submitButtonColor="green"
              contextTag={initialPlan ? `Plan Interested: ${initialPlan}` : undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleResetAndClose}
              isLoading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CounsellingModal;
