import React, { useState } from 'react';
import { PageView } from '../../types';
import { DEFAULT_SITE_CONFIG } from '../../config/siteConfig';
import { PageBottomNav } from '../common/PageBottomNav';
import { 
  User, 
  Sparkles, 
  Calendar, 
  FileText, 
  CreditCard, 
  Download, 
  CheckCircle2, 
  Video, 
  Headphones, 
  MessageSquare, 
  Bell, 
  Edit3, 
  Save, 
  Eye, 
  X, 
  Send, 
  Layers,
  ArrowRight,
  ShieldCheck,
  FolderDown,
  Printer,
  Lock,
  Globe,
  Settings,
  HelpCircle,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

interface CandidateDashboardScreenProps {
  setActivePage: (page: PageView) => void;
  userEmail?: string;
}

type DashboardTab = 
  | 'overview' 
  | 'profile' 
  | 'plan' 
  | 'payments' 
  | 'invoices' 
  | 'enquiries' 
  | 'webinars' 
  | 'sessions' 
  | 'learning' 
  | 'notifications' 
  | 'support'
  | 'settings';

export const CandidateDashboardScreen: React.FC<CandidateDashboardScreenProps> = ({
  setActivePage,
  userEmail = 'rahul.sharma@techcorp.com'
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  
  // Profile State
  const [candidateProfile, setCandidateProfile] = useState({
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: userEmail,
    mobile: '+91 98112 34567',
    alternateNumber: '+91 98223 99881',
    alternateEmail: 'rahul.personal@gmail.com',
    currentDesignation: 'Senior Software Engineer (L5)',
    currentCompany: 'FinTech Solutions Pvt Ltd',
    totalExperience: '6 Years (Senior Level)',
    targetRole: 'Staff Software Engineer / Engineering Lead',
    linkedinUrl: 'https://linkedin.com/in/rahul-sharma-dev',
    portfolioUrl: 'https://github.com/rahul-sharma',
    joinedDate: 'August 14, 2026',
    bio: 'Backend & distributed systems engineer looking to level up to Staff Engineer at high-scale tech firms.'
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ ...candidateProfile });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Selected Invoice Modal State
  const [viewingInvoice, setViewingInvoice] = useState<{
    id: string;
    date: string;
    item: string;
    amount: string;
    tax: string;
    total: string;
    paymentMode: string;
    status: string;
    invoiceNo: string;
    sacCode: string;
  } | null>(null);

  // Enquiry Submission State
  const [enquirySubject, setEnquirySubject] = useState('');
  const [enquiryCategory, setEnquiryCategory] = useState('Career Plan & Milestones');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  // Security / Settings State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Upcoming 1:1 Personalized Master Session',
      description: 'Scheduled with Vikramaditya Sen (Staff Architect @ Stripe) on Wednesday at 06:30 PM IST.',
      time: '2 hours ago',
      category: 'session',
      read: false
    },
    {
      id: 'notif-2',
      title: 'ATS Resume Overhaul Draft Ready for Review',
      description: 'Dedicated Profile Team has uploaded your Phase 1 optimized resume and GitHub story.',
      time: '1 day ago',
      category: 'profile',
      read: false
    },
    {
      id: 'notif-3',
      title: 'Tax Invoice Generated: INV-2026-8812',
      description: 'GST invoice for ₹14,999 (Career Transition & Switch Track) is available for download.',
      time: '2 days ago',
      category: 'billing',
      read: true
    },
    {
      id: 'notif-4',
      title: 'Upcoming Live Webinar Reminder (₹199 Pass)',
      description: 'High-Scale System Design Masterclass starts this Saturday at 05:00 PM IST.',
      time: '3 days ago',
      category: 'webinar',
      read: true
    }
  ]);

  // Enquiries List State
  const [enquiries, setEnquiries] = useState([
    {
      id: 'ENQ-8921',
      date: 'Aug 24, 2026',
      subject: 'Clarification regarding System Design Mock Schedule',
      category: 'Master Sessions',
      status: 'Resolved',
      advisor: 'Anand Verma (Senior Advisor)',
      response: 'Your mock session with Vikramaditya has been scheduled for Wednesday 6:30 PM IST. Join link is active in your dashboard.'
    },
    {
      id: 'ENQ-8890',
      date: 'Aug 18, 2026',
      subject: 'GST Invoice requirement for Corporate Reimbursement',
      category: 'Billing & Invoices',
      status: 'Resolved',
      advisor: 'Billing Operations Desk',
      response: 'Your tax invoice INV-2026-8812 contains full SAC Code 998311 with 18% GST itemized. You can download the PDF anytime.'
    }
  ]);

  // Registered & Upcoming Webinars
  const webinarsList = [
    {
      id: 'web-101',
      title: 'High-Scale System Design & Microservices Architecture',
      instructor: 'Vikramaditya Sen',
      role: 'Staff Architect @ Stripe (Ex-Google)',
      date: 'Saturday, Aug 30, 2026',
      time: '05:00 PM - 06:30 PM IST',
      status: 'Registered • Confirmed',
      price: '₹199 (Entry Pass Paid)',
      zoomLink: 'https://meet.google.com/cb-web-8821',
      description: '90-minute live masterclass breaking down real-world distributed architectures, rate limiting, and CAP theorem trade-offs.'
    },
    {
      id: 'web-102',
      title: 'Cracking Staff & Principal Engineer Behavioral & Leadership Loops',
      instructor: 'Priya Sundaram',
      role: 'VP of Engineering @ Swiggy',
      date: 'Sunday, Sep 07, 2026',
      time: '11:00 AM - 12:30 PM IST',
      status: 'Upcoming Open Webinar',
      price: '₹199 Entry Pass',
      zoomLink: 'https://meet.google.com/cb-web-9104',
      description: 'Frameworks to demonstrate technical leadership, cross-functional conflict resolution, and architectural vision.'
    }
  ];

  // Master Sessions Data
  const masterSessionsList = [
    {
      id: 'ms-1',
      title: 'Staff Architect Technical Assessment & System Deep-Dive',
      mentor: 'Vikramaditya Sen',
      mentorRole: 'Staff Architect @ Stripe (14+ Yrs Exp)',
      date: 'Wednesday, Sep 03, 2026',
      time: '06:30 PM - 07:30 PM IST',
      duration: '60 Minutes',
      status: 'Upcoming Confirmed',
      meetLink: 'https://meet.google.com/cb-mst-9942',
      agenda: 'Review of candidate distributed key-value store architecture design, caching patterns, and L6 leveling rubric.'
    },
    {
      id: 'ms-2',
      title: 'Career Diagnostic & Transition Roadmap Strategy',
      mentor: 'Aditya Kashyap',
      mentorRole: 'Engineering Manager @ Meta (Ex-Uber)',
      date: 'Aug 19, 2026',
      time: '07:00 PM - 08:00 PM IST',
      duration: '60 Minutes',
      status: 'Completed',
      meetLink: 'https://meet.google.com/cb-mst-8810',
      agenda: 'Gap analysis between Senior (L5) and Staff (L6) roles. Identified core areas: System Design depth & Org-wide impact narrative.'
    }
  ];

  // Documents & Learning Materials
  const documentsList = [
    {
      id: 'doc-1',
      title: 'CareerBuddies_ATS_Optimized_Resume_v2.pdf',
      category: 'ATS Profile Deliverable',
      size: '1.2 MB',
      date: 'Aug 22, 2026',
      type: 'Deliverable'
    },
    {
      id: 'doc-2',
      title: 'Staff_Level_System_Design_Architecture_Cheatsheet.pdf',
      category: 'Learning Resources',
      size: '3.8 MB',
      date: 'Aug 16, 2026',
      type: 'Notes'
    },
    {
      id: 'doc-3',
      title: 'Offer_Negotiation_&_ESOP_Benchmarking_Playbook.pdf',
      category: 'Career Guides',
      size: '2.1 MB',
      date: 'Aug 15, 2026',
      type: 'Playbook'
    },
    {
      id: 'doc-4',
      title: 'Distributed_Systems_Design_Masterclass_Deck.pdf',
      category: 'Webinar Slides',
      size: '5.4 MB',
      date: 'Aug 12, 2026',
      type: 'Notes'
    }
  ];

  // Payments List
  const paymentsList = [
    {
      id: 'pay_Nq98124Klm09',
      date: 'Aug 14, 2026',
      item: 'Career Transition & Switch Track (3 Months)',
      amount: '₹12,711.02',
      tax: '₹2,287.98 (18% GST)',
      total: '₹14,999',
      paymentMode: 'UPI (Google Pay / HDFC Bank)',
      status: 'Paid & Verified',
      invoiceNo: 'INV-2026-8812',
      sacCode: '998311 - Management & Career Consulting Services'
    },
    {
      id: 'pay_WebPass99812',
      date: 'Aug 10, 2026',
      item: 'Live System Design Masterclass (Entry Pass)',
      amount: '₹168.64',
      tax: '₹30.36 (18% GST)',
      total: '₹199',
      paymentMode: 'Credit Card (Visa)',
      status: 'Paid & Verified',
      invoiceNo: 'INV-2026-8740',
      sacCode: '998311 - Educational Workshop'
    }
  ];

  // Navigation Items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'plan', label: 'My Plan', icon: Sparkles },
    { id: 'payments', label: 'Payment History', icon: CreditCard },
    { id: 'invoices', label: 'Invoices & Bills', icon: FileText },
    { id: 'enquiries', label: 'Enquiry History', icon: MessageSquare },
    { id: 'webinars', label: 'Webinars', icon: Video },
    { id: 'sessions', label: 'Master Sessions', icon: Calendar },
    { id: 'learning', label: 'Learning Materials', icon: FolderDown },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.read).length },
    { id: 'support', label: 'Support & Concierge', icon: Headphones },
    { id: 'settings', label: 'Account Settings', icon: Lock }
  ];

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCandidateProfile({ ...editForm });
    setIsEditingProfile(false);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 4000);
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquirySubject.trim() || !enquiryMessage.trim()) return;

    const newEnq = {
      id: `ENQ-${Math.floor(1000 + Math.random() * 9000)}`,
      date: 'Just now',
      subject: enquirySubject,
      category: enquiryCategory,
      status: 'Under Review',
      advisor: 'CareerBuddies Advisor Support Desk',
      response: 'Your query has been assigned to Senior Advisor Anand Verma. You will receive an update shortly.'
    };

    setEnquiries([newEnq, ...enquiries]);
    setEnquirySubject('');
    setEnquiryMessage('');
    setEnquirySuccess(true);
    setTimeout(() => setEnquirySuccess(false), 4000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      setPasswordError('Please ensure all fields are filled and new passwords match.');
      setTimeout(() => setPasswordError(null), 4000);
      return;
    }
    setPasswordError(null);
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  const handleDownloadDoc = (docTitle: string) => {
    const element = document.createElement('a');
    const file = new Blob([`CareerBuddies Candidate Official Deliverable: ${docTitle}\nCandidate: ${candidateProfile.firstName} ${candidateProfile.lastName}\nEmail: ${candidateProfile.email}\nDate: ${new Date().toLocaleDateString()}\n\nOfficial CareerBuddies Record: Samhita Spicewood West Block, 6th Main, GM Palya, CV Raman Nagar, Bengaluru, Karnataka - 560075`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = docTitle;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col w-full bg-[#f9f9ff] min-h-screen text-[#061b3b]">
      
      {/* Top Header Banner */}
      <div className="bg-[#002869] text-white py-10 px-4 sm:px-6 lg:px-10 border-b border-[#001947]">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-black text-[#79fd8d] shrink-0 shadow-inner">
              {candidateProfile.firstName[0]}{candidateProfile.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#79fd8d]/20 text-[#79fd8d] text-[10px] font-black uppercase tracking-wider border border-[#79fd8d]/30">
                  Enrolled Candidate • Active
                </span>
                <span className="text-xs text-[#dae2ff] font-medium hidden sm:inline">
                  Member since {candidateProfile.joinedDate}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-['Plus_Jakarta_Sans',sans-serif]">
                Welcome back, {candidateProfile.firstName}!
              </h1>
              <p className="text-xs sm:text-sm text-[#dae2ff] mt-0.5">
                {candidateProfile.currentDesignation} • Target: <strong className="text-white">{candidateProfile.targetRole}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('sessions')}
              className="px-4 py-2.5 rounded-xl bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Next Master Session</span>
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Headphones className="w-4 h-4" />
              <span>Advisor Desk</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Container */}
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-6">
        
        {/* Navigation Tabs Bar - 12 Distinct Sections */}
        <div className="bg-white rounded-2xl p-2 border border-[#cbdaff] shadow-xs overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as DashboardTab)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#002869] text-white shadow-xs'
                    : 'text-[#434652] hover:bg-[#f1f3ff] hover:text-[#002869]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#79fd8d]' : 'text-[#747783]'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-black">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* SECTION A: DASHBOARD OVERVIEW */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Profile Completion */}
              <div className="bg-white rounded-2xl p-5 border border-[#cbdaff] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#747783] mb-2 font-bold">
                    <span>Profile Status</span>
                    <span className="text-[#006e29] font-black">85% Complete</span>
                  </div>
                  <h3 className="text-lg font-black text-[#061b3b]">ATS Profile Optimization</h3>
                  <div className="w-full bg-[#e0e8ff] h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-[#006e29] h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="mt-4 text-xs font-bold text-[#002869] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Complete Remaining 15%</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Current Active Plan */}
              <div className="bg-white rounded-2xl p-5 border border-[#cbdaff] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#747783] mb-2 font-bold">
                    <span>Enrolled Plan</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#dae2ff] text-[#001947] text-[10px] font-black">
                      3-Month Track
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#061b3b]">Career Transition & Switch</h3>
                  <p className="text-xs text-[#434652] mt-1">Dedicated profile team active</p>
                </div>
                <button
                  onClick={() => setActiveTab('plan')}
                  className="mt-4 text-xs font-bold text-[#002869] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Plan Milestones</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Payment Status */}
              <div className="bg-white rounded-2xl p-5 border border-[#cbdaff] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#747783] mb-2 font-bold">
                    <span>Payment Status</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#79fd8d]/30 text-[#00531d] text-[10px] font-black">
                      Paid & Verified
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#061b3b]">₹14,999 Total Paid</h3>
                  <p className="text-xs text-[#434652] mt-1">Invoice #INV-2026-8812</p>
                </div>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="mt-4 text-xs font-bold text-[#002869] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Tax Invoice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Next Session */}
              <div className="bg-white rounded-2xl p-5 border border-[#cbdaff] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#747783] mb-2 font-bold">
                    <span>Next Milestone</span>
                    <span className="text-[#002869] font-black">Wednesday</span>
                  </div>
                  <h3 className="text-lg font-black text-[#061b3b]">Personalized Master Session</h3>
                  <p className="text-xs text-[#434652] mt-1">with Staff Architect Vikramaditya</p>
                </div>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="mt-4 text-xs font-bold text-[#006e29] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Join Call Link & Agenda</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Main Overview Grid: Upcoming Activities + Plan Roadmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: 7-Stage Customer Journey Progress */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-[#cbdaff] shadow-xs flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                      Your 7-Stage Progression Blueprint
                    </h3>
                    <p className="text-xs text-[#434652]">
                      Transparent tracking of every phase in your CareerBuddies journey.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#e8f5e9] text-[#1b5e20] text-xs font-bold border border-[#a5d6a7]">
                    Stage 5 in Progress
                  </span>
                </div>

                <div className="flex flex-col gap-3.5 pt-2">
                  {[
                    { stage: 'Step 1', title: 'Live Mentor-Led Webinar (₹199 Entry)', desc: 'Attended 90-min High-Scale System Design masterclass.', status: 'completed' },
                    { stage: 'Step 2', title: 'Expressed Interest & Profile Diagnosis', desc: 'Diagnostic profile intake submitted to CareerBuddies advisors.', status: 'completed' },
                    { stage: 'Step 3', title: 'Advisor Requirements Discussion', desc: 'Consultation with Senior Advisor Anand Verma completed.', status: 'completed' },
                    { stage: 'Step 4', title: 'Plan Selection & Enrolment', desc: 'Enrolled in 3-Month Career Transition & Switch Track.', status: 'completed' },
                    { stage: 'Step 5', title: 'Dedicated Team Works on Profile', desc: 'ATS resume optimization, LinkedIn overhaul, and GitHub narrative in progress.', status: 'active' },
                    { stage: 'Step 6', title: 'Personalized Master Session', desc: 'Upcoming scheduled deep-dive with domain Staff Architect next week.', status: 'upcoming' },
                    { stage: 'Step 7', title: '90-Day Execution & Mock Interview Sprints', desc: 'Structured weekly milestones, mock loops, and salary negotiation support.', status: 'upcoming' }
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                        item.status === 'completed'
                          ? 'bg-[#f1f8e9] border-[#c8e6c9]'
                          : item.status === 'active'
                          ? 'bg-[#e8edff] border-[#002869] ring-1 ring-[#002869]/20'
                          : 'bg-[#f9f9ff] border-[#e0e8ff] opacity-70'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-[#006e29]" />
                        ) : item.status === 'active' ? (
                          <div className="w-5 h-5 rounded-full bg-[#002869] text-white text-xs font-black flex items-center justify-center animate-pulse">
                            {idx + 1}
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#e0e8ff] text-[#747783] text-xs font-black flex items-center justify-center">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-black text-[#061b3b]">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#747783]">
                            {item.stage}
                          </span>
                        </div>
                        <p className="text-xs text-[#434652] mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Important Upcoming Activities & Support Desk */}
              <div className="flex flex-col gap-6">
                
                {/* Upcoming Activity Box */}
                <div className="bg-white rounded-3xl p-6 border border-[#cbdaff] shadow-xs flex flex-col gap-4">
                  <h3 className="text-base font-black text-[#061b3b] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#002869]" />
                    <span>Important Activities</span>
                  </h3>

                  <div className="flex flex-col gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#f9f9ff] border border-[#e0e8ff]">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#002869] mb-1">
                        <span>Wednesday • 06:30 PM IST</span>
                        <span className="px-2 py-0.5 bg-[#79fd8d]/30 text-[#00531d] rounded-full text-[10px]">
                          Master Session
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#061b3b]">
                        Personalized Session with Vikramaditya Sen
                      </h4>
                      <p className="text-[11px] text-[#747783] mt-0.5">
                        Topic: Distributed Systems & Staff Level Rubrics
                      </p>
                      <a
                        href="https://meet.google.com/cb-mst-9942"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-black text-white bg-[#002869] hover:bg-[#0b3d91] px-3.5 py-1.5 rounded-xl transition-all"
                      >
                        <Video className="w-3.5 h-3.5 text-[#79fd8d]" />
                        <span>Join Video Room</span>
                      </a>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#f9f9ff] border border-[#e0e8ff]">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#006e29] mb-1">
                        <span>Thursday • 04:00 PM IST</span>
                        <span className="px-2 py-0.5 bg-[#dae2ff] text-[#001947] rounded-full text-[10px]">
                          Profile Overhaul
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#061b3b]">
                        LinkedIn Narrative & Pitch Deck Review
                      </h4>
                      <p className="text-[11px] text-[#747783] mt-0.5">
                        Delivered directly by Dedicated Profile Team
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assigned Career Advisor Card */}
                <div className="bg-[#f1f3ff] rounded-3xl p-6 border border-[#cbdaff] flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#002869] text-white flex items-center justify-center font-bold">
                      AV
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#061b3b]">Anand Verma</h4>
                      <p className="text-[11px] text-[#434652]">Senior Career Advisor • CareerBuddies</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#434652] leading-relaxed">
                    Have questions about your plan, resume iterations, or upcoming master session? Message your advisor directly.
                  </p>
                  <a
                    href={DEFAULT_SITE_CONFIG.whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Advisor ({DEFAULT_SITE_CONFIG.primaryWhatsApp})</span>
                  </a>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION B: MY PROFILE */}
        {/* ============================================================ */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-5">
              <div>
                <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Candidate Profile & Career Credentials
                </h3>
                <p className="text-xs sm:text-sm text-[#434652]">
                  Keep your work experience and target roles updated for the profile engineering team.
                </p>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="px-4 py-2 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingProfile ? 'Cancel Editing' : 'Edit Profile Information'}</span>
              </button>
            </div>

            {profileSaveSuccess && (
              <div className="p-4 bg-[#e8f5e9] border border-[#a5d6a7] text-[#1b5e20] text-xs font-bold rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Candidate profile updated successfully! The dedicated profile engineering team has been notified.</span>
              </div>
            )}

            {isEditingProfile ? (
              /* Editable Profile Form */
              <form onSubmit={handleProfileSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#061b3b] mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#061b3b] mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#061b3b] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#061b3b] mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#434652] mb-1">Alternate Number (Optional)</label>
                  <input
                    type="tel"
                    value={editForm.alternateNumber}
                    onChange={(e) => setEditForm({ ...editForm, alternateNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#434652] mb-1">Alternate Email ID (Optional)</label>
                  <input
                    type="email"
                    value={editForm.alternateEmail}
                    onChange={(e) => setEditForm({ ...editForm, alternateEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#061b3b] mb-1">Current Designation *</label>
                  <input
                    type="text"
                    required
                    value={editForm.currentDesignation}
                    onChange={(e) => setEditForm({ ...editForm, currentDesignation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#061b3b] mb-1">Total Work Experience *</label>
                  <input
                    type="text"
                    required
                    value={editForm.totalExperience}
                    onChange={(e) => setEditForm({ ...editForm, totalExperience: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#434652] mb-1">LinkedIn Profile Link (Optional)</label>
                  <input
                    type="url"
                    value={editForm.linkedinUrl}
                    onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#434652] mb-1">Portfolio / GitHub (Optional)</label>
                  <input
                    type="url"
                    value={editForm.portfolioUrl}
                    onChange={(e) => setEditForm({ ...editForm, portfolioUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-[#061b3b] mb-1">Additional Information / Target Goal</label>
                  <textarea
                    rows={3}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3 pt-3 border-t border-[#cbdaff]">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-5 py-2.5 border border-[#cbdaff] text-xs font-bold rounded-xl text-[#434652] hover:bg-[#f1f3ff] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Update Profile</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Static Profile Details Display */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff]">
                  <span className="text-[#747783] block text-[11px] font-semibold">Full Name</span>
                  <strong className="text-sm font-black text-[#061b3b] block mt-0.5">
                    {candidateProfile.firstName} {candidateProfile.lastName}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff]">
                  <span className="text-[#747783] block text-[11px] font-semibold">Registered Email Address</span>
                  <strong className="text-xs font-bold text-[#002869] block mt-0.5 break-all">
                    {candidateProfile.email}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff]">
                  <span className="text-[#747783] block text-[11px] font-semibold">Primary Contact Mobile</span>
                  <strong className="text-xs font-bold text-[#061b3b] block mt-0.5">
                    {candidateProfile.mobile}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff]">
                  <span className="text-[#747783] block text-[11px] font-semibold">Alternate Mobile Number</span>
                  <span className="text-xs font-medium text-[#434652] block mt-0.5">
                    {candidateProfile.alternateNumber || 'Not Provided'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff]">
                  <span className="text-[#747783] block text-[11px] font-semibold">Alternate Email ID</span>
                  <span className="text-xs font-medium text-[#434652] block mt-0.5 break-all">
                    {candidateProfile.alternateEmail || 'Not Provided'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff]">
                  <span className="text-[#747783] block text-[11px] font-semibold">Current Role & Level</span>
                  <strong className="text-xs font-bold text-[#061b3b] block mt-0.5">
                    {candidateProfile.currentDesignation}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff]">
                  <span className="text-[#747783] block text-[11px] font-semibold">Total Work Experience</span>
                  <strong className="text-xs font-bold text-[#061b3b] block mt-0.5">
                    {candidateProfile.totalExperience}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff]">
                  <span className="text-[#747783] block text-[11px] font-semibold">LinkedIn Profile URL</span>
                  <a
                    href={candidateProfile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#002869] hover:underline block mt-0.5 truncate"
                  >
                    {candidateProfile.linkedinUrl}
                  </a>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff]">
                  <span className="text-[#747783] block text-[11px] font-semibold">Portfolio / Code Repositories</span>
                  <a
                    href={candidateProfile.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#002869] hover:underline block mt-0.5 truncate"
                  >
                    {candidateProfile.portfolioUrl}
                  </a>
                </div>

                <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff] md:col-span-2 lg:col-span-3">
                  <span className="text-[#747783] block text-[11px] font-semibold">Candidate Target Narrative & Bio</span>
                  <p className="text-xs text-[#434652] mt-1 leading-relaxed">
                    {candidateProfile.bio}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION C: MY PLAN */}
        {/* ============================================================ */}
        {activeTab === 'plan' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-5">
              <div>
                <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Enrolled Programme & Execution Plan
                </h3>
                <p className="text-xs sm:text-sm text-[#434652]">
                  Comprehensive scope of your active CareerBuddies plan, deliverables, and progress.
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-[#79fd8d]/30 text-[#00531d] text-xs font-black">
                Active • 3-Month Plan
              </span>
            </div>

            {/* Plan Highlight Card */}
            <div className="p-6 rounded-3xl bg-[#002869] text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#79fd8d]">
                  Selected Programme Track
                </span>
                <h4 className="text-2xl font-black mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
                  Career Transition & Switch Track
                </h4>
                <p className="text-xs sm:text-sm text-[#dae2ff] mt-1 max-w-xl">
                  Intensive 3-month roadmap for senior engineers switching tech stacks or transitioning into Staff Architect roles at top-tier product firms.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0">
                <span className="text-xs text-[#dae2ff] block">Total Investment</span>
                <span className="text-2xl font-black text-white block">₹14,999</span>
                <span className="text-[10px] text-[#79fd8d] font-bold">Paid & Fully Verified</span>
              </div>
            </div>

            {/* Included Services Breakdown */}
            <div>
              <h4 className="text-base font-black text-[#061b3b] mb-3">
                Included Services & Plan Deliverables
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'ATS Resume Overhaul', desc: 'Custom rewritten resume tuned for Tier-1 ATS algorithms.', status: 'In Progress (v2)' },
                  { title: 'LinkedIn Executive Story', desc: 'Headline, About section, and featured achievements rewrite.', status: 'Delivered' },
                  { title: 'Personalized Master Sessions', desc: '1:1 technical deep dives with Staff & Principal Architects.', status: '1 of 2 Completed' },
                  { title: 'System Design Architecture Review', desc: 'Mock architectural sprint tailored to high-scale backends.', status: 'Scheduled' },
                  { title: 'Dedicated Advisor Channel', desc: 'Continuous WhatsApp guidance with Senior Advisor Anand Verma.', status: 'Active 24/7' },
                  { title: 'Offer & Compensation Strategy', desc: 'Benchmarking and salary negotiation framework.', status: 'Final Month' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-[#061b3b]">{item.title}</span>
                        <CheckCircle2 className="w-4 h-4 text-[#006e29]" />
                      </div>
                      <p className="text-xs text-[#434652]">{item.desc}</p>
                    </div>
                    <span className="mt-3 text-[11px] font-bold text-[#002869] bg-[#e8edff] px-2.5 py-1 rounded-lg w-fit">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Milestones */}
            <div className="p-5 rounded-2xl bg-[#f1f8e9] border border-[#c8e6c9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h5 className="text-xs font-black uppercase text-[#006e29] tracking-wider">
                  Important Immediate Next Steps
                </h5>
                <p className="text-xs font-bold text-[#061b3b] mt-1">
                  1. Review Phase 1 ATS Resume draft by Thursday 4 PM.
                </p>
                <p className="text-xs text-[#434652]">
                  2. Attend 1:1 Master Session with Vikramaditya Sen on Wednesday.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('support')}
                className="px-4 py-2.5 bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-black rounded-xl shrink-0 cursor-pointer shadow-xs"
              >
                Discuss with Advisor
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION D: PAYMENT HISTORY */}
        {/* ============================================================ */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-5">
              <div>
                <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Payment History & Transaction Records
                </h3>
                <p className="text-xs sm:text-sm text-[#434652]">
                  Detailed ledger of all verified candidate payments, webinars, and transaction reference IDs.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#cbdaff] text-[#747783] font-bold uppercase tracking-wider bg-[#f1f3ff]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Transaction Ref</th>
                    <th className="py-3 px-4">Programme / Item</th>
                    <th className="py-3 px-4">Taxable</th>
                    <th className="py-3 px-4">GST (18%)</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e8ff]">
                  {paymentsList.map((pay) => (
                    <tr key={pay.id} className="hover:bg-[#f9f9ff]">
                      <td className="py-3.5 px-4 font-medium text-[#061b3b]">{pay.date}</td>
                      <td className="py-3.5 px-4 font-mono text-[#002869] font-bold">{pay.id}</td>
                      <td className="py-3.5 px-4 font-bold text-[#061b3b]">{pay.item}</td>
                      <td className="py-3.5 px-4 text-[#434652]">{pay.amount}</td>
                      <td className="py-3.5 px-4 text-[#006e29]">{pay.tax}</td>
                      <td className="py-3.5 px-4 font-black text-[#061b3b] text-sm">{pay.total}</td>
                      <td className="py-3.5 px-4 text-[#434652]">{pay.paymentMode}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#79fd8d]/30 text-[#00531d] font-bold text-[10px]">
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION E: INVOICES AND BILLS */}
        {/* ============================================================ */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-5">
              <div>
                <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Tax Invoices & Bills
                </h3>
                <p className="text-xs sm:text-sm text-[#434652]">
                  Download GST-compliant tax invoices with SAC codes for corporate reimbursements or personal records.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {paymentsList.map((inv) => (
                <div key={inv.invoiceNo} className="p-5 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-black text-xs text-[#002869]">{inv.invoiceNo}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#e0e8ff] text-[#001947] rounded-full font-bold">
                        SAC {inv.sacCode.split(' - ')[0]}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#061b3b]">{inv.item}</h4>
                    <p className="text-xs text-[#747783] mt-0.5">
                      Issued on {inv.date} • Total: <strong className="text-[#061b3b]">{inv.total}</strong> (Includes {inv.tax})
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => setViewingInvoice(inv)}
                      className="px-4 py-2 bg-white border border-[#cbdaff] text-[#002869] text-xs font-bold rounded-xl hover:bg-[#dae2ff] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Invoice</span>
                    </button>
                    <button
                      onClick={() => handleDownloadDoc(`Invoice_${inv.invoiceNo}.pdf`)}
                      className="px-4 py-2 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION F: ENQUIRY HISTORY */}
        {/* ============================================================ */}
        {activeTab === 'enquiries' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-5">
              <div>
                <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Enquiry History & Ticket Support
                </h3>
                <p className="text-xs sm:text-sm text-[#434652]">
                  Track previous enquiries, roadmap queries, and advisor recommendations.
                </p>
              </div>
            </div>

            {/* Submit New Query Box */}
            <form onSubmit={handleEnquirySubmit} className="p-5 rounded-2xl bg-[#f1f3ff] border border-[#cbdaff] flex flex-col gap-3.5">
              <h4 className="text-xs font-black uppercase text-[#002869] tracking-wider">
                Submit New Enquiry / Ticket to Career Advisor
              </h4>

              {enquirySuccess && (
                <div className="p-3 bg-[#e8f5e9] border border-[#a5d6a7] text-[#1b5e20] text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Enquiry ticket created! An advisor will reply within 2 hours.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#061b3b] mb-1">Subject / Question *</label>
                  <input
                    type="text"
                    required
                    value={enquirySubject}
                    onChange={(e) => setEnquirySubject(e.target.value)}
                    placeholder="e.g. Question on System Design Mock Scheduling"
                    className="w-full px-3.5 py-2 bg-white border border-[#cbdaff] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#061b3b] mb-1">Category *</label>
                  <select
                    value={enquiryCategory}
                    onChange={(e) => setEnquiryCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#cbdaff] rounded-xl text-xs cursor-pointer"
                  >
                    <option value="Career Plan & Milestones">Career Plan & Milestones</option>
                    <option value="Profile Engineering">Profile Engineering</option>
                    <option value="Master Session Scheduling">Master Session Scheduling</option>
                    <option value="Billing & Invoices">Billing & Invoices</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#061b3b] mb-1">Detailed Message *</label>
                <textarea
                  rows={2}
                  required
                  value={enquiryMessage}
                  onChange={(e) => setEnquiryMessage(e.target.value)}
                  placeholder="Provide context on your question..."
                  className="w-full px-3.5 py-2 bg-white border border-[#cbdaff] rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Ticket to Advisor</span>
                </button>
              </div>
            </form>

            {/* Enquiries Log */}
            <div className="flex flex-col gap-3.5">
              {enquiries.map((enq) => (
                <div key={enq.id} className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#002869]">{enq.id}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#dae2ff] text-[#001947] rounded-full font-bold">
                        {enq.category}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      enq.status === 'Resolved' ? 'bg-[#79fd8d]/30 text-[#00531d]' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {enq.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[#061b3b]">{enq.subject}</h4>
                  <p className="text-[11px] text-[#434652] bg-white p-2.5 rounded-xl border border-[#e0e8ff]">
                    <strong>{enq.advisor}:</strong> {enq.response}
                  </p>
                  <span className="text-[10px] text-[#747783]">{enq.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION G: WEBINARS */}
        {/* ============================================================ */}
        {activeTab === 'webinars' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-5">
              <div>
                <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Webinars & Live Masterclasses
                </h3>
                <p className="text-xs sm:text-sm text-[#434652]">
                  Access your registered ₹199 live webinars, view schedule details, and join links.
                </p>
              </div>
              <button
                onClick={() => setActivePage('webinars')}
                className="px-4 py-2 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Browse All Webinars</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {webinarsList.map((web) => (
                <div key={web.id} className="p-6 rounded-3xl bg-[#f9f9ff] border border-[#cbdaff] flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#79fd8d]/30 text-[#00531d] text-[10px] font-black">
                        {web.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#002869]">
                        {web.price}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-[#061b3b]">
                      {web.title}
                    </h4>
                    <p className="text-xs text-[#002869] font-bold mt-1">
                      Instructor: {web.instructor} ({web.role})
                    </p>
                    <p className="text-xs text-[#434652] mt-2 leading-relaxed">
                      {web.description}
                    </p>

                    <div className="mt-3 p-3 bg-white rounded-xl border border-[#e0e8ff] text-xs">
                      <div className="flex items-center gap-2 text-[#061b3b] font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[#002869]" />
                        <span>{web.date}</span>
                      </div>
                      <div className="text-[#747783] text-[11px] mt-0.5">
                        {web.time}
                      </div>
                    </div>
                  </div>

                  <a
                    href={web.zoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black text-center shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Video className="w-4 h-4 text-[#79fd8d]" />
                    <span>Join Live Webinar Room</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION H: MASTER SESSIONS */}
        {/* ============================================================ */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-5">
              <div>
                <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Personalized Master Sessions
                </h3>
                <p className="text-xs sm:text-sm text-[#434652]">
                  1:1 Technical & Architectural Deep-Dives with Verified Industry Practitioners.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {masterSessionsList.map((sess) => (
                <div key={sess.id} className="p-6 rounded-3xl bg-[#f9f9ff] border border-[#cbdaff] flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        sess.status.includes('Upcoming') 
                          ? 'bg-[#79fd8d]/30 text-[#00531d]' 
                          : 'bg-[#e0e8ff] text-[#001947]'
                      }`}>
                        {sess.status}
                      </span>
                      <span className="text-xs font-bold text-[#747783]">{sess.duration}</span>
                    </div>

                    <h4 className="text-base font-black text-[#061b3b]">
                      {sess.title}
                    </h4>

                    <div className="mt-2 p-3 bg-white rounded-2xl border border-[#cbdaff]">
                      <span className="text-[10px] font-black uppercase text-[#747783] tracking-wider block">
                        Assigned Mentor
                      </span>
                      <strong className="text-xs font-black text-[#002869] block mt-0.5">
                        {sess.mentor}
                      </strong>
                      <span className="text-[11px] text-[#434652] block">
                        {sess.mentorRole}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-[#434652]">
                      <strong className="text-[#061b3b] block mb-0.5">Session Agenda:</strong>
                      <p className="text-xs leading-relaxed">{sess.agenda}</p>
                    </div>

                    <div className="mt-3 p-2.5 rounded-xl bg-[#e8edff] text-xs font-bold text-[#002869] flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#002869]" />
                      <span>{sess.date} • {sess.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {sess.status.includes('Upcoming') ? (
                      <a
                        href={sess.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-3 bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-black rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Video className="w-4 h-4 text-[#79fd8d]" />
                        <span>Launch Video Room</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => handleDownloadDoc(`Master_Session_Notes_${sess.id}.pdf`)}
                        className="flex-1 py-3 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Session Debrief</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION I: LEARNING MATERIALS */}
        {/* ============================================================ */}
        {activeTab === 'learning' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-5">
              <div>
                <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Learning Materials & Downloadable Notes
                </h3>
                <p className="text-xs sm:text-sm text-[#434652]">
                  Access all profile engineering deliverables, masterclass slide decks, and interview cheat sheets.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {documentsList.map((doc) => (
                <div key={doc.id} className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#002869] text-white flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-[#79fd8d]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#061b3b] truncate max-w-[220px] sm:max-w-xs">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-[#747783]">
                        {doc.category} • {doc.size} • {doc.date}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadDoc(doc.title)}
                    className="px-3.5 py-2 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION J: NOTIFICATIONS */}
        {/* ============================================================ */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-5">
              <div>
                <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Candidate Notifications & Programme Updates
                </h3>
                <p className="text-xs sm:text-sm text-[#434652]">
                  Stay updated on session reminders, profile deliverables, and invoice releases.
                </p>
              </div>
              <button
                onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                className="text-xs font-bold text-[#002869] hover:underline cursor-pointer"
              >
                Mark all as read
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-3.5 transition-all ${
                    !notif.read ? 'bg-[#e8edff] border-[#002869]/40 font-semibold' : 'bg-[#f9f9ff] border-[#e0e8ff]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-xl bg-white border border-[#cbdaff] text-[#002869]">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#061b3b]">{notif.title}</h4>
                      <p className="text-xs text-[#434652] mt-0.5">{notif.description}</p>
                      <span className="text-[10px] text-[#747783] block mt-1">{notif.time}</span>
                    </div>
                  </div>

                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-[#002869] shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION K: SUPPORT */}
        {/* ============================================================ */}
        {activeTab === 'support' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-5">
              <div>
                <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Candidate Support & Advisor Helpdesk
                </h3>
                <p className="text-xs sm:text-sm text-[#434652]">
                  Direct priority communication channels for enrolled CareerBuddies candidates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* WhatsApp Priority Support */}
              <div className="p-6 rounded-3xl bg-[#f1f8e9] border border-[#c8e6c9] flex flex-col justify-between gap-4">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#006e29] text-white flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-[#061b3b]">Instant WhatsApp Advisor Desk</h4>
                  <p className="text-xs text-[#434652] mt-1 leading-relaxed">
                    Connect directly with your dedicated advisor for real-time questions regarding session rescheduling, resume feedback, and interview schedules.
                  </p>
                </div>
                <a
                  href={DEFAULT_SITE_CONFIG.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-black text-center shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp: {DEFAULT_SITE_CONFIG.primaryWhatsApp}</span>
                </a>
              </div>

              {/* Email Support */}
              <div className="p-6 rounded-3xl bg-[#e8edff] border border-[#cbdaff] flex flex-col justify-between gap-4">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#002869] text-white flex items-center justify-center mb-3">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-[#061b3b]">Official Email Support Desk</h4>
                  <p className="text-xs text-[#434652] mt-1 leading-relaxed">
                    Send detailed documents, recruiter correspondence, or enterprise reimbursement invoice queries.
                  </p>
                </div>
                <a
                  href={`mailto:${DEFAULT_SITE_CONFIG.supportEmail}`}
                  className="w-full py-3 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black text-center shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Email: {DEFAULT_SITE_CONFIG.supportEmail}</span>
                </a>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION L: ACCOUNT SETTINGS */}
        {/* ============================================================ */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#cbdaff] shadow-xs flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-5">
              <div>
                <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  Account Settings & Security Preferences
                </h3>
                <p className="text-xs sm:text-sm text-[#434652]">
                  Manage authentication credentials, notification channels, and privacy preferences.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Password & Authentication */}
              <div className="p-6 rounded-3xl bg-[#f9f9ff] border border-[#cbdaff] flex flex-col gap-4">
                <h4 className="text-base font-black text-[#061b3b] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#002869]" />
                  <span>Update Password</span>
                </h4>

                {passwordSuccess && (
                  <div className="p-3 bg-[#e8f5e9] border border-[#a5d6a7] text-[#1b5e20] text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Password updated successfully!</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#061b3b] mb-1">Current Password *</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 bg-white border border-[#cbdaff] rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#061b3b] mb-1">New Password *</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 bg-white border border-[#cbdaff] rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#061b3b] mb-1">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 bg-white border border-[#cbdaff] rounded-xl text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-2 py-2.5 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer"
                  >
                    Save New Password
                  </button>
                </form>
              </div>

              {/* Notification Preferences & 2FA */}
              <div className="p-6 rounded-3xl bg-[#f9f9ff] border border-[#cbdaff] flex flex-col justify-between gap-5">
                <div>
                  <h4 className="text-base font-black text-[#061b3b] flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-[#006e29]" />
                    <span>Security & Notification Alerts</span>
                  </h4>

                  <div className="flex flex-col gap-4 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#e0e8ff]">
                      <div>
                        <strong className="text-[#061b3b] block">WhatsApp Session Reminders</strong>
                        <span className="text-[#747783] text-[11px]">Receive 1-hour session alerts on WhatsApp</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={whatsappAlerts}
                        onChange={(e) => setWhatsappAlerts(e.target.checked)}
                        className="w-4 h-4 text-[#006e29] rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#e0e8ff]">
                      <div>
                        <strong className="text-[#061b3b] block">Email Invoice & Deliverable Updates</strong>
                        <span className="text-[#747783] text-[11px]">PDF copies sent to your email address</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailAlerts}
                        onChange={(e) => setEmailAlerts(e.target.checked)}
                        className="w-4 h-4 text-[#006e29] rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#e0e8ff]">
                      <div>
                        <strong className="text-[#061b3b] block">Two-Factor Authentication (2FA)</strong>
                        <span className="text-[#747783] text-[11px]">SMS OTP verification on candidate login</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={twoFactorEnabled}
                        onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                        className="w-4 h-4 text-[#006e29] rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#e8edff] rounded-2xl border border-[#cbdaff] text-xs text-[#002869]">
                  <strong>Official Registered Entity:</strong> CareerBuddies Private Limited. All profile data is encrypted under IT Act, 2000 guidelines.
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Invoice Viewer Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#cbdaff] shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#cbdaff] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#006e29] tracking-wider">
                  Official GST Tax Invoice
                </span>
                <h3 className="text-xl font-black text-[#002869] font-['Plus_Jakarta_Sans',sans-serif]">
                  {viewingInvoice.invoiceNo}
                </h3>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Printable Invoice Header */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <strong className="text-[#061b3b] block font-bold">Billed By:</strong>
                <span className="text-[#434652] block font-semibold">CareerBuddies Private Limited</span>
                <span className="text-[#747783] block">{DEFAULT_SITE_CONFIG.officeAddress}</span>
                <span className="text-[#747783] block">Email: {DEFAULT_SITE_CONFIG.supportEmail}</span>
              </div>
              <div className="text-right">
                <strong className="text-[#061b3b] block font-bold">Billed To:</strong>
                <span className="text-[#434652] block font-semibold">{candidateProfile.firstName} {candidateProfile.lastName}</span>
                <span className="text-[#747783] block">{candidateProfile.email}</span>
                <span className="text-[#747783] block">{candidateProfile.mobile}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-[#cbdaff] rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#f1f3ff] text-[#002869] font-bold border-b border-[#cbdaff]">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3">SAC Code</th>
                    <th className="p-3 text-right">Taxable</th>
                    <th className="p-3 text-right">GST (18%)</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 font-bold text-[#061b3b]">{viewingInvoice.item}</td>
                    <td className="p-3 font-mono text-[#747783]">{viewingInvoice.sacCode.split(' - ')[0]}</td>
                    <td className="p-3 text-right font-medium">{viewingInvoice.amount}</td>
                    <td className="p-3 text-right text-[#006e29]">{viewingInvoice.tax}</td>
                    <td className="p-3 text-right font-black text-[#002869]">{viewingInvoice.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#cbdaff]">
              <span className="text-xs text-[#747783]">
                Payment Status: <strong className="text-[#006e29]">Paid via {viewingInvoice.paymentMode}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white border border-[#cbdaff] text-xs font-bold rounded-xl text-[#002869] flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => handleDownloadDoc(`Invoice_${viewingInvoice.invoiceNo}.pdf`)}
                  className="px-5 py-2 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <PageBottomNav
        currentPage="dashboard"
        onNavigate={setActivePage}
      />
    </div>
  );
};

export default CandidateDashboardScreen;
