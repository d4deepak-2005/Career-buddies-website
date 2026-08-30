import React, { useState, useRef, useEffect } from 'react';
import { PageView } from '../types';
import { BrandLogo } from './BrandLogo';
import { 
  Menu, 
  X, 
  Sparkles, 
  User, 
  ChevronDown,
  Compass,
  Award,
  Users,
  Clock,
  ShieldCheck,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { DEFAULT_SITE_CONFIG } from '../config/siteConfig';

interface NavbarProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
  onOpenCounselling: (planTitle?: string) => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onOpenUserDashboard: () => void;
  bookedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  onOpenCounselling,
  onOpenLogin,
  onOpenSignup,
  onOpenUserDashboard,
  bookedCount = 0
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);

  // Close explore dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setExploreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (page: PageView) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    setExploreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isExploreActive = [
    'webinars', 
    'leadership', 
    'success-stories', 
    'career-check-in', 
    'about-us', 
    'contact',
    'mentors',
    'admin'
  ].includes(activePage);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#cbdaff]/70 shadow-[0_2px_14px_rgba(0,40,105,0.04)] transition-all">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-2.5 flex items-center justify-between gap-3 sm:gap-4 md:gap-6 lg:gap-8">
        
        {/* Left Side: Prominent, Wide Official CareerBuddies Logo Presentation Area */}
        <div className="flex items-center shrink-0">
          <div 
            onClick={() => handleNav('home')}
            className="group relative inline-flex items-center py-1 sm:py-1.5 px-2 sm:px-3 rounded-2xl transition-all duration-200 cursor-pointer select-none bg-gradient-to-r from-transparent via-[#f4f7ff]/40 to-transparent hover:via-[#dae2ff]/25 border border-transparent hover:border-[#cbdaff]/40 hover:shadow-2xs active:scale-[0.99]"
            title="CareerBuddies - Home"
          >
            {/* Subtle soft backdrop ambient aura for premium prominence */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#dae2ff]/10 via-[#79fd8d]/5 to-[#dae2ff]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="relative z-10 flex items-center">
              <BrandLogo
                size="header"
                className="cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>

        {/* Center: Clean Core Navigation Items (Home | Services | Programmes | More ▼) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 lg:gap-2 xl:gap-2.5">
          {/* 1. Home */}
          <button
            id="nav-home-btn"
            onClick={() => handleNav('home')}
            className={`px-3 lg:px-3.5 xl:px-4 py-2 text-[13px] lg:text-[14px] font-bold tracking-tight transition-all cursor-pointer rounded-xl flex items-center gap-1.5 ${
              activePage === 'home'
                ? 'text-[#002869] bg-[#dae2ff]/80 border border-[#cbdaff]/70 shadow-2xs font-extrabold'
                : 'text-[#434652] hover:text-[#002869] hover:bg-[#f1f4fe] border border-transparent'
            }`}
          >
            <span>Home</span>
            {activePage === 'home' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#002869]" />
            )}
          </button>

          {/* 2. Services */}
          <button
            id="nav-services-btn"
            onClick={() => handleNav('services')}
            className={`px-3 lg:px-3.5 xl:px-4 py-2 text-[13px] lg:text-[14px] font-bold tracking-tight transition-all cursor-pointer rounded-xl flex items-center gap-1.5 ${
              activePage === 'services'
                ? 'text-[#002869] bg-[#dae2ff]/80 border border-[#cbdaff]/70 shadow-2xs font-extrabold'
                : 'text-[#434652] hover:text-[#002869] hover:bg-[#f1f4fe] border border-transparent'
            }`}
          >
            <span>Services</span>
            {activePage === 'services' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#002869]" />
            )}
          </button>

          {/* 3. Programmes */}
          <button
            id="nav-programmes-btn"
            onClick={() => handleNav('programmes')}
            className={`px-3 lg:px-3.5 xl:px-4 py-2 text-[13px] lg:text-[14px] font-bold tracking-tight transition-all cursor-pointer rounded-xl flex items-center gap-1.5 ${
              activePage === 'programmes'
                ? 'text-[#002869] bg-[#dae2ff]/80 border border-[#cbdaff]/70 shadow-2xs font-extrabold'
                : 'text-[#434652] hover:text-[#002869] hover:bg-[#f1f4fe] border border-transparent'
            }`}
          >
            <span>Programmes</span>
            {activePage === 'programmes' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#002869]" />
            )}
          </button>

          {/* 4. More Dropdown (How CareerBuddies Works, Webinars, Stories, Leadership, etc.) */}
          <div className="relative" ref={exploreRef}>
            <button
              id="nav-more-dropdown-btn"
              onClick={() => setExploreOpen(!exploreOpen)}
              className={`px-3 lg:px-3.5 xl:px-4 py-2 text-[13px] lg:text-[14px] font-bold tracking-tight transition-all cursor-pointer rounded-xl flex items-center gap-1.5 ${
                exploreOpen || isExploreActive
                  ? 'text-[#002869] bg-[#dae2ff]/80 border border-[#cbdaff]/70 shadow-2xs font-extrabold'
                  : 'text-[#434652] hover:text-[#002869] hover:bg-[#f1f4fe] border border-transparent'
              }`}
              aria-expanded={exploreOpen}
              aria-haspopup="true"
            >
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${exploreOpen ? 'rotate-180 text-[#002869]' : 'text-[#747783]'}`} />
            </button>

            {exploreOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl border border-[#cbdaff] shadow-xl shadow-[#002869]/8 p-2.5 z-50 animate-in fade-in slide-in-from-top-2">
                {/* How CareerBuddies Works featured link */}
                <button
                  id="more-how-it-works-btn"
                  onClick={() => handleNav('how-it-works')}
                  className="w-full text-left p-3 rounded-xl bg-[#f1f3ff] hover:bg-[#dae2ff] border border-[#cbdaff] transition-all flex items-center justify-between mb-1.5 cursor-pointer shadow-2xs group"
                >
                  <div>
                    <div className="text-xs font-black text-[#002869] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#006e29]" />
                      <span>How CareerBuddies Works</span>
                    </div>
                    <p className="text-[11px] text-[#434652] mt-0.5 font-medium">5-Step Candidate Journey</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[#002869] text-white text-[10px] font-black shadow-xs">5 Steps</span>
                </button>

                <button
                  id="more-webinars-btn"
                  onClick={() => handleNav('webinars')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[#f1f3ff] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#061b3b] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#006e29]" />
                      <span className="uppercase">Live Webinars</span>
                    </div>
                    <p className="text-[11px] text-[#434652] mt-0.5">Join mentor-led career webinars</p>
                  </div>
                </button>

                <button
                  id="more-leadership-btn"
                  onClick={() => handleNav('leadership')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[#f1f3ff] transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#061b3b] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#002869]" />
                    <span>Leadership Team</span>
                  </div>
                  <p className="text-[11px] text-[#434652] mt-0.5">Meet Founder & Co-Founders</p>
                </button>

                <button
                  id="more-success-stories-btn"
                  onClick={() => handleNav('success-stories')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[#f1f3ff] transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#061b3b] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#006e29]" />
                    <span>Success Stories</span>
                  </div>
                  <p className="text-[11px] text-[#434652] mt-0.5">Verified career transformations</p>
                </button>

                <button
                  id="more-career-check-in-btn"
                  onClick={() => handleNav('career-check-in')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[#f1f3ff] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#061b3b] flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#002869]" />
                      <span>Career Check-In</span>
                    </div>
                    <p className="text-[11px] text-[#434652] mt-0.5">Self-assessment diagnostic</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#dae2ff] text-[#001947]">Free</span>
                </button>

                <button
                  id="more-about-btn"
                  onClick={() => handleNav('about-us')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[#f1f3ff] transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#061b3b] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#002869]" />
                    <span>About Us</span>
                  </div>
                  <p className="text-[11px] text-[#434652] mt-0.5">Our mission & story since 2022</p>
                </button>

                <button
                  id="more-contact-btn"
                  onClick={() => handleNav('contact')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-[#f1f3ff] transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#061b3b] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#002869]" />
                    <span>Contact Support</span>
                  </div>
                  <p className="text-[11px] text-[#434652] mt-0.5">Bengaluru Office & WhatsApp</p>
                </button>

                <div className="pt-2 border-t border-gray-100 mt-1">
                  <button
                    id="more-admin-btn"
                    onClick={() => handleNav('admin')}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-[#002869] hover:bg-[#dae2ff] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Controls: [Login / Sign Up] + [Dashboard/Profile] */}
        <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 shrink-0">
          
          {/* Combined Login / Sign Up Button */}
          <button
            id="nav-auth-btn"
            onClick={onOpenLogin}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4.5 py-2 sm:py-2.5 bg-[#002869] hover:bg-[#0b3d91] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            title="Sign in or create a CareerBuddies account"
          >
            <span>Login / Sign Up</span>
          </button>

          {/* User Account / Bookings Dashboard Button */}
          <button
            id="nav-profile-btn"
            onClick={onOpenUserDashboard}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#dae2ff]/90 hover:bg-[#cbdaff] text-[#002869] flex items-center justify-center transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0 border border-[#cbdaff]"
            title="My Career Dashboard & Bookings"
            aria-label="My Career Dashboard & Bookings"
          >
            <User className="w-4 h-4 text-[#002869]" />
            {bookedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#006e29] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {bookedCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            id="nav-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#061b3b] hover:bg-[#e8edff] transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#cbdaff] bg-white px-6 py-5 shadow-2xl animate-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto">
          <div className="flex flex-col gap-2">
            
            <button
              onClick={() => handleNav('home')}
              className={`text-left px-4 py-3 rounded-xl text-sm font-black flex items-center justify-between ${
                activePage === 'home' ? 'bg-[#002869] text-white' : 'text-[#434652] hover:bg-[#f1f3ff]'
              }`}
            >
              <span>Home</span>
            </button>

            <button
              onClick={() => handleNav('how-it-works')}
              className={`text-left px-4 py-3 rounded-xl text-sm font-black flex items-center justify-between ${
                activePage === 'how-it-works' ? 'bg-[#002869] text-white' : 'text-[#434652] hover:bg-[#f1f3ff]'
              }`}
            >
              <span>How It Works</span>
              <span className="text-xs opacity-70">5-Step Journey</span>
            </button>

            <button
              onClick={() => handleNav('services')}
              className={`text-left px-4 py-3 rounded-xl text-sm font-black flex items-center justify-between ${
                activePage === 'services' ? 'bg-[#002869] text-white' : 'text-[#434652] hover:bg-[#f1f3ff]'
              }`}
            >
              <span>Services</span>
              <span className="text-xs opacity-70">Guidance & Tracks</span>
            </button>

            <button
              onClick={() => handleNav('programmes')}
              className={`text-left px-4 py-3 rounded-xl text-sm font-black flex items-center justify-between ${
                activePage === 'programmes' ? 'bg-[#002869] text-white' : 'text-[#434652] hover:bg-[#f1f3ff]'
              }`}
            >
              <span>Programmes</span>
              <span className="text-xs opacity-70">Cohorts & Tracks</span>
            </button>

            <div className="py-2 border-t border-gray-100 my-1 flex flex-col gap-1">
              <div className="text-[10px] font-black uppercase text-[#002869] tracking-wider px-4 mb-1">
                More Features
              </div>
              
              <button
                onClick={() => handleNav('webinars')}
                className={`text-left px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-between ${
                  activePage === 'webinars' ? 'bg-[#006e29] text-white' : 'text-[#061b3b] hover:bg-[#f1f3ff]'
                }`}
              >
                <div>
                  <span className="uppercase">Live Webinars</span>
                  <p className="text-[10px] font-normal opacity-80">Join mentor-led career webinars</p>
                </div>
                <Calendar className="w-3.5 h-3.5 text-[#006e29]" />
              </button>

              <button
                onClick={() => handleNav('career-check-in')}
                className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                  activePage === 'career-check-in' ? 'bg-[#002869] text-white' : 'text-[#434652] hover:bg-[#f1f3ff]'
                }`}
              >
                <span>Career Journey Navigator</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#dae2ff] text-[#001947]">Free</span>
              </button>

              <button
                onClick={() => handleNav('leadership')}
                className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold ${
                  activePage === 'leadership' ? 'bg-[#002869] text-white' : 'text-[#434652] hover:bg-[#f1f3ff]'
                }`}
              >
                Leadership & Mentors
              </button>

              <button
                onClick={() => handleNav('success-stories')}
                className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold ${
                  activePage === 'success-stories' ? 'bg-[#002869] text-white' : 'text-[#434652] hover:bg-[#f1f3ff]'
                }`}
              >
                Success Stories
              </button>

              <button
                onClick={() => handleNav('about-us')}
                className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold ${
                  activePage === 'about-us' ? 'bg-[#002869] text-white' : 'text-[#434652] hover:bg-[#f1f3ff]'
                }`}
              >
                About CareerBuddies
              </button>

              <button
                onClick={() => handleNav('contact')}
                className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold ${
                  activePage === 'contact' ? 'bg-[#002869] text-white' : 'text-[#434652] hover:bg-[#f1f3ff]'
                }`}
              >
                Contact Support Desk
              </button>
            </div>

            {/* Mobile Auth & User Dashboard Buttons */}
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <button
                id="mobile-nav-auth-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-3 bg-[#002869] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-[#79fd8d]" />
                <span>Login / Sign Up</span>
              </button>

              <button
                id="mobile-nav-dashboard-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenUserDashboard();
                }}
                className="w-full py-3 bg-[#dae2ff] text-[#002869] hover:bg-[#cbdaff] font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-2xs border border-[#cbdaff] cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#002869]" />
                <span>My Career Dashboard & Progress</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
