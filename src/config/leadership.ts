import { FounderInfo } from '../types';

export const LEADERSHIP_PROFILES: (FounderInfo & { id: string; experienceYears: number; careerHighlights: string[]; areasOfGuidance: string[]; previousRoles: string[] })[] = [
  {
    id: "nishant-sharma",
    name: "Nishant Sharma",
    role: "Founder",
    title: "Founder & Strategic Mentor, CareerBuddies",
    email: "nishant.sharma@careerbuddies.in",
    avatar: "/assets/nishant.png",
    experienceYears: 12,
    bio: "Passionate about democratizing access to high-caliber executive and technical mentorship. Driving the vision of structured career transformation for professionals worldwide.",
    contribution: "Pioneered the core career acceleration architecture, career diagnostic methodology, and leadership standards at CareerBuddies.",
    expertise: [
      "Executive Career Strategy",
      "Career Roadmapping & Leveling",
      "Staff+ / Principal Engineering Bar",
      "Salary & Offer Negotiation Strategy",
      "High-Performance Team Leadership"
    ],
    careerHighlights: [
      "12+ years leading technology initiatives and engineering organizations.",
      "Directly mentored 400+ professionals across Tier-1 tech ecosystems.",
      "Architected proprietary 5-pillar career diagnostic assessment used across CareerBuddies.",
      "Keynote speaker and mentor across national technology and leadership summits."
    ],
    areasOfGuidance: [
      "Engineering Leadership & Staff+ Promotions",
      "Navigating Senior Executive Transitions",
      "Executive Presence & Stakeholder Management",
      "Compensation Benchmark Strategy & Negotiation"
    ],
    previousRoles: [
      "VP / Director of Engineering at Hyper-growth Tech Ecosystems",
      "Senior Technical Program Leader",
      "Principal Systems Architect"
    ],
    linkedIn: "https://www.linkedin.com/company/careerbuddies"
  },
  {
    id: "deepak-sah",
    name: "Deepak Sah",
    role: "Co-Founder",
    title: "Co-Founder & Product Head, CareerBuddies",
    email: "deepak.sah@careerbuddies.in",
    avatar: "/assets/deepak.png",
    experienceYears: 10,
    bio: "Product strategist and technologist focused on crafting human-centric mentorship matching engines, career diagnostic rubrics, and personalized growth roadmaps.",
    contribution: "Architected the mentor-mentee matching rubric, learning experience design, and structured diagnostic framework.",
    expertise: [
      "Product Strategy & 0-to-1 Roadmaps",
      "Diagnostic Assessment Engines",
      "Career Pivot Frameworks",
      "User Experience & Product Sense",
      "Growth Architecture"
    ],
    careerHighlights: [
      "10+ years driving product innovation, consumer platforms, and scaled systems.",
      "Guided 250+ aspiring and mid-career professionals into high-impact Product Management roles.",
      "Designed the 4-phase Career Journey Navigator and personalized mentorship matching rubric.",
      "Product advisor to multiple tech startups across India and Southeast Asia."
    ],
    areasOfGuidance: [
      "Transitioning from Engineering / Analytics to Product Management",
      "Mastering PM Case Interviews & Product Teardowns",
      "Metrics-Driven Product Strategy & Roadmapping",
      "Portfolio & PRD Review for PM Aspirants"
    ],
    previousRoles: [
      "Lead Product Manager at Consumer Tech Scale-ups",
      "Senior Product Strategist",
      "Technology & UX Consultant"
    ],
    linkedIn: "https://www.linkedin.com/company/careerbuddies"
  },
  {
    id: "divyanshu-gautam",
    name: "Divyanshu Gautam",
    role: "Co-Founder",
    title: "Co-Founder & Growth Head, CareerBuddies",
    email: "divyanshu.gautam@careerbuddies.in",
    avatar: "/assets/divyanshu.png",
    experienceYears: 9,
    bio: "Building enterprise partner ecosystems, mentor vetting standards, and community initiatives connecting ambitious learners with industry-leading practitioners.",
    contribution: "Spearheaded mentor onboarding, practitioner vetting, live masterclass series, and community outreach.",
    expertise: [
      "Mentor Ecosystem Architecture",
      "Practitioner Vetting & Quality Standards",
      "Live Masterclass Series & Webinars",
      "Community Growth & Engagement",
      "Industry Partnerships"
    ],
    careerHighlights: [
      "9+ years scaling operational platforms, talent networks, and community education.",
      "Built a verified network of 150+ senior mentors from premier global tech companies.",
      "Curated and launched 50+ live interactive masterclasses with 98% attendee satisfaction.",
      "Pioneered the transparent ₹199 webinar initiative to make top-tier learning accessible."
    ],
    areasOfGuidance: [
      "Early Career Growth & Placement Strategy",
      "Profile & Resume High-Signal Positioning",
      "Overcoming Career Plateaus & Skill Gaps",
      "Building Professional Capital & Networking"
    ],
    previousRoles: [
      "Head of Community & Partnerships at Tech Education Ventures",
      "Growth & Operations Lead",
      "Talent Strategy Consultant"
    ],
    linkedIn: "https://www.linkedin.com/company/careerbuddies"
  }
];

export const LEADERSHIP_PHILOSOPHY = {
  quote: "Career guidance is personal. The right advice at the right moment can influence the direction of an entire career.",
  subtext: "Built by professionals focused on helping individuals navigate careers, build confidence and make informed professional decisions.",
  principles: [
    {
      title: "Real Practitioner Insight",
      desc: "Every recommendation stems from active hiring managers and senior practitioners who understand modern market expectations."
    },
    {
      title: "Actionable Milestones",
      desc: "We replace ambiguous advice with measurable roadmaps, weekly milestones, and concrete deliverables."
    },
    {
      title: "Zero Exaggeration",
      desc: "Honest feedback and realistic leveling benchmarks to prepare candidates for long-term sustainable growth."
    }
  ]
};
