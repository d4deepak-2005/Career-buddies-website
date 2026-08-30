import React, { useState, useMemo } from 'react';
import { WebinarItem, PageView } from '../../types';
import { INITIAL_WEBINARS, WEBINAR_FAQS, DEFAULT_SITE_CONFIG } from '../../config/siteConfig';
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  ArrowRight, 
  Sparkles, 
  Video, 
  Award, 
  ChevronDown, 
  ChevronUp,
  ShieldCheck,
  Home
} from 'lucide-react';
import { PageNavigationControls } from '../common/PageNavigationControls';
import { SectionHeading } from '../common/SectionHeading';

interface WebinarsScreenProps {
  onSelectWebinar: (webinar: WebinarItem) => void;
  onRegisterWebinar: (webinar: WebinarItem) => void;
  onOpenCounselling?: () => void;
  setActivePage?: (page: PageView) => void;
}

export const WebinarsScreen: React.FC<WebinarsScreenProps> = ({
  onSelectWebinar,
  onRegisterWebinar,
  onOpenCounselling,
  setActivePage
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const categories = ['All', 'Engineering & Architecture', 'Product Management', 'Career Strategy', 'Data & AI'];

  const filteredWebinars = useMemo(() => {
    return INITIAL_WEBINARS.filter((w) => {
      const matchCat = selectedCategory === 'All' || w.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        w.title.toLowerCase().includes(q) ||
        w.tagline.toLowerCase().includes(q) ||
        w.speaker.name.toLowerCase().includes(q) ||
        w.speaker.company.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const handleBackToHome = () => {
    if (setActivePage) {
      setActivePage('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-10">
        
        {/* Universal Navigation Controls */}
        <PageNavigationControls
          onBackToHome={handleBackToHome}
          onBack={handleBackToHome}
          onNext={() => {
            if (filteredWebinars.length > 0) {
              onSelectWebinar(filteredWebinars[0]);
            }
          }}
          backLabel="Home"
          nextLabel="View Featured Masterclass"
          currentStepLabel={`Live Masterclasses & Webinars (₹${DEFAULT_SITE_CONFIG.webinarDefaultPriceINR})`}
        />

        {/* Hero Banner */}
        <div className="bg-[#002869] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#79fd8d]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 max-w-3xl flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-[#dae2ff] w-fit">
              <GraduationCap className="w-3.5 h-3.5 text-[#79fd8d]" />
              <span>Live Masterclasses & Interactive Webinars</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
              Live Career & Technical Masterclasses
            </h1>

            <p className="text-sm sm:text-base text-[#dae2ff] leading-relaxed max-w-2xl font-medium">
              Learn directly from seasoned practitioners at Google, Meta, Stripe, and DeepMind. Focused 90-minute live deep-dives with interactive Q&A, actionable frameworks, and full recordings.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold text-white">
              <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl border border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-[#79fd8d]" />
                Standard All-Access Pass: ₹{DEFAULT_SITE_CONFIG.webinarDefaultPriceINR}
              </span>
              <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl border border-white/15">
                <Video className="w-3.5 h-3.5 text-[#79fd8d]" />
                Full HD Recording Included
              </span>
              <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl border border-white/15">
                <Award className="w-3.5 h-3.5 text-[#79fd8d]" />
                Certificate of Attendance
              </span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-3xl p-5 border border-[#cbdaff] shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-[#747783] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, speaker, or tech stack..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869]"
              />
            </div>

            {/* Results count badge */}
            <span className="text-xs font-bold text-[#434652] whitespace-nowrap">
              Showing <strong className="text-[#002869]">{filteredWebinars.length}</strong> upcoming masterclasses
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#002869] text-white shadow-xs'
                    : 'bg-[#f1f3ff] text-[#434652] hover:bg-[#dae2ff]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Webinars Grid */}
        {filteredWebinars.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#cbdaff] flex flex-col items-center gap-3">
            <Search className="w-8 h-8 text-[#747783]" />
            <h3 className="text-lg font-bold text-[#061b3b]">No masterclasses found</h3>
            <p className="text-xs text-[#747783]">Try changing your search keywords or category filters.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#002869] text-white text-xs font-bold rounded-xl mt-2 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWebinars.map((webinar) => (
              <div
                key={webinar.id}
                className="bg-white rounded-3xl border border-[#cbdaff] hover:border-[#002869] transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Category & Pass Badge Header */}
                  <div className="p-5 pb-3 flex items-center justify-between border-b border-gray-100 bg-[#f9f9ff]">
                    <span className="text-[11px] font-extrabold text-[#002869] bg-[#dae2ff] px-2.5 py-0.5 rounded-md">
                      {webinar.category}
                    </span>
                    <span className="text-xs font-bold text-[#006e29] bg-[#79fd8d]/25 px-2.5 py-0.5 rounded-md border border-[#006e29]/20">
                      Live Pass
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <div className="p-6 flex flex-col gap-3">
                    <h3 className="text-lg font-bold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif] group-hover:text-[#002869] transition-colors leading-snug line-clamp-2">
                      {webinar.title}
                    </h3>
                    <p className="text-xs text-[#434652] leading-relaxed line-clamp-2">
                      {webinar.tagline}
                    </p>

                    {/* Date & Time */}
                    <div className="flex flex-col gap-1.5 py-2 border-y border-gray-100 text-xs text-[#434652]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#002869]" />
                        <span className="font-semibold">{webinar.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#006e29]" />
                        <span>{webinar.time} ({webinar.duration})</span>
                      </div>
                    </div>

                    {/* Speaker Info */}
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={webinar.speaker.avatar}
                        alt={webinar.speaker.name}
                        className="w-10 h-10 rounded-xl object-cover border border-[#cbdaff]"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#061b3b] truncate">
                          {webinar.speaker.name}
                        </span>
                        <span className="text-[11px] text-[#747783] truncate">
                          {webinar.speaker.role} • {webinar.speaker.company}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: View Details & Register */}
                <div className="p-5 pt-0 bg-white flex items-center gap-2">
                  <button
                    onClick={() => onSelectWebinar(webinar)}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-[#cbdaff] hover:bg-[#f1f3ff] text-[#002869] text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => onRegisterWebinar(webinar)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Register (₹{webinar.priceINR || DEFAULT_SITE_CONFIG.webinarDefaultPriceINR})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#79fd8d]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Webinar FAQs Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#cbdaff] shadow-xs flex flex-col gap-6">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
              Frequently Asked Questions about Masterclasses
            </h3>
            <p className="text-xs sm:text-sm text-[#747783]">
              Everything you need to know about access, recordings, live Q&A, and certificates.
            </p>
          </div>

          <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full">
            {WEBINAR_FAQS.map((faq) => (
              <div
                key={faq.id}
                className="border border-[#cbdaff] rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-[#061b3b] flex items-center justify-between gap-4 hover:bg-[#f9f9ff] cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {openFaq === faq.id ? (
                    <ChevronUp className="w-4 h-4 text-[#002869] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#747783] shrink-0" />
                  )}
                </button>
                {openFaq === faq.id && (
                  <div className="p-4 pt-0 text-xs text-[#434652] leading-relaxed bg-[#f9f9ff] border-t border-gray-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
