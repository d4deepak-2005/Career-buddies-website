import React, { useState } from 'react';
import { MOCK_FAQS, OFFICE_DETAILS } from '../../data/mockData';
import { FAQItem, PageView } from '../../types';
import { 
  Mail, 
  MapPin, 
  MessageSquare, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Send, 
  HelpCircle, 
  PhoneCall, 
  Phone, 
  ShieldCheck 
} from 'lucide-react';
import { PageNavigationControls } from '../common/PageNavigationControls';
import { StandardCandidateForm, StandardCandidateFormData } from '../common/StandardCandidateForm';

interface ContactScreenProps {
  onLeadSubmitted?: () => void;
  setActivePage?: (page: PageView) => void;
}

export const ContactScreen: React.FC<ContactScreenProps> = ({ 
  onLeadSubmitted,
  setActivePage
}) => {
  const [openFaq, setOpenFaq] = useState<string | null>('faq1');
  const [faqCategory, setFaqCategory] = useState<string>('all');
  
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleFormSubmit = async (data: StandardCandidateFormData) => {
    setLoading(true);

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          mobile: data.mobile,
          currentRole: data.currentDesignation,
          experience: data.totalExperience,
          alternateNumber: data.alternateNumber,
          alternateEmail: data.alternateEmail,
          linkedinUrl: data.linkedinUrl,
          notes: data.additionalInfo,
          serviceInterested: 'Contact Us Inquiry',
          source: 'Contact Us Screen'
        })
      });

      setSubmittedName(`${data.firstName} ${data.lastName}`);
      setSubmittedEmail(data.email);
      setFormSubmitted(true);
      if (onLeadSubmitted) onLeadSubmitted();
    } catch (err) {
      console.error('Contact submission error:', err);
      setSubmittedName(`${data.firstName} ${data.lastName}`);
      setSubmittedEmail(data.email);
      setFormSubmitted(true);
      if (onLeadSubmitted) onLeadSubmitted();
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = MOCK_FAQS.filter(faq => 
    faqCategory === 'all' || faq.category === faqCategory
  );

  return (
    <div className="w-full bg-[#f9f9ff] py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-12">
        
        {/* Universal Navigation Controls */}
        <PageNavigationControls
          onBackToHome={() => {
            if (setActivePage) {
              setActivePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onBack={() => {
            if (setActivePage) {
              setActivePage('resources');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onNext={() => {
            if (setActivePage) {
              setActivePage('about-us');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          backLabel="Playbooks"
          nextLabel="About Us"
          currentStepLabel="Contact & Support Desk"
        />

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-black uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5 text-[#002869]" />
            <span>WE'RE HERE TO HELP</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight leading-tight">
            Get in Touch with CareerBuddies
          </h1>
          <p className="text-sm sm:text-base text-[#434652] leading-relaxed font-medium">
            Have questions about finding a mentor, employer sponsorships, or applying to become a verified mentor? Our team responds within 2 business hours.
          </p>
        </div>

        {/* Contact Grid: Form + Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-[#cbdaff] shadow-xs">
            <h2 className="text-xl font-black text-[#061b3b] mb-1 font-['Plus_Jakarta_Sans',sans-serif]">Send a Message</h2>
            <p className="text-xs text-[#434652] mb-6 font-medium">Fill in the details below and our Bengaluru advisory team will reach out promptly.</p>

            {formSubmitted ? (
              <div className="p-6 bg-[#f1f3ff] border border-[#79fd8d] rounded-2xl flex items-start gap-4 animate-in fade-in">
                <CheckCircle2 className="w-6 h-6 text-[#006e29] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-black text-sm text-[#061b3b]">Message Sent Successfully!</h3>
                  <p className="text-xs text-[#434652] mt-1 leading-relaxed">
                    Thank you, <strong>{submittedName}</strong>. A CareerBuddies concierge has received your request and will reach out to <strong>{submittedEmail}</strong> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setSubmittedName('');
                      setSubmittedEmail('');
                    }}
                    className="mt-4 text-xs font-black text-[#002869] hover:underline cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <StandardCandidateForm
                submitButtonText="Send Message / Submit Inquiry"
                submitButtonColor="blue"
                contextTag="contact"
                onSubmit={handleFormSubmit}
                isLoading={loading}
              />
            )}
          </div>

          {/* Right Info Cards (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Registered Office Details */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#cbdaff] shadow-xs flex flex-col gap-4">
              <h3 className="font-black text-base text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">Contact Channels & Office</h3>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#dae2ff] text-[#002869] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#061b3b] block">Registered Office</span>
                  <p className="text-xs text-[#434652] leading-relaxed mt-0.5 font-medium">
                    {OFFICE_DETAILS.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#79fd8d]/30 text-[#00531d] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-[#006e29]" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#061b3b] block">WhatsApp Support Desk</span>
                  <a href={OFFICE_DETAILS.whatsappLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#006e29] hover:underline font-bold">
                    +91 9310288270 / +91 8890790077
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#dae2ff] text-[#002869] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#061b3b] block">Email Enquiries</span>
                  <a href="mailto:support@careerbuddies.in" className="text-xs text-[#002869] hover:underline font-bold block">
                    support@careerbuddies.in
                  </a>
                  <span className="text-[11px] text-[#555966] font-medium block mt-0.5">
                    For student support, corporate sales, programmes, and business enquiries.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f1f3ff] text-[#002869] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#061b3b] block">Response Commitment</span>
                  <p className="text-xs text-[#434652] font-medium">Average email response &lt; 2 hours during IST working hours.</p>
                </div>
              </div>
            </div>

            {/* Guarantee Callout */}
            <div className="bg-[#f1f3ff] p-6 rounded-3xl border border-[#cbdaff] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#006e29] font-black text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Satisfaction Guarantee</span>
              </div>
              <p className="text-xs text-[#434652] leading-relaxed font-medium">
                If your first session with a matched mentor is anything less than transformative, we will immediately rematch you or refund 100% of your session fee. No questions asked.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ SECTION */}
        <div className="mt-4">
          <div className="text-center mb-8">
            <span className="text-xs font-black uppercase tracking-widest text-[#002869] block mb-1">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
              Everything you need to know
            </h2>
          </div>

          {/* Category Filter for FAQ */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {['all', 'mentees', 'mentors', 'billing', 'general'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFaqCategory(cat)}
                className={`px-3.5 py-1 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                  faqCategory === cat
                    ? 'bg-[#002869] text-white'
                    : 'bg-white text-[#434652] border border-[#cbdaff] hover:bg-[#f1f3ff]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white border border-[#cbdaff] rounded-2xl overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#f9f9ff]"
                  >
                    <span className="font-bold text-sm text-[#061b3b]">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#002869] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#747783] shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-[#434652] leading-relaxed border-t border-gray-100 bg-[#f9f9ff]/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
