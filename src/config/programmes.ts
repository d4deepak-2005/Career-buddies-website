import { ProgrammeItem } from '../types';

export const PROGRAMMES_CATALOGUE: ProgrammeItem[] = [
  {
    id: "prog-leadership-dev",
    name: "Leadership & Executive Development Track",
    category: "Leadership Development",
    tagline: "Comprehensive strategic guidance and master sessions for Senior and Lead professionals targeting Staff+, Director, and VP leveling.",
    description: "An intensive 12-week high-touch guidance program with senior industry executives. Master cross-functional leverage, organizational strategy, executive presence, and senior interview loops.",
    duration: "12 Weeks",
    feeINR: 24999,
    originalFeeINR: 39999,
    mentorName: "Nishant Sharma & Executive Council",
    mentorRole: "Founder & VP Engineering Advisors",
    mentorCompany: "CareerBuddies Executive Network",
    mentorAvatar: "/assets/nishant.png",
    availability: "Limited to 15 Fellows / Cohort",
    cohortStartDate: "Next Cohort: 15th Sep 2026",
    highlights: [
      "Weekly dedicated strategic deep-dive master sessions with executive leaders",
      "Executive presence diagnostic and 360-degree stakeholder alignment audit",
      "Confidential compensation benchmarking and promotion business case preparation",
      "Direct private access to senior executive network across Tier-1 tech"
    ],
    curriculum: [
      { week: "Weeks 1-3", topic: "Executive Diagnostic & 360 Gap Analysis", description: "Mapping leveling bars, identifying organizational blind spots, and architecting personal executive roadmap." },
      { week: "Weeks 4-6", topic: "Strategic Leadership & Cross-Functional Leverage", description: "Mastering stakeholder alignment, board communication, and multi-team resource negotiation." },
      { week: "Weeks 7-9", topic: "Executive Presence & Narrative Construction", description: "Transforming technical impact into executive-level business outcomes and organizational influence." },
      { week: "Weeks 10-12", topic: "Executive Loops & Offer Structuring", description: "High-stakes executive interview preparation, compensation architecture, and 90-day onboarding strategy." }
    ],
    badge: "Executive Tier",
    enrolledCount: 11,
    capacity: 15,
    isPopular: true
  },
  {
    id: "prog-system-design-staff",
    name: "Skill Development: Staff+ Engineering Architecture",
    category: "Skill Development Tracks",
    tagline: "Master distributed systems, large-scale design, and crack L5/L6 Staff+ engineering rounds.",
    description: "An 8-week deep dive into fault-tolerant distributed computing, microservices meshes, high-throughput caching, and Staff-level behavioral leadership.",
    duration: "8 Weeks",
    feeINR: 14999,
    originalFeeINR: 24999,
    mentorName: "Elena Rostova & Senior Architects",
    mentorRole: "Staff Infrastructure Engineers",
    mentorCompany: "Google / Stripe Alums",
    mentorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    availability: "Open for Enrollment",
    cohortStartDate: "Next Cohort: 10th Sep 2026",
    highlights: [
      "8 intensive live architecture teardown and design round simulations",
      "1:1 mock Staff+ system design interviews with recorded feedback rubric",
      "Curated code and architecture review of your personal portfolio projects",
      "Access to proprietary 100+ Staff-level architectural case study bank"
    ],
    curriculum: [
      { week: "Weeks 1-2", topic: "Distributed Fundamentals & Partitioning", description: "CAP theorem in practice, consistent hashing, database sharding, and replication protocols." },
      { week: "Weeks 3-4", topic: "High-Throughput Storage & Caching Meshes", description: "Cache invalidation strategies, write-ahead logs, LSM trees vs B-trees, and search indexing." },
      { week: "Weeks 5-6", topic: "Resilience, Consensus & Event Meshes", description: "Raft/Paxos intuition, Kafka event-driven architectures, dead letter queues, and idempotency." },
      { week: "Weeks 7-8", topic: "Staff+ Communication & Live Mock Rounds", description: "Steering ambiguous requirements, driving trade-offs, and Staff interview simulations." }
    ],
    badge: "Most Popular",
    enrolledCount: 22,
    capacity: 25,
    isPopular: true
  },
  {
    id: "prog-pm-transition",
    name: "Career Transition: Product Management Blueprint",
    category: "Career Transition Programmes",
    tagline: "Structured roadmap to transition from Engineering, QA, or Analytics into high-impact Product Management.",
    description: "A 6-week hands-on sprint guiding candidates through Product Sense, Analytical Metrics, PRD construction, portfolio teardowns, and PM case interview mastery.",
    duration: "6 Weeks",
    feeINR: 9999,
    originalFeeINR: 17999,
    mentorName: "Deepak Sah & Principal PMs",
    mentorRole: "Co-Founder & Principal Product Leaders",
    mentorCompany: "CareerBuddies PM Network",
    mentorAvatar: "/assets/deepak.png",
    availability: "Open for Enrollment",
    cohortStartDate: "Next Cohort: 12th Sep 2026",
    highlights: [
      "Build a verified, recruiter-ready Product Portfolio with 2 comprehensive PRDs",
      "6 live interactive case-study sessions and product teardowns",
      "1:1 resume revamp transforming engineering achievements into product impact",
      "3 mock PM interviews covering Product Sense, Execution, and Root Cause Analysis"
    ],
    curriculum: [
      { week: "Weeks 1-2", topic: "Transferable Skills & Product Sense Foundations", description: "Customer journey mapping, opportunity identification, and problem statement framing." },
      { week: "Weeks 3-4", topic: "PRD Construction & Metrics Frameworks", description: "Defining North Star metrics, guardrail metrics, GTM strategy, and A/B test design." },
      { week: "Weeks 5-6", topic: "PM Case Interviews & Recruiter Outreach", description: "Acing product execution, strategy cases, behavioral rounds, and PM positioning." }
    ],
    badge: "High Impact",
    enrolledCount: 18,
    capacity: 20
  },
  {
    id: "prog-mentorship-accelerator",
    name: "Dedicated Career Acceleration Track",
    category: "Career Guidance Programmes",
    tagline: "Personalized recurring master sessions with top-tier tech leads for continuous accountability and leveling.",
    description: "Connect with a matched senior advisor for milestone checkpoints, code/architecture audits, mock interviews, and quarterly promotion alignment.",
    duration: "Monthly / 3-Month Track",
    feeINR: 7999,
    originalFeeINR: 14999,
    mentorName: "Divyanshu Gautam & Verified Mentors",
    mentorRole: "Co-Founder & Senior Industry Practitioners",
    mentorCompany: "CareerBuddies Network",
    mentorAvatar: "/assets/divyanshu.png",
    availability: "Open for Matching",
    cohortStartDate: "Rolling Enrollment",
    highlights: [
      "Bi-weekly 1:1 video calls with structured action items and follow-ups",
      "Continuous async chat & code review access directly on WhatsApp/Slack",
      "Personalized promotion dossier and leveling assessment",
      "Verified mentor matching backed by CareerBuddies satisfaction guarantee"
    ],
    curriculum: [
      { week: "Month 1", topic: "Baseline Audit & 90-Day Goal Setting", description: "Identifying core growth bottlenecks, setting measurable quarterly targets." },
      { week: "Month 2", topic: "Deep Execution & Technical Upskilling", description: "Iterative feedback on real projects, system design, and communication." },
      { week: "Month 3", topic: "Leveling Review & Market Positioning", description: "Promotion pitch review, external compensation calibration, and next horizon planning." }
    ],
    badge: "Flexible Track",
    enrolledCount: 35,
    capacity: 40
  },
  {
    id: "prog-early-career",
    name: "Structured Growth: Campus-to-Corporate Launchpad",
    category: "Structured Growth Tracks",
    tagline: "Fast-track your first 3 years of career growth with industry mentors, profile revamping, and interview excellence.",
    description: "A 4-week structured sprint designed for graduates and early professionals (0-3 years) to establish strong engineering fundamentals, polished profile positioning, and confident interview execution.",
    duration: "4 Weeks",
    feeINR: 4999,
    originalFeeINR: 9999,
    mentorName: "Divyanshu Gautam & Tech Mentors",
    mentorRole: "Co-Founder & Senior Engineers",
    mentorCompany: "CareerBuddies Mentor Network",
    mentorAvatar: "/assets/divyanshu.png",
    availability: "Open for Enrollment",
    cohortStartDate: "Next Cohort: 8th Sep 2026",
    highlights: [
      "Complete ATS-proof resume rewrite with verified keyword optimization",
      "LinkedIn profile restructuring for organic recruiter inbounds",
      "1:1 mock technical & HR interview with actionable scorecards",
      "Custom 12-month career progression roadmap and learning tracker"
    ],
    curriculum: [
      { week: "Week 1", topic: "Profile Reconstruction & Signal Optimization", description: "Transforming academic projects and early tasks into measurable professional impact." },
      { week: "Week 2", topic: "Core Technical Interview Drills", description: "Data structures, API fundamentals, debugging, and live technical problem solving." },
      { week: "Week 3", topic: "Behavioral Excellence & Storytelling", description: "STAR method mastery, handling weakness questions, and salary expectation setting." },
      { week: "Week 4", topic: "Outreach Strategy & 90-Day Success Plan", description: "Strategic cold outreach templates, recruiter networking, and first 90 days on the job." }
    ],
    badge: "Essential",
    enrolledCount: 28,
    capacity: 30
  }
];
