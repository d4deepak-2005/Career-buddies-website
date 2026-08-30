export type PageView = 
  | 'home' 
  | 'about-us'
  | 'how-it-works' // Our Journey
  | 'services' 
  | 'programmes'
  | 'webinars' 
  | 'leadership'
  | 'leader-profile'
  | 'success-stories'
  | 'career-check-in' 
  | 'mentors'
  | 'features' // alias for mentors
  | 'plans' 
  | 'resources' 
  | 'contact' 
  | 'counselling'
  | 'dashboard'
  | 'login'
  | 'signup'
  | 'admin'
  | 'leads-dashboard';

export type Category = 
  | 'All'
  | 'Engineering'
  | 'Product'
  | 'Design'
  | 'Data & AI'
  | 'Marketing & Growth'
  | 'Leadership';

export interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  companyColor?: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  sessionsCompleted: number;
  hourlyRate: number;
  experienceYears: number;
  category: Category;
  bio: string;
  longBio: string;
  topics: string[];
  skills: string[];
  verified: boolean;
  featured?: boolean;
  superMentor?: boolean;
  availableNext: string;
  pastCompanies?: string[];
  reviews?: {
    id: string;
    author: string;
    role: string;
    rating: number;
    date: string;
    comment: string;
  }[];
}

export interface ServiceItem {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  iconName: string;
  duration: string;
  deliverables: string[];
  idealFor: string[];
  keyOutcome: string;
  badge?: string;
  popular?: boolean;
}

export interface ProgrammeItem {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  duration: string;
  feeINR: number;
  originalFeeINR?: number;
  mentorName: string;
  mentorRole: string;
  mentorCompany: string;
  mentorAvatar: string;
  availability: string;
  cohortStartDate: string;
  highlights: string[];
  curriculum: {
    week: string;
    topic: string;
    description: string;
  }[];
  badge?: string;
  enrolledCount: number;
  capacity: number;
  isPopular?: boolean;
}

export interface CareerStageOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  badge: string;
  recommendedServices: string[];
  recommendedProgrammeId?: string;
  recommendedWebinarId?: string;
  actionCta: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  previousRole: string;
  previousCompany: string;
  avatar: string;
  story: string;
  outcomeMetric: string;
  outcomeType: 'transition' | 'promotion' | 'clarity' | 'hike';
  rating: number;
  mentorName: string;
  serviceUsed: string;
}

export interface LeadNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  serialNumber: number;
  createdAt: string;
  timestampIST: string;
  firstName: string;
  lastName: string;
  fullName: string;
  mobile: string;
  email: string;
  currentRole: string;
  experience: string;
  industry: string;
  requirement: string;
  planInterest?: string;
  source: string;
  status: 'new' | 'contacted' | 'scheduled' | 'converted';
  notes?: LeadNote[];
  sheetSynced?: boolean;
  whatsAppNotified?: boolean;
}

export interface BookedSession {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorTitle: string;
  mentorAvatar: string;
  date: string;
  timeSlot: string;
  topic: string;
  notes?: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  meetLink: string;
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'mentees' | 'mentors' | 'billing' | 'webinars' | 'programmes';
}

export interface FounderInfo {
  id?: string;
  name: string;
  role: string;
  title?: string;
  email: string;
  bio: string;
  avatar: string;
  contribution: string;
  experienceYears?: number;
  expertise: string[];
  careerHighlights?: string[];
  areasOfGuidance?: string[];
  linkedIn?: string;
}

export interface JourneyMilestone {
  year: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
}

export interface WebinarItem {
  id: string;
  title: string;
  tagline: string;
  category: string;
  speaker: {
    name: string;
    role: string;
    company: string;
    avatar: string;
    bio: string;
  };
  date: string;
  time: string;
  duration: string;
  description: string;
  whatYouWillLearn: string[];
  targetAudience: string[];
  priceINR: number;
  originalPriceINR?: number;
  capacity: number;
  registeredCount: number;
  status: 'upcoming' | 'filling_fast' | 'housefull' | 'completed';
  recordingIncluded: boolean;
  certificateProvided: boolean;
  badge?: string;
}

export interface WebinarRegistration {
  id: string;
  webinarId: string;
  webinarTitle: string;
  registeredAt: string;
  timestampIST: string;
  fullName: string;
  email: string;
  mobile: string;
  currentRole: string;
  experience: string;
  questionForSpeaker?: string;
  amountPaidINR: number;
  paymentId: string;
  paymentStatus: 'success' | 'pending' | 'failed';
  meetLink: string;
}

export interface CareerCheckInState {
  currentStage: string;
  careerDirection: string;
  primaryChallenge: string;
  desiredSupport: string;
  fullName?: string;
  email?: string;
  mobile?: string;
}

export interface SiteConfig {
  companyName: string;
  brandTagline: string;
  logoUrl: string;
  heroImageUrl: string;
  webinarDefaultPriceINR: number;
  officeAddress: string;
  supportEmail: string;
  counsellingEmail: string;
  primaryWhatsApp: string;
  secondaryWhatsApp: string;
  whatsappLink: string;
  currency: string;
  establishedYear: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
}

export interface PlanFeature {
  title: string;
  included: boolean;
  detail?: string;
}

export interface PlanItem {
  id: 'explore' | 'elevate' | 'excel';
  name: string;
  tagline: string;
  priceINR: string;
  priceUSD: string;
  period: string;
  isRecommended?: boolean;
  isCustomPricing?: boolean;
  customPricingNote?: string;
  description: string;
  sessionsCount: string;
  supportType: string;
  bestFor: string;
  badge?: string;
  features: PlanFeature[];
}

export interface ResourceCategory {
  id: string;
  name?: string;
  title: string;
  description: string;
  count: number;
  icon: string;
}

export interface ResourceArticle {
  id: string;
  categoryId: string;
  category?: string;
  categoryName: string;
  title: string;
  readTime: string;
  publishedDate: string;
  summary: string;
  content: string;
  tags: string[];
  author: string;
  authorRole: string;
}
