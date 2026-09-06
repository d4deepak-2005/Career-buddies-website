import React, { useState } from 'react';
import { 
  PageView, 
  Mentor, 
  BookedSession, 
  ServiceItem, 
  PlanItem, 
  ResourceArticle, 
  WebinarItem, 
  WebinarRegistration 
} from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CheckCircle2, XCircle, X as CloseIcon } from 'lucide-react';

// Screens
import { HomeScreen } from './components/screens/HomeScreen';
import { ServicesScreen } from './components/screens/ServicesScreen';
import { ProgrammesScreen } from './components/screens/ProgrammesScreen';
import { LeadershipScreen } from './components/screens/LeadershipScreen';
import { SuccessStoriesScreen } from './components/screens/SuccessStoriesScreen';
import { HowItWorksScreen } from './components/screens/HowItWorksScreen';
import { PlansScreen } from './components/screens/PlansScreen';
import { ResourcesScreen } from './components/screens/ResourcesScreen';
import { MentorsScreen } from './components/screens/MentorsScreen';
import { AboutUsScreen } from './components/screens/AboutUsScreen';
import { ContactScreen } from './components/screens/ContactScreen';
import { CounsellingScreen } from './components/screens/CounsellingScreen';
import { LeadsDashboardScreen } from './components/screens/LeadsDashboardScreen';
import { CareerCheckInScreen } from './components/screens/CareerCheckInScreen';
import { WebinarsScreen } from './components/screens/WebinarsScreen';
import { AdminScreen } from './components/screens/AdminScreen';
import { LeaderProfileScreen } from './components/screens/LeaderProfileScreen';
import { CandidateDashboardScreen } from './components/dashboard/CandidateDashboardScreen';

// Modals
import { SmartMatchingModal } from './components/modals/SmartMatchingModal';
import { BookingModal } from './components/modals/BookingModal';
import { MentorProfileModal } from './components/modals/MentorProfileModal';
import { BecomeMentorModal } from './components/modals/BecomeMentorModal';
import { AuthModal } from './components/modals/AuthModal';
import { UserDashboardDrawer } from './components/modals/UserDashboardDrawer';
import { CounsellingModal } from './components/modals/CounsellingModal';
import { ServiceDetailModal } from './components/modals/ServiceDetailModal';
import { ArticleReaderModal } from './components/modals/ArticleReaderModal';
import { WebinarDetailModal } from './components/modals/WebinarDetailModal';
import { WebinarCheckoutModal } from './components/modals/WebinarCheckoutModal';

export default function App() {
  // Navigation Page State
  const [activePage, setActivePage] = useState<PageView>('home');

  // Modals State
  const [isSmartMatchingOpen, setIsSmartMatchingOpen] = useState(false);
  const [isBecomeMentorOpen, setIsBecomeMentorOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);
  const [isCounsellingOpen, setIsCounsellingOpen] = useState(false);
  const [counsellingPlanInterest, setCounsellingPlanInterest] = useState<string>('Free 1:1 Strategic Diagnostic');
  const [checkoutPlanId, setCheckoutPlanId] = useState<'explore' | 'elevate' | null>(null);
  const [paymentReturnStatus, setPaymentReturnStatus] = useState<'success' | 'cancelled' | null>(null);

  // Webinar Modal State
  const [selectedWebinarForDetail, setSelectedWebinarForDetail] = useState<WebinarItem | null>(null);
  const [webinarToCheckout, setWebinarToCheckout] = useState<WebinarItem | null>(null);

  // Selected Entities for Modals
  const [bioMentor, setBioMentor] = useState<Mentor | null>(null);
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ResourceArticle | null>(null);

  // Booked Sessions State
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([
    {
      id: 'sess-init-1',
      mentorId: 'm1',
      mentorName: 'Elena Rostova',
      mentorTitle: 'Staff Software Engineer @ Google',
      mentorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      date: 'Tomorrow, Aug 28',
      timeSlot: '02:00 PM - 02:45 PM',
      topic: 'System Design & Promotion Leveling Diagnostic',
      notes: 'Reviewing distributed database architecture and promo document',
      status: 'confirmed',
      meetLink: 'https://meet.google.com/cb-demo-session',
      createdAt: new Date().toISOString()
    }
  ]);

  // Webinar Registrations state
  const [webinarRegistrations, setWebinarRegistrations] = useState<WebinarRegistration[]>([]);

  // Lead counter for navbar feedback
  const [leadCounter, setLeadCounter] = useState(0);

  // Selected Leader Profile for individual view
  const [selectedLeaderSlug, setSelectedLeaderSlug] = useState<string>('nishant-sharma');
  const [previousNavPage, setPreviousNavPage] = useState<PageView>('about-us');

  // Current Logged-in Candidate Email
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('rahul.sharma@techcorp.com');

  // Detect return from the Dodo Payments checkout (return_url / cancel_url)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success' || payment === 'cancelled') {
      setPaymentReturnStatus(payment);
      params.delete('payment');
      params.delete('plan');
      const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  // Handlers
  const handleSelectLeader = (slug: string) => {
    setPreviousNavPage(activePage);
    setSelectedLeaderSlug(slug);
    setActivePage('leader-profile');
  };

  const handleSelectMentorForBio = (mentor: Mentor) => {
    setBioMentor(mentor);
  };

  const handleBookMentor = (mentor: Mentor) => {
    setBookingMentor(mentor);
  };

  const handleConfirmBooking = (session: BookedSession) => {
    setBookedSessions(prev => [session, ...prev]);
  };

  const handleCancelSession = (id: string) => {
    setBookedSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleOpenLogin = () => {
    setAuthMode('login');
    setIsAuthOpen(true);
  };

  const handleOpenSignup = () => {
    setAuthMode('signup');
    setIsAuthOpen(true);
  };

  const handleOpenCounsellingWithPlan = (planName?: string) => {
    if (planName) {
      setCounsellingPlanInterest(planName);
    } else {
      setCounsellingPlanInterest('Free 1:1 Strategic Diagnostic');
    }
    setIsCounsellingOpen(true);
  };

  const handleSelectPlan = (plan: PlanItem) => {
    if (plan.isCustomPricing) {
      setCheckoutPlanId(null);
      handleOpenCounsellingWithPlan(`${plan.name} (Custom Profile Pricing)`);
    } else if (plan.id === 'explore' || plan.id === 'elevate') {
      setCheckoutPlanId(plan.id);
      handleOpenCounsellingWithPlan(`${plan.name} (${plan.priceINR})`);
    } else {
      setCheckoutPlanId(null);
      handleOpenCounsellingWithPlan(`${plan.name} Plan (${plan.priceINR})`);
    }
  };

  const handleSelectService = (service: ServiceItem) => {
    setSelectedService(service);
  };

  const handleSelectArticle = (article: ResourceArticle) => {
    setSelectedArticle(article);
  };

  const handleRegisterWebinar = (webinar: WebinarItem) => {
    setSelectedWebinarForDetail(null);
    setWebinarToCheckout(webinar);
  };

  const handleWebinarSuccess = (reg: WebinarRegistration) => {
    setWebinarRegistrations(prev => [reg, ...prev]);
    setLeadCounter(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#061b3b] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Header */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenLogin={handleOpenLogin}
        onOpenSignup={handleOpenSignup}
        onOpenUserDashboard={() => {
          setActivePage('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCounselling={(planTitle) => handleOpenCounsellingWithPlan(planTitle)}
        bookedCount={bookedSessions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        
        {/* 1. HOME SCREEN */}
        {activePage === 'home' && (
          <HomeScreen
            onSelectMentor={handleSelectMentorForBio}
            onBookMentor={handleBookMentor}
            onStartMatching={() => setIsSmartMatchingOpen(true)}
            onBecomeMentor={() => setIsBecomeMentorOpen(true)}
            onOpenCounselling={() => handleOpenCounsellingWithPlan()}
            onSelectService={handleSelectService}
            onSelectPlan={handleSelectPlan}
            setActivePage={setActivePage}
            onSelectLeader={handleSelectLeader}
          />
        )}

        {/* 2. PROGRAMMES SCREEN */}
        {activePage === 'programmes' && (
          <ProgrammesScreen
            onNavigate={setActivePage}
            onOpenCounselling={() => handleOpenCounsellingWithPlan('Specialised Programme Cohort')}
          />
        )}

        {/* 3. LEADERSHIP SCREEN */}
        {activePage === 'leadership' && (
          <LeadershipScreen
            onNavigate={setActivePage}
            onOpenCounselling={() => handleOpenCounsellingWithPlan('1:1 Guidance with Leadership Team')}
          />
        )}

        {/* 4. SUCCESS STORIES SCREEN */}
        {activePage === 'success-stories' && (
          <SuccessStoriesScreen
            onNavigate={setActivePage}
            onOpenCounselling={() => handleOpenCounsellingWithPlan('Success Story Diagnostic Review')}
          />
        )}

        {/* 5. WEBINARS SCREEN */}
        {activePage === 'webinars' && (
          <WebinarsScreen
            onSelectWebinar={(webinar) => setSelectedWebinarForDetail(webinar)}
            onRegisterWebinar={(webinar) => handleRegisterWebinar(webinar)}
            onOpenCounselling={() => handleOpenCounsellingWithPlan('Webinar Follow-up 1:1 Counselling')}
            setActivePage={setActivePage}
          />
        )}

        {/* 6. CAREER CHECK-IN SCREEN */}
        {activePage === 'career-check-in' && (
          <CareerCheckInScreen
            onNavigate={setActivePage}
            onOpenCounselling={(planName) => handleOpenCounsellingWithPlan(planName)}
          />
        )}

        {/* 7. SERVICES CATALOG SCREEN */}
        {activePage === 'services' && (
          <ServicesScreen
            onSelectService={handleSelectService}
            onOpenCounselling={(service) => {
              handleOpenCounsellingWithPlan(service ? `${service.title} Track` : undefined);
            }}
            onStartMatching={() => setIsSmartMatchingOpen(true)}
            setActivePage={setActivePage}
          />
        )}

        {/* 8. HOW IT WORKS SCREEN */}
        {activePage === 'how-it-works' && (
          <HowItWorksScreen
            onStartMatching={() => setIsSmartMatchingOpen(true)}
            onOpenCounselling={() => handleOpenCounsellingWithPlan()}
            onBecomeMentor={() => setIsBecomeMentorOpen(true)}
            setActivePage={setActivePage}
          />
        )}

        {/* 9. PLANS & PRICING SCREEN */}
        {activePage === 'plans' && (
          <PlansScreen
            onSelectPlan={handleSelectPlan}
            onOpenCounselling={() => handleOpenCounsellingWithPlan()}
            setActivePage={setActivePage}
          />
        )}

        {/* 10. RESOURCES & PLAYBOOKS SCREEN */}
        {activePage === 'resources' && (
          <ResourcesScreen
            onSelectArticle={handleSelectArticle}
            onOpenCounselling={() => handleOpenCounsellingWithPlan()}
            setActivePage={setActivePage}
          />
        )}

        {/* 11. EXPLORE MENTORS SCREEN */}
        {(activePage === 'features' || activePage === 'mentors') && (
          <MentorsScreen
            onSelectMentor={handleSelectMentorForBio}
            onBookMentor={handleBookMentor}
            onStartMatching={() => setIsSmartMatchingOpen(true)}
            setActivePage={setActivePage}
          />
        )}

        {/* 12. ABOUT US SCREEN */}
        {activePage === 'about-us' && (
          <AboutUsScreen
            setActivePage={setActivePage}
            onStartMatching={() => setIsSmartMatchingOpen(true)}
            onBecomeMentor={() => setIsBecomeMentorOpen(true)}
            onOpenCounselling={() => handleOpenCounsellingWithPlan()}
            onSelectLeader={handleSelectLeader}
          />
        )}

        {/* 13. CONTACT US SCREEN */}
        {activePage === 'contact' && (
          <ContactScreen 
            onLeadSubmitted={() => setLeadCounter(prev => prev + 1)} 
            setActivePage={setActivePage}
          />
        )}

        {/* 14. COUNSELLING DEDICATED SCREEN */}
        {activePage === 'counselling' && (
          <CounsellingScreen 
            onLeadSubmitted={() => setLeadCounter(prev => prev + 1)} 
            setActivePage={setActivePage}
          />
        )}

        {/* 15. ADMIN WORKSPACE */}
        {activePage === 'admin' && (
          <AdminScreen setActivePage={setActivePage} />
        )}

        {/* 16. LEADS DASHBOARD */}
        {activePage === 'leads-dashboard' && (
          <LeadsDashboardScreen setActivePage={setActivePage} />
        )}

        {/* 17. INDIVIDUAL LEADER PROFILE SCREEN */}
        {activePage === 'leader-profile' && (
          <LeaderProfileScreen
            slug={selectedLeaderSlug}
            onSelectLeader={handleSelectLeader}
            setActivePage={setActivePage}
            onOpenCounselling={() => handleOpenCounsellingWithPlan(`Consultation with Leadership Team`)}
            previousPage={previousNavPage}
          />
        )}

        {/* 18. CANDIDATE DASHBOARD SCREEN */}
        {activePage === 'dashboard' && (
          <CandidateDashboardScreen
            setActivePage={setActivePage}
            userEmail={currentUserEmail}
          />
        )}

      </main>

      {/* Footer */}
      <Footer
        setActivePage={setActivePage}
        onOpenContact={() => {
          setActivePage('contact');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSignup={handleOpenSignup}
        onOpenCounselling={() => handleOpenCounsellingWithPlan()}
      />

      {/* Free 1:1 Career Counselling Lead Capture Modal (also handles Explore/Elevate paid checkout redirect) */}
      <CounsellingModal
        isOpen={isCounsellingOpen}
        onClose={() => {
          setIsCounsellingOpen(false);
          setCheckoutPlanId(null);
        }}
        initialPlan={counsellingPlanInterest}
        checkoutPlanId={checkoutPlanId}
        onSuccess={() => {
          setLeadCounter(prev => prev + 1);
        }}
      />

      {/* Webinar Detail Modal */}
      <WebinarDetailModal
        isOpen={!!selectedWebinarForDetail}
        onClose={() => setSelectedWebinarForDetail(null)}
        webinar={selectedWebinarForDetail}
        onRegister={handleRegisterWebinar}
      />

      {/* Webinar Checkout Modal */}
      <WebinarCheckoutModal
        isOpen={!!webinarToCheckout}
        onClose={() => setWebinarToCheckout(null)}
        webinar={webinarToCheckout}
        onRegistrationSuccess={handleWebinarSuccess}
      />

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onBookService={(service) => {
          setSelectedService(null);
          handleOpenCounsellingWithPlan(`${service.title} Guidance`);
        }}
      />

      {/* Resource Article Reader Modal */}
      <ArticleReaderModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onBookCounselling={() => {
          setSelectedArticle(null);
          handleOpenCounsellingWithPlan('Playbook Follow-up Guidance');
        }}
      />

      {/* Mentor Profile / Bio Detail Modal */}
      <MentorProfileModal
        mentor={bioMentor}
        isOpen={!!bioMentor}
        onClose={() => setBioMentor(null)}
        onBookCall={(mentor) => {
          setBioMentor(null);
          setBookingMentor(mentor);
        }}
      />

      {/* Master Session Booking Modal */}
      <BookingModal
        mentor={bookingMentor}
        isOpen={!!bookingMentor}
        onClose={() => setBookingMentor(null)}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* AI/Rule-based Smart Matching Modal */}
      <SmartMatchingModal
        isOpen={isSmartMatchingOpen}
        onClose={() => setIsSmartMatchingOpen(false)}
        onSelectMentor={(mentor) => {
          setIsSmartMatchingOpen(false);
          setBioMentor(mentor);
        }}
        onBookMentor={(mentor) => {
          setIsSmartMatchingOpen(false);
          setBookingMentor(mentor);
        }}
      />

      {/* Become a Mentor Application Modal */}
      <BecomeMentorModal
        isOpen={isBecomeMentorOpen}
        onClose={() => setIsBecomeMentorOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(email) => {
          setCurrentUserEmail(email);
          setActivePage('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* User Dashboard & Bookings Drawer */}
      <UserDashboardDrawer
        isOpen={isUserDashboardOpen}
        onClose={() => setIsUserDashboardOpen(false)}
        sessions={bookedSessions}
        onCancelSession={handleCancelSession}
        onSelectMentor={handleSelectMentorForBio}
        onStartMatching={() => {
          setIsUserDashboardOpen(false);
          setIsSmartMatchingOpen(true);
        }}
      />

      {/* Payment Return Confirmation (Dodo Payments checkout redirect) */}
      {paymentReturnStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-[#cbdaff] flex flex-col items-center text-center gap-4 relative">
            <button
              onClick={() => setPaymentReturnStatus(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#747783] hover:bg-[#f1f3ff] cursor-pointer"
              aria-label="Close"
            >
              <CloseIcon className="w-4 h-4" />
            </button>

            {paymentReturnStatus === 'success' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-[#79fd8d]/20 text-[#006e29] flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-[#061b3b]">Payment Successful!</h3>
                <p className="text-sm text-[#434652] leading-relaxed">
                  Congratulations, your enrollment is confirmed. A confirmation email is on its way — our team will reach out shortly with your onboarding details.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <XCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-[#061b3b]">Payment Not Completed</h3>
                <p className="text-sm text-[#434652] leading-relaxed">
                  Your payment was cancelled or didn't go through. No amount has been charged. You can try again anytime from the Plans page.
                </p>
              </>
            )}

            <button
              onClick={() => setPaymentReturnStatus(null)}
              className="mt-2 px-6 py-2.5 bg-[#002869] text-white font-semibold text-xs rounded-xl hover:bg-[#0b3d91] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
