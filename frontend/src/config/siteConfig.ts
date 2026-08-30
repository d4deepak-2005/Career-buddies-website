import { 
  SiteConfig, 
  FounderInfo, 
  JourneyMilestone, 
  WebinarItem, 
  FAQItem 
} from '../types';
import { COMPANY_CONFIG, OFFICE_DETAILS } from './company';
import { LEADERSHIP_PROFILES, LEADERSHIP_PHILOSOPHY } from './leadership';
import { WEBINARS_CATALOGUE, WEBINAR_ENTRY_PRICE_INR } from './webinars';
import { PROGRAMMES_CATALOGUE } from './programmes';
import { SUCCESS_STORIES } from './testimonials';

export { 
  COMPANY_CONFIG, 
  OFFICE_DETAILS,
  LEADERSHIP_PROFILES, 
  LEADERSHIP_PHILOSOPHY,
  WEBINARS_CATALOGUE, 
  WEBINAR_ENTRY_PRICE_INR,
  PROGRAMMES_CATALOGUE,
  SUCCESS_STORIES
};

export const DEFAULT_SITE_CONFIG: SiteConfig = COMPANY_CONFIG;

export const FOUNDERS_DATA: FounderInfo[] = LEADERSHIP_PROFILES;

export const JOURNEY_TIMELINE: JourneyMilestone[] = [
  {
    year: "2022",
    title: "Foundation & Core Framework",
    tagline: "Listening to real career roadblocks and initial framework development",
    description: "CareerBuddies was established in 2022 to address the isolation and ambiguity professionals face during crucial career decisions. The team began testing structured 1:1 guidance calls and diagnostic frameworks.",
    highlights: [
      "Identified critical gaps in personalized career direction and practical guidance",
      "Conducted foundational 1:1 exploratory sessions with job seekers and engineers",
      "Formulated core philosophy: career guidance must be structured, practical, and personal"
    ]
  },
  {
    year: "2023",
    title: "Structured Mentoring & Diagnostic Clarity",
    tagline: "Expansion of structured mentoring and career guidance offerings",
    description: "CareerBuddies expanded with formalized diagnostic rubrics, actionable milestones, and vetted senior practitioners across Software Engineering, Product Management, and Data.",
    highlights: [
      "Designed structured diagnostic rubrics for resume reviews and interview prep",
      "Brought on verified senior practitioners across Software, Product, and Data",
      "Piloted structured milestone roadmaps for mid-career engineering transitions"
    ]
  },
  {
    year: "2024",
    title: "Specialised Programmes & Growth Tracks",
    tagline: "Introduction of specialized programmes, leadership guidance and professional growth tracks",
    description: "Introduced structured multi-week cohort tracks, executive leadership guidance, System Design mastery, and practical transition blueprints.",
    highlights: [
      "Launched live interactive weekend masterclasses and topical deep-dives",
      "Introduced live Q&A roundtables on System Design and Staff+ promotions",
      "Built curated repository of career playbooks and salary negotiation templates"
    ]
  },
  {
    year: "2025",
    title: "Mentor Engagement & Live Learning",
    tagline: "Expansion of mentor engagement, webinars and structured learning experiences",
    description: "Expanded our verified mentor network and introduced accessible ₹199 live webinars, bringing top-tier industry insights to thousands of ambitious learners.",
    highlights: [
      "Streamlined mentor discovery with verified skill filters and flexible scheduling",
      "Established dedicated free 1:1 diagnostic counselling sessions",
      "Deepened partnerships with practitioners from premier technology companies"
    ]
  },
  {
    year: "2026",
    title: "Integrated Guidance Ecosystem",
    tagline: "Growth into a more integrated career guidance platform with mentoring, programmes and career development services",
    description: "Evolving into a comprehensive career guidance platform combining career acceleration plans, specialized cohort tracks, interactive Career Journey Navigator diagnostics, and continuous professional support.",
    highlights: [
      "Interactive Career Journey Navigator diagnostic for instant stage clarity",
      "Integrated Live Webinar learning track architecture at ₹199",
      "Continuous guidance ecosystem for lifelong career advancement"
    ]
  }
];

export const WHY_TRUST_POINTS = [
  {
    title: "Practical Guidance",
    description: "No generic motivational talk. Every session, webinar, and playbook delivers concrete, step-by-step frameworks tested in actual industry environments.",
    icon: "Compass"
  },
  {
    title: "Experienced Professionals",
    description: "Learn from practitioners actively working in senior engineering, product, and leadership roles who know what current hiring bars demand.",
    icon: "Users"
  },
  {
    title: "Personalised Career Support",
    description: "Your background, aspirations, and challenges are unique. We tailor action plans to your specific timeline, strengths, and target roles.",
    icon: "Target"
  },
  {
    title: "Relevant Learning Opportunities",
    description: "Targeted, live interactive webinars and masterclasses covering real skills—from system architecture to executive communication.",
    icon: "GraduationCap"
  },
  {
    title: "Clear Next Steps",
    description: "Leave every interaction with actionable milestones, clear takeaways, and follow-up guidance so you never feel stuck in ambiguity.",
    icon: "CheckCircle2"
  }
];

export const NEXT_STEP_OPTIONS = [
  {
    id: "clarity",
    title: "I need Career Clarity",
    subtitle: "Feeling uncertain about your next move or career direction?",
    description: "Get structured diagnostic guidance to understand your strengths, market opportunities, and the right path forward.",
    ctaText: "Take Career Navigator",
    targetPage: "career-check-in",
    badge: "Most Popular",
    color: "blue"
  },
  {
    id: "change",
    title: "I want to Change My Career",
    subtitle: "Pivoting to a new role, domain, or modern tech stack?",
    description: "Bridge skill gaps, revamp your positioning, and get paired with mentors who have successfully made that transition.",
    ctaText: "Explore Transition Support",
    targetPage: "services",
    badge: "High Impact",
    color: "green"
  },
  {
    id: "grow",
    title: "I want to Grow in My Current Career",
    subtitle: "Aiming for Senior, Staff, Lead, or Management promotion?",
    description: "Master advanced system design, executive stakeholder management, and leveling rubrics to accelerate your promotion.",
    ctaText: "Explore Programmes",
    targetPage: "programmes",
    badge: "Structured Tracks",
    color: "blue"
  },
  {
    id: "learn",
    title: "I want to Learn from Experts",
    subtitle: "Looking for focused live workshops and practical masterclasses?",
    description: `Join live weekend webinars for ₹${WEBINAR_ENTRY_PRICE_INR} covering high-demand topics with live Q&A from top-tier practitioners.`,
    ctaText: "Browse Live Webinars",
    targetPage: "webinars",
    badge: `₹${WEBINAR_ENTRY_PRICE_INR} Access`,
    color: "green"
  }
];

export const INITIAL_WEBINARS: WebinarItem[] = WEBINARS_CATALOGUE;

export const WEBINAR_FAQS: FAQItem[] = [
  {
    id: "wfaq-1",
    question: "What is included in the ₹199 webinar entry ticket?",
    answer: "Each webinar pass grants you 90-minute live access to the interactive masterclass, live Q&A round with the speaker, high-definition session recording, slide decks, practical templates, and a verified CareerBuddies certificate of participation.",
    category: "webinars"
  },
  {
    id: "wfaq-2",
    question: "Will I get access to the recording if I cannot attend live?",
    answer: "Yes! All registered participants receive permanent access to the high-definition masterclass recording and workshop resources within 24 hours of session completion.",
    category: "webinars"
  },
  {
    id: "wfaq-3",
    question: "How do I join the live session on the day of the event?",
    answer: "You will receive calendar invites, WhatsApp reminders, and a direct Google Meet / Zoom link sent to your registered email and mobile number prior to the event.",
    category: "webinars"
  },
  {
    id: "wfaq-4",
    question: "Can I ask questions directly to the speaker during the session?",
    answer: "Absolutely. Every masterclass reserves a dedicated 30-minute interactive Q&A segment where attendees can ask questions and receive live feedback on their architectural or career scenarios.",
    category: "webinars"
  }
];

export const SITE_FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "What is CareerBuddies and how does it work?",
    answer: "CareerBuddies is a practitioner-led career acceleration platform. The journey starts with an affordable ₹199 live mentor-led masterclass webinar. Interested candidates then connect with a dedicated Career Advisor who analyzes your background and helps you select from three tailored Career Plans. Upon enrolment, our specialized team overhauls your resume and portfolio, followed by a high-impact Personalized Industry Master Session.",
    category: "general"
  },
  {
    id: "faq-2",
    question: "How does the Career Advisor discussion work after the webinar?",
    answer: "After attending a ₹199 mentor-led webinar, genuinely interested professionals can request an advisor discussion. Our advisor reviews your current experience, target roles, and transition bottlenecks to recommend the most effective of our 3 structured Career Plans.",
    category: "general"
  },
  {
    id: "faq-3",
    question: "What are the Live Webinars and what is included in ₹199?",
    answer: `Our ₹${WEBINAR_ENTRY_PRICE_INR} live webinars are 90-minute interactive masterclasses led by senior practitioners from top technology companies. Every ticket includes live Q&A access, session recording, downloadable playbooks, and direct eligibility for our 3 structured career tracks.`,
    category: "webinars"
  },
  {
    id: "faq-4",
    question: "When does the dedicated profile engineering work begin?",
    answer: "Dedicated profile engineering (ATS resume rewrite, LinkedIn overhaul, portfolio audit) begins immediately upon enrolment in one of our three Career Plans. Our team works hand-in-hand on your assets before your Personalized Industry Master Session.",
    category: "programmes"
  },
  {
    id: "faq-5",
    question: "How is the Personalized Industry Master Session arranged?",
    answer: "Once your profile assets are revamped by our team, we schedule a 1:1 Personalized Master Session in the following week with a verified practitioner aligned specifically with your domain and career target.",
    category: "mentors"
  }
];
