import { PageView } from '../types';

export interface PageNavigationItem {
  id: PageView;
  title: string;
  shortLabel: string;
  path: string;
  inMainMenu?: boolean;
  inDropdown?: boolean;
  badge?: string;
}

export const LOGICAL_PAGE_JOURNEY: PageView[] = [
  'home',
  'services',
  'programmes',
  'webinars',
  'career-check-in',
  'leadership',
  'success-stories',
  'about-us',
  'contact'
];

export const PAGE_TITLES: Record<PageView, string> = {
  'home': 'Home',
  'services': 'Services',
  'programmes': 'Programmes',
  'webinars': 'Live Webinars',
  'career-check-in': 'Career Check-In',
  'leadership': 'Leadership Team',
  'leader-profile': 'Leader Profile',
  'success-stories': 'Success Stories',
  'about-us': 'About CareerBuddies',
  'how-it-works': 'Our Journey',
  'mentors': 'Find a Mentor',
  'features': 'Platform Features',
  'plans': 'Career Acceleration Plans',
  'resources': 'Resources & Playbooks',
  'contact': 'Contact Us',
  'counselling': 'Free Career Counselling',
  'login': 'Login',
  'signup': 'Sign Up',
  'admin': 'Admin Portal',
  'leads-dashboard': 'Leads Management',
  'dashboard': 'Candidate Dashboard'
};

export const MAIN_NAV_ITEMS: { id: PageView; label: string; badge?: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'programmes', label: 'Programmes' }
];

export const DROPDOWN_NAV_ITEMS: { id: PageView; label: string; description: string; badge?: string }[] = [
  { id: 'counselling', label: 'Free Counselling', description: 'Book 1:1 strategic diagnostic session', badge: 'Free' },
  { id: 'webinars', label: 'Live Webinars', description: 'Interactive weekend masterclasses for ₹199', badge: '₹199' },
  { id: 'career-check-in', label: 'Career Journey Navigator', description: 'Personalized stage diagnostic tool', badge: 'Free' },
  { id: 'leadership', label: 'Leadership & Mentors', description: 'Meet Founder & Co-Founders' },
  { id: 'success-stories', label: 'Success Stories', description: 'Real career transitions and promotion reviews' },
  { id: 'about-us', label: 'About Us', description: 'Our story and mission since 2022' },
  { id: 'contact', label: 'Contact Support', description: 'Registered office and WhatsApp support' }
];

export function getPreviousPage(currentPage: PageView): { id: PageView; label: string } | null {
  const index = LOGICAL_PAGE_JOURNEY.indexOf(currentPage);
  if (index > 0) {
    const prevId = LOGICAL_PAGE_JOURNEY[index - 1];
    return { id: prevId, label: PAGE_TITLES[prevId] || 'Previous' };
  }
  return null;
}

export function getNextPage(currentPage: PageView): { id: PageView; label: string } | null {
  const index = LOGICAL_PAGE_JOURNEY.indexOf(currentPage);
  if (index >= 0 && index < LOGICAL_PAGE_JOURNEY.length - 1) {
    const nextId = LOGICAL_PAGE_JOURNEY[index + 1];
    return { id: nextId, label: PAGE_TITLES[nextId] || 'Next' };
  }
  return null;
}
