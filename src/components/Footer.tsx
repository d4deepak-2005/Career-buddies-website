import React, { useState } from 'react';
import { DEFAULT_SITE_CONFIG } from '../config/siteConfig';
import { PageView } from '../types';
import { BrandLogo } from './BrandLogo';
import { HandshakeIcon } from './common/HandshakeIcon';
import { 
  Users, 
  Map, 
  Video, 
  Rocket, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  Globe, 
  Target,
  GraduationCap,
  ClipboardCheck,
  BadgeCheck,
  ChevronRight,
  X
} from 'lucide-react';

interface FooterProps {
  setActivePage: (page: PageView) => void;
  onOpenContact?: () => void;
  onOpenSignup?: () => void;
  onOpenCounselling?: () => void;
}

// Official Social Media links in strict requested order: LinkedIn → Facebook → Instagram → YouTube → X
const SOCIAL_MEDIA_LINKS = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/company/107530340/admin/dashboard/',
    ariaLabel: 'Visit CareerBuddies LinkedIn profile',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    )
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/people/Career-buddies/61593572071511/',
    ariaLabel: 'Visit CareerBuddies Facebook page',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/careerbuddies01?igsi=MWliNndoOTR6dWExNA==',
    ariaLabel: 'Visit CareerBuddies Instagram profile',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    )
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/channel/UCHuC0qHOaAQ1I-LRln18OZg',
    ariaLabel: 'Visit CareerBuddies YouTube channel',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  {
    name: 'X',
    url: 'https://x.com/CareerBuddies01',
    ariaLabel: 'Visit CareerBuddies X profile',
    icon: (
      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  }
];

export const Footer: React.FC<FooterProps> = ({
  setActivePage
}) => {
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  // WhatsApp configuration
  const WHATSAPP_NUMBER = '919310288270';
  const WHATSAPP_MESSAGE = `Hello CareerBuddies,

I visited the CareerBuddies website and would like to know more about your programmes and career guidance services.

I am looking for guidance to understand which programme or career support would be most suitable for my professional goals.

Please connect with me and help me with the relevant details.

Thank you!`;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  const handleWhatsAppClick = () => {
    setShowThankYouModal(true);
  };

  const handleNav = (page: PageView) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-gradient-to-r from-[#002256] via-[#014d59] to-[#006226] border-t border-[#002869]/40 text-white relative overflow-hidden">
      {/* Soft Background Brand Ambient Glows */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#79fd8d]/8 rounded-full blur-3xl pointer-events-none -mr-36 -mt-36" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#001947]/25 rounded-full blur-3xl pointer-events-none -ml-36 -mb-36" />

      {/* Main Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-12 pb-10 relative z-10">
        
        {/* ====================================================
            MAIN TOP AREA: BALANCED TWO-COLUMN LAYOUT
            Left Side: Logo, Description, Quick Links, 2x2 Feature Cards
            Right Side: Large Glass Panel ("What Makes Us Different" with 2 internal columns)
            Both sides equal width & balanced height.
            ==================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch mb-8">
          
          {/* ----------------------------------------------------
              LEFT SIDE (50% width on desktop)
              1. Brand Logo & Description
              2. Quick Links navigation strip
              3. Four Benefit Cards (2 x 2 layout)
              ---------------------------------------------------- */}
          <div className="flex flex-col justify-between gap-4 h-full">
            
            {/* Top Brand Header & Description */}
            <div className="flex flex-col gap-3">
              <div className="w-fit max-w-[560px]">
                <div className="relative inline-flex items-center">
                  {/* Organic seamless white fade that dissolves smoothly into the dark navy footer background */}
                  <div
                    className="absolute -inset-y-2 -left-3 -right-8 pointer-events-none rounded-l-2xl"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 42%, rgba(255,255,255,0.8) 58%, rgba(255,255,255,0.4) 75%, rgba(255,255,255,0.1) 88%, rgba(255,255,255,0) 100%)',
                      WebkitMaskImage: 'radial-gradient(ellipse 110% 130% at 38% 50%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0) 100%)',
                      maskImage: 'radial-gradient(ellipse 110% 130% at 38% 50%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0) 100%)'
                    }}
                  />
                  <div className="relative z-10">
                    <BrandLogo
                      size="footer"
                      variant="white"
                      onClick={() => handleNav('home')}
                      className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#dae2ff] leading-relaxed font-medium">
                CareerBuddies is India's practitioner-led career acceleration platform. We empower software engineers, technical leaders, and product managers through structured career progression plans, live masterclasses, and verified promotion roadmaps.
              </p>
            </div>

            {/* Clean Quick Links Bar */}
            <div className="p-2.5 bg-white/85 backdrop-blur-md rounded-2xl border border-[#cbdaff]/75 shadow-[0_4px_20px_-4px_rgba(0,40,105,0.06)] flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#002869] px-2 py-0.5 shrink-0">
                Quick Links:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: 'Home', page: 'home' as PageView },
                  { label: 'Services', page: 'services' as PageView },
                  { label: 'Programmes', page: 'programmes' as PageView },
                  { label: 'Leadership', page: 'leadership' as PageView },
                  { label: 'About Us', page: 'about-us' as PageView },
                  { label: 'Contact', page: 'contact' as PageView }
                ].map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleNav(item.page)}
                    className="text-[11px] font-bold text-[#434652] hover:text-[#002869] hover:bg-[#eef4ff] px-2.5 py-1 rounded-xl transition-all duration-150 cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Four Benefit Cards (2 x 2 Layout with Equal Dimensions & Grid Alignment) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-0.5 flex-1">
              
              {/* Benefit Card 1: PRACTITIONER LED */}
              <div className="p-3.5 sm:p-4 bg-white/85 backdrop-blur-md rounded-2xl border border-[#cbdaff]/75 shadow-[0_4px_20px_-4px_rgba(0,40,105,0.06)] hover:border-[#002869]/50 hover:shadow-[0_8px_25px_-5px_rgba(0,40,105,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-start gap-1.5 group cursor-default h-full">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#002869]/10 text-[#002869] flex items-center justify-center shrink-0 group-hover:bg-[#002869]/15 group-hover:scale-105 transition-all duration-200">
                    <Users className="w-4 h-4" />
                  </div>
                  <h5 className="text-[11px] font-black uppercase tracking-tight text-[#002869] leading-tight">
                    Practitioner Led
                  </h5>
                </div>
                <p className="text-[11px] text-[#434652] leading-relaxed font-medium mt-0.5">
                  Learn from industry practitioners who have walked the path.
                </p>
              </div>

              {/* Benefit Card 2: VERIFIED ROADMAPS */}
              <div className="p-3.5 sm:p-4 bg-white/85 backdrop-blur-md rounded-2xl border border-[#cbdaff]/75 shadow-[0_4px_20px_-4px_rgba(0,40,105,0.06)] hover:border-[#006e29]/50 hover:shadow-[0_8px_25px_-5px_rgba(0,110,41,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-start gap-1.5 group cursor-default h-full">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#006e29]/10 text-[#006e29] flex items-center justify-center shrink-0 group-hover:bg-[#006e29]/15 group-hover:scale-105 transition-all duration-200">
                    <Map className="w-4 h-4" />
                  </div>
                  <h5 className="text-[11px] font-black uppercase tracking-tight text-[#006e29] leading-tight">
                    Verified Roadmaps
                  </h5>
                </div>
                <p className="text-[11px] text-[#434652] leading-relaxed font-medium mt-0.5">
                  Step-by-step career roadmaps for each level and role.
                </p>
              </div>

              {/* Benefit Card 3: LIVE MASTERCLASSES */}
              <div className="p-3.5 sm:p-4 bg-white/85 backdrop-blur-md rounded-2xl border border-[#cbdaff]/75 shadow-[0_4px_20px_-4px_rgba(0,40,105,0.06)] hover:border-[#002869]/50 hover:shadow-[0_8px_25px_-5px_rgba(0,40,105,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-start gap-1.5 group cursor-default h-full">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#002869]/10 text-[#002869] flex items-center justify-center shrink-0 group-hover:bg-[#002869]/15 group-hover:scale-105 transition-all duration-200">
                    <Video className="w-4 h-4" />
                  </div>
                  <h5 className="text-[11px] font-black uppercase tracking-tight text-[#002869] leading-tight">
                    Live Masterclasses
                  </h5>
                </div>
                <p className="text-[11px] text-[#434652] leading-relaxed font-medium mt-0.5">
                  Learn, interact and grow with live sessions from industry experts.
                </p>
              </div>

              {/* Benefit Card 4: CAREER ACCELERATION */}
              <div className="p-3.5 sm:p-4 bg-white/85 backdrop-blur-md rounded-2xl border border-[#cbdaff]/75 shadow-[0_4px_20px_-4px_rgba(0,40,105,0.06)] hover:border-[#006e29]/50 hover:shadow-[0_8px_25px_-5px_rgba(0,110,41,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-start gap-1.5 group cursor-default h-full">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#006e29]/10 text-[#006e29] flex items-center justify-center shrink-0 group-hover:bg-[#006e29]/15 group-hover:scale-105 transition-all duration-200">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <h5 className="text-[11px] font-black uppercase tracking-tight text-[#006e29] leading-tight">
                    Career Acceleration
                  </h5>
                </div>
                <p className="text-[11px] text-[#434652] leading-relaxed font-medium mt-0.5">
                  Clear guidance, practical approach and proven career outcomes.
                </p>
              </div>

            </div>

          </div>

          {/* ----------------------------------------------------
              RIGHT SIDE (50% width on desktop)
              One Large Glass Panel: WHAT MAKES US DIFFERENT
              With 2 Internal Columns:
              - Left Column: 4 Differentiators
              - Right Column: 4 Unique Value Highlights (NO WHATSAPP)
              ---------------------------------------------------- */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-[#cbdaff]/75 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,40,105,0.06)] flex flex-col justify-between h-full">
            
            {/* Header: Title + Badge + Divider */}
            <div className="flex flex-col flex-1 justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#cbdaff]/70">
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#002869]">
                    What Makes Us Different
                  </h4>
                  <span className="text-[10px] font-extrabold text-[#006e29] bg-[#d7f8df]/90 px-2.5 py-0.5 rounded-full border border-[#006e29]/20 shadow-2xs">
                    Verified Outcomes
                  </span>
                </div>

                {/* 2 Internal Columns Aligned Perfectly */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
                  
                  {/* Left Internal Column: 4 Differentiators */}
                  <div className="flex flex-col justify-between gap-3.5">
                    
                    {/* 1. Practical, Real-World Guidance */}
                    <div className="flex items-start gap-2.5 group cursor-default min-h-[44px]">
                      <div className="w-6 h-6 rounded-lg bg-[#002869]/10 text-[#002869] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#002869]/15 group-hover:scale-105 transition-all duration-200">
                        <Target className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <h6 className="text-[11px] font-bold text-[#061b3b] leading-tight group-hover:text-[#002869] transition-colors duration-150">
                          Practical, Real-World Guidance
                        </h6>
                        <p className="text-[10px] text-[#434652] leading-relaxed mt-0.5">
                          Solutions that are actionable and relevant to your role and experience.
                        </p>
                      </div>
                    </div>

                    {/* 2. Community of Growth-Minded Professionals */}
                    <div className="flex items-start gap-2.5 group cursor-default min-h-[44px]">
                      <div className="w-6 h-6 rounded-lg bg-[#006e29]/10 text-[#006e29] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#006e29]/15 group-hover:scale-105 transition-all duration-200">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <h6 className="text-[11px] font-bold text-[#061b3b] leading-tight group-hover:text-[#006e29] transition-colors duration-150">
                          Community of Growth-Minded Professionals
                        </h6>
                        <p className="text-[10px] text-[#434652] leading-relaxed mt-0.5">
                          Learn, share and grow with peers who are on similar journeys.
                        </p>
                      </div>
                    </div>

                    {/* 3. Trust & Transparency */}
                    <div className="flex items-start gap-2.5 group cursor-default min-h-[44px]">
                      <div className="w-6 h-6 rounded-lg bg-[#002869]/10 text-[#002869] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#002869]/15 group-hover:scale-105 transition-all duration-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <h6 className="text-[11px] font-bold text-[#061b3b] leading-tight group-hover:text-[#002869] transition-colors duration-150">
                          Trust & Transparency
                        </h6>
                        <p className="text-[10px] text-[#434652] leading-relaxed mt-0.5">
                          Verified roadmaps, unbiased guidance and complete transparency.
                        </p>
                      </div>
                    </div>

                    {/* 4. Continuous Support */}
                    <div className="flex items-start gap-2.5 group cursor-default min-h-[44px]">
                      <div className="w-6 h-6 rounded-lg bg-[#006e29]/10 text-[#006e29] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#006e29]/15 group-hover:scale-105 transition-all duration-200">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <h6 className="text-[11px] font-bold text-[#061b3b] leading-tight group-hover:text-[#006e29] transition-colors duration-150">
                          Continuous Support
                        </h6>
                        <p className="text-[10px] text-[#434652] leading-relaxed mt-0.5">
                          We stay with you at every step of your career journey.
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Right Internal Column: 4 Unique Value Highlights (NO WHATSAPP) */}
                  <div className="flex flex-col justify-between gap-3.5 sm:border-l sm:border-[#cbdaff]/70 sm:pl-5">
                    
                    {/* 1. Expert-Led Guidance */}
                    <div className="flex items-start gap-2.5 group cursor-default min-h-[44px]">
                      <div className="w-6 h-6 rounded-lg bg-[#002869]/10 text-[#002869] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#002869]/15 group-hover:scale-105 transition-all duration-200">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <h6 className="text-[11px] font-bold text-[#061b3b] leading-tight group-hover:text-[#002869] transition-colors duration-150">
                          Expert-Led Guidance
                        </h6>
                        <p className="text-[10px] text-[#434652] leading-relaxed mt-0.5">
                          Learn from experienced industry professionals.
                        </p>
                      </div>
                    </div>

                    {/* 2. Practical Approach */}
                    <div className="flex items-start gap-2.5 group cursor-default min-h-[44px]">
                      <div className="w-6 h-6 rounded-lg bg-[#006e29]/10 text-[#006e29] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#006e29]/15 group-hover:scale-105 transition-all duration-200">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <h6 className="text-[11px] font-bold text-[#061b3b] leading-tight group-hover:text-[#006e29] transition-colors duration-150">
                          Practical Approach
                        </h6>
                        <p className="text-[10px] text-[#434652] leading-relaxed mt-0.5">
                          Actionable learning that drives real results.
                        </p>
                      </div>
                    </div>

                    {/* 3. Quality Assured */}
                    <div className="flex items-start gap-2.5 group cursor-default min-h-[44px]">
                      <div className="w-6 h-6 rounded-lg bg-[#002869]/10 text-[#002869] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#002869]/15 group-hover:scale-105 transition-all duration-200">
                        <BadgeCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <h6 className="text-[11px] font-bold text-[#061b3b] leading-tight group-hover:text-[#002869] transition-colors duration-150">
                          Quality Assured
                        </h6>
                        <p className="text-[10px] text-[#434652] leading-relaxed mt-0.5">
                          Curated content with high standards.
                        </p>
                      </div>
                    </div>

                    {/* 4. Career-Focused Outcomes */}
                    <div className="flex items-start gap-2.5 group cursor-default min-h-[44px]">
                      <div className="w-6 h-6 rounded-lg bg-[#006e29]/10 text-[#006e29] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#006e29]/15 group-hover:scale-105 transition-all duration-200">
                        <HandshakeIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <h6 className="text-[11px] font-bold text-[#061b3b] leading-tight group-hover:text-[#006e29] transition-colors duration-150">
                          Career-Focused Outcomes
                        </h6>
                        <p className="text-[10px] text-[#434652] leading-relaxed mt-0.5">
                          Designed to help you grow and advance.
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* OUR APPROACH - 3-Step Career Progression */}
              <div className="mt-4 pt-3.5 border-t border-[#cbdaff]/70">
                <div className="flex items-center justify-between mb-2.5">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-[#002869]">
                    Our Approach
                  </h5>
                  <span className="text-[9px] font-bold text-[#747783] uppercase tracking-wider">
                    3-Step Progression
                  </span>
                </div>

                {/* 3-Step Horizontal Progression Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  
                  {/* Step 1: ASSESS */}
                  <div className="p-2 sm:p-2.5 bg-white/70 backdrop-blur-xs rounded-xl border border-[#cbdaff]/70 flex flex-col justify-between group hover:border-[#002869]/40 hover:bg-white/95 transition-all duration-150 cursor-default">
                    <div className="flex items-center justify-between mb-1">
                      <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-md bg-[#002869]/10 text-[#002869] text-[10px] font-black flex items-center justify-center">
                        1
                      </span>
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-[#002869]/50">
                        Step
                      </span>
                    </div>
                    <div>
                      <h6 className="text-[10.5px] sm:text-[11px] font-black uppercase tracking-tight text-[#002869] leading-tight">
                        Assess
                      </h6>
                      <p className="text-[9px] sm:text-[9.5px] text-[#434652] font-medium leading-snug mt-0.5">
                        Where you are today
                      </p>
                    </div>
                  </div>

                  {/* Step 2: ALIGN */}
                  <div className="p-2 sm:p-2.5 bg-white/70 backdrop-blur-xs rounded-xl border border-[#cbdaff]/70 flex flex-col justify-between group hover:border-[#002869]/40 hover:bg-white/95 transition-all duration-150 cursor-default">
                    <div className="flex items-center justify-between mb-1">
                      <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-md bg-[#002869]/10 text-[#002869] text-[10px] font-black flex items-center justify-center">
                        2
                      </span>
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-[#002869]/50">
                        Step
                      </span>
                    </div>
                    <div>
                      <h6 className="text-[10.5px] sm:text-[11px] font-black uppercase tracking-tight text-[#002869] leading-tight">
                        Align
                      </h6>
                      <p className="text-[9px] sm:text-[9.5px] text-[#434652] font-medium leading-snug mt-0.5">
                        Where you want to go
                      </p>
                    </div>
                  </div>

                  {/* Step 3: ACCELERATE */}
                  <div className="p-2 sm:p-2.5 bg-white/70 backdrop-blur-xs rounded-xl border border-[#cbdaff]/70 flex flex-col justify-between group hover:border-[#006e29]/40 hover:bg-white/95 transition-all duration-150 cursor-default">
                    <div className="flex items-center justify-between mb-1">
                      <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-md bg-[#006e29]/10 text-[#006e29] text-[10px] font-black flex items-center justify-center">
                        3
                      </span>
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-[#006e29]/50">
                        Step
                      </span>
                    </div>
                    <div>
                      <h6 className="text-[10.5px] sm:text-[11px] font-black uppercase tracking-tight text-[#006e29] leading-tight">
                        Accelerate
                      </h6>
                      <p className="text-[9px] sm:text-[9.5px] text-[#434652] font-medium leading-snug mt-0.5">
                        How to get there
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Bottom Subtle Glass Tagline inside Right Panel - Aligned to edges */}
            <div className="mt-4 pt-3.5 border-t border-[#cbdaff]/50 flex items-center justify-between text-[10px] text-[#747783] font-medium">
              <span>Structured Career Acceleration</span>
              <span className="text-[#006e29] font-bold">100% Verified Pathways</span>
            </div>

          </div>

        </div>

        {/* ====================================================
            BLUE/GREEN WHATSAPP CTA SECTION
            (ONLY WhatsApp CTA in the entire section)
            ==================================================== */}
        <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#002869] via-[#0a3578] to-[#00531d] text-white border border-[#cbdaff]/40 shadow-[0_8px_30px_rgba(0,40,105,0.15)] flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left Side: Growth / Career Progression circular illustration + Heading */}
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-[#79fd8d] shrink-0 shadow-inner">
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-sm sm:text-base lg:text-lg font-black uppercase tracking-wider text-[#79fd8d] leading-snug">
                Ready to Take the Next Step?
              </h4>
              <p className="text-xs sm:text-sm text-[#dae2ff] font-medium leading-relaxed max-w-xl">
                Get practical career guidance and discover the right programme for your professional goals.
              </p>
            </div>
          </div>

          {/* Right Side: Single WhatsApp CTA Button + Subtitle */}
          <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0 w-full sm:w-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              title="Connect with us on WhatsApp"
              aria-label="Connect with us on WhatsApp"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-[#001947] text-xs sm:text-sm font-black rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer whitespace-nowrap hover:-translate-y-0.5 active:translate-y-0 group"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-current shrink-0 group-hover:scale-110 transition-transform duration-200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>CONNECT WITH US ON WHATSAPP</span>
            </a>
            <span className="text-[11px] text-[#dae2ff]/90 font-medium tracking-tight text-center md:text-right">
              Secure. Private. Professional Guidance.
            </span>
          </div>

        </div>

        {/* ====================================================
            LOWER SOCIAL + STATS SECTION: BALANCED TWO COLUMNS
            Left Side: Follow Us (LinkedIn, Facebook, Instagram, YouTube, X)
            Right Side: Glass Statistics Panel (5000+, 200+, 95%, 50+)
            ==================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-8">
          
          {/* Left Column: Follow Us Social Icons (col-span-4) */}
          <div className="lg:col-span-4 bg-white/85 backdrop-blur-md rounded-2xl border border-[#cbdaff]/75 px-5 py-3.5 sm:py-3 shadow-[0_4px_20px_-4px_rgba(0,40,105,0.06)] flex items-center justify-between sm:justify-start gap-3 sm:gap-4 h-full">
            <span className="text-xs font-black uppercase tracking-wider text-[#002869] whitespace-nowrap">
              Follow Us:
            </span>
            <div className="flex items-center gap-2 sm:gap-2.5">
              {SOCIAL_MEDIA_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.ariaLabel}
                  title={`Follow CareerBuddies on ${social.name}`}
                  className="w-8 h-8 rounded-xl bg-white border border-[#cbdaff]/75 text-[#002869] shadow-2xs hover:shadow-[0_4px_12px_rgba(0,40,105,0.12)] hover:border-[#002869]/60 hover:text-[#002869] hover:bg-[#f0f5ff] flex items-center justify-center transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group shrink-0"
                >
                  <span className="transition-transform duration-200 group-hover:scale-110">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Right Column: Statistics Panel with 4 Equal Columns (col-span-8) */}
          <div className="lg:col-span-8 bg-white/85 backdrop-blur-md rounded-2xl border border-[#cbdaff]/75 px-5 py-3.5 sm:py-3 shadow-[0_4px_20px_-4px_rgba(0,40,105,0.06)] flex items-center h-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-[#cbdaff]/70 text-center w-full">
              
              {/* Stat 1: 5000+ Professionals Guided */}
              <div className="px-2 py-1 flex flex-col items-center justify-center group cursor-default">
                <div className="w-6 h-6 rounded-lg bg-[#002869]/10 text-[#002869] flex items-center justify-center mb-1 group-hover:bg-[#002869]/15 group-hover:scale-105 transition-all duration-200">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="text-base sm:text-lg font-black text-[#002869] tracking-tight group-hover:text-[#0a3578] transition-colors duration-150">
                  5000+
                </span>
                <span className="text-[10px] text-[#434652] font-bold leading-tight mt-0.5">
                  Professionals Guided
                </span>
              </div>

              {/* Stat 2: 200+ Live Masterclasses Conducted */}
              <div className="px-2 py-1 flex flex-col items-center justify-center pt-2 sm:pt-1 group cursor-default">
                <div className="w-6 h-6 rounded-lg bg-[#006e29]/10 text-[#006e29] flex items-center justify-center mb-1 group-hover:bg-[#006e29]/15 group-hover:scale-105 transition-all duration-200">
                  <Video className="w-3.5 h-3.5" />
                </div>
                <span className="text-base sm:text-lg font-black text-[#006e29] tracking-tight group-hover:text-[#00531d] transition-colors duration-150">
                  200+
                </span>
                <span className="text-[10px] text-[#434652] font-bold leading-tight mt-0.5">
                  Live Masterclasses Conducted
                </span>
              </div>

              {/* Stat 3: 95% Career Growth Achieved */}
              <div className="px-2 py-1 flex flex-col items-center justify-center pt-2 sm:pt-1 group cursor-default">
                <div className="w-6 h-6 rounded-lg bg-[#002869]/10 text-[#002869] flex items-center justify-center mb-1 group-hover:bg-[#002869]/15 group-hover:scale-105 transition-all duration-200">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <span className="text-base sm:text-lg font-black text-[#002869] tracking-tight group-hover:text-[#0a3578] transition-colors duration-150">
                  95%
                </span>
                <span className="text-[10px] text-[#434652] font-bold leading-tight mt-0.5">
                  Career Growth Achieved
                </span>
              </div>

              {/* Stat 4: 50+ Verified Career Roadmaps */}
              <div className="px-2 py-1 flex flex-col items-center justify-center pt-2 sm:pt-1 group cursor-default">
                <div className="w-6 h-6 rounded-lg bg-[#006e29]/10 text-[#006e29] flex items-center justify-center mb-1 group-hover:bg-[#006e29]/15 group-hover:scale-105 transition-all duration-200">
                  <Map className="w-3.5 h-3.5" />
                </div>
                <span className="text-base sm:text-lg font-black text-[#006e29] tracking-tight group-hover:text-[#00531d] transition-colors duration-150">
                  50+
                </span>
                <span className="text-[10px] text-[#434652] font-bold leading-tight mt-0.5">
                  Verified Career Roadmaps
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* ====================================================
            BOTTOM BAR: Copyright, Official Domain URL, & Legal Links
            Left: Copyright
            Center: Official Domain Pill
            Right: Policy Links + Admin Button
            ==================================================== */}
        <div className="pt-6 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#dae2ff]">
          
          {/* Copyright Notice - Aligned Left */}
          <div className="md:flex-1 text-center md:text-left">
            <p className="font-medium text-[#dae2ff]/90">
              © 2022–2026 {DEFAULT_SITE_CONFIG.companyName}. All rights reserved.
            </p>
          </div>

          {/* Official Domain Link Display - Visually Centered */}
          <div className="md:flex-1 flex justify-center">
            <a 
              href="https://www.careerbuddies.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-white/40 hover:border-white hover:bg-white hover:shadow-[0_2px_12px_rgba(0,0,0,0.18)] shadow-xs transition-all duration-200 cursor-pointer group"
              title="Visit CareerBuddies official website (www.careerbuddies.in)"
            >
              <Globe className="w-3.5 h-3.5 text-[#002869] group-hover:text-[#006e29] transition-colors duration-200" />
              <span className="font-black text-[#002869] tracking-tight group-hover:text-[#002869] transition-colors duration-200">www.careerbuddies.in</span>
            </a>
          </div>

          {/* Legal / Policy Links + Admin Button - Aligned Right */}
          <div className="md:flex-1 flex items-center justify-center md:justify-end gap-4 font-bold flex-wrap">
            <button onClick={() => handleNav('about-us')} className="hover:text-white transition-colors duration-150 cursor-pointer text-[#dae2ff]">
              Privacy Policy
            </button>
            <button onClick={() => handleNav('about-us')} className="hover:text-white transition-colors duration-150 cursor-pointer text-[#dae2ff]">
              Terms of Service
            </button>
            <button onClick={() => handleNav('contact')} className="hover:text-white transition-colors duration-150 cursor-pointer text-[#dae2ff]">
              Refund Policy
            </button>
            <button 
              onClick={() => handleNav('admin')} 
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 border border-white/40 text-[#002869] hover:bg-white hover:text-[#002869] shadow-xs hover:shadow-[0_2px_10px_rgba(0,0,0,0.18)] transition-all duration-200 cursor-pointer font-bold"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>
        </div>

      </div>

      {/* ====================================================
          THANK YOU CONFIRMATION POPUP / MODAL
          ==================================================== */}
      {showThankYouModal && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001947]/30 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="max-w-md w-full bg-white/95 backdrop-blur-md border border-[#cbdaff] ring-4 ring-[#002869]/5 text-[#061b3b] p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 relative flex flex-col gap-4">
            
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d7f8df] to-[#c2f3ce] text-[#006e29] flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#002869]">
                    Thank You!
                  </h3>
                  <span className="text-[11px] text-[#006e29] font-bold">
                    Connecting on WhatsApp
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setShowThankYouModal(false)}
                aria-label="Close notification"
                className="text-[#747783] hover:text-[#061b3b] p-1.5 rounded-lg hover:bg-[#f6f9fc] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#434652] leading-relaxed font-medium">
              Thanks for reaching out to CareerBuddies. Our team will be happy to help you with the right career guidance.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#cbdaff]/60">
              <button
                onClick={() => setShowThankYouModal(false)}
                className="px-5 py-2 bg-[#002869] hover:bg-[#0a3578] text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
              >
                Continue
              </button>
            </div>

          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
