import { WebinarItem } from '../types';

export const WEBINAR_ENTRY_PRICE_INR = 199;

export const WEBINARS_CATALOGUE: WebinarItem[] = [
  {
    id: "web-101",
    title: "Mastering Large-Scale System Design for Senior & Staff Roles",
    tagline: "Architecting high-throughput, fault-tolerant microservices and acing L5/L6 rounds.",
    category: "Engineering & Architecture",
    speaker: {
      name: "Elena Rostova",
      role: "Staff Infrastructure Engineer",
      company: "Google / Ex-Stripe",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      bio: "12+ years designing distributed storage systems, consensus algorithms, and microservice meshes at hyper-scale."
    },
    date: "Saturday, Sep 05, 2026",
    time: "06:00 PM - 07:30 PM IST",
    duration: "90 Mins (60m Masterclass + 30m Live Q&A)",
    description: "Break down real-world distributed architectures: event-driven patterns, database partitioning, idempotency, and consensus. Learn exactly how interviewers evaluate trade-offs in Staff-level design interviews.",
    whatYouWillLearn: [
      "Systematic 5-step framework for tackling any ambiguous system design prompt",
      "Deep dive into caching strategies, rate limiting, and write-heavy partitioning",
      "Handling edge cases: network partitions, split-brain, and eventual consistency",
      "How to drive the conversation like a Staff+ engineer rather than a junior implementer",
      "Live teardown of a real-time messaging and payment distributed architecture"
    ],
    targetAudience: [
      "Mid to Senior Software Engineers (3+ years experience)",
      "Engineers preparing for L5/L6 interviews at Tier-1 tech companies",
      "Tech Leads and Architects seeking to validate their architectural judgment"
    ],
    priceINR: WEBINAR_ENTRY_PRICE_INR,
    originalPriceINR: 999,
    capacity: 100,
    registeredCount: 78,
    status: "filling_fast",
    recordingIncluded: true,
    certificateProvided: true,
    badge: "Filling Fast"
  },
  {
    id: "web-102",
    title: "The Product Transition Blueprint: From Engineering/Analytics to Product Manager",
    tagline: "A structured transition roadmap to land high-impact APM and Senior PM roles.",
    category: "Product Management",
    speaker: {
      name: "Marcus Vance",
      role: "Principal Product Director",
      company: "Meta / Ex-Amazon",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      bio: "14+ years scaling consumer platforms, building 0-to-1 product teams, and mentoring 50+ engineers into successful PMs."
    },
    date: "Sunday, Sep 06, 2026",
    time: "11:00 AM - 12:30 PM IST",
    duration: "90 Mins (Live Session + Teardowns)",
    description: "Discover how to translate your technical or analytical background into product vision, customer empathy, and stakeholder influence. Includes portfolio structuring and PM case interview strategies.",
    whatYouWillLearn: [
      "Mapping your current transferable skills into the 4 core PM competency pillars",
      "Creating a high-signal Product Case Study that catches recruiter attention",
      "Frameworks for Product Sense, Analytical Metrics, and Execution rounds",
      "Common transition pitfalls and how to bypass entry-level PM gatekeeping",
      "Live teardown of a winning PM portfolio and PRD sample"
    ],
    targetAudience: [
      "Software Engineers, QA Leads, and Data Analysts targeting PM roles",
      "Associate PMs aiming to accelerate to Senior Product Manager",
      "Founders and Program Managers pivoting to core Product Management"
    ],
    priceINR: WEBINAR_ENTRY_PRICE_INR,
    originalPriceINR: 999,
    capacity: 120,
    registeredCount: 94,
    status: "filling_fast",
    recordingIncluded: true,
    certificateProvided: true,
    badge: "Most Popular"
  },
  {
    id: "web-103",
    title: "Executive Presence & Compensation Negotiation Masterclass",
    tagline: "Benchmark your true market value and master high-stakes offer negotiation.",
    category: "Career & Leadership",
    speaker: {
      name: "Aarav Kapoor",
      role: "VP of People & Leadership Coach",
      company: "Ex-Uber / Tier-1 Advisor",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      bio: "Executive recruiter and compensation advisor who has structured 500+ executive compensation packages across US and India tech markets."
    },
    date: "Saturday, Sep 12, 2026",
    time: "05:00 PM - 06:30 PM IST",
    duration: "90 Mins (Interactive Session + Templates)",
    description: "Demystify equity grants, bonus structures, competing offers, and executive presence during final round interviews. Learn exact phrasing that gains 20-40% compensation uplifts.",
    whatYouWillLearn: [
      "The exact psychology and leverage points recruiters use during offer calls",
      "How to evaluate ESOPs, RSUs, vesting cliffs, and liquidation preferences",
      "Scripted negotiation email and phone templates for multiple competing offers",
      "Executive communication: projecting authority without appearing aggressive",
      "Live mock negotiation demonstration with real-time feedback"
    ],
    targetAudience: [
      "Professionals holding or expecting job offers",
      "Mid to Senior ICs looking to maximize compensation packages",
      "Managers and Leads preparing for executive promotion discussions"
    ],
    priceINR: WEBINAR_ENTRY_PRICE_INR,
    originalPriceINR: 999,
    capacity: 150,
    registeredCount: 112,
    status: "filling_fast",
    recordingIncluded: true,
    certificateProvided: true,
    badge: "High Impact"
  },
  {
    id: "web-104",
    title: "Production Generative AI & LLM Systems for Applied Engineers",
    tagline: "Deploying enterprise-grade RAG, fine-tuning pipelines, and agentic workflows in 2026.",
    category: "Data & AI",
    speaker: {
      name: "Dr. Rachel Zhang",
      role: "Principal AI Research Scientist",
      company: "Microsoft / Ex-OpenAI Fellow",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
      bio: "Pioneering applied LLM architectures, vector databases, and scalable inference optimization for Fortune 500 enterprises."
    },
    date: "Sunday, Sep 13, 2026",
    time: "06:00 PM - 07:30 PM IST",
    duration: "90 Mins (Live Architecture Walkthrough)",
    description: "Move beyond toy demos to production-grade AI systems. Learn latency optimization, context-window management, hybrid search, evaluation harnesses, and security guards.",
    whatYouWillLearn: [
      "Building resilient RAG architectures with hybrid dense/sparse vector retrieval",
      "Evaluation benchmarks: measuring hallucination, precision, and recall quantitatively",
      "Optimizing inference latency and token economics at scale",
      "State-of-the-art Agentic workflows using modern function calling and memory",
      "Hands-on architectural review of an enterprise production GenAI service"
    ],
    targetAudience: [
      "Backend Engineers, ML Engineers, and Data Scientists",
      "Architects building LLM-integrated products",
      "Tech Leads leading AI modernization initiatives"
    ],
    priceINR: WEBINAR_ENTRY_PRICE_INR,
    originalPriceINR: 1199,
    capacity: 120,
    registeredCount: 89,
    status: "upcoming",
    recordingIncluded: true,
    certificateProvided: true,
    badge: "Trending"
  }
];
