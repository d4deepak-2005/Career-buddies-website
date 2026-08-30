export interface LeaderProfile {
  id: string;
  profileSlug: string;
  name: string;
  role: 'Founder' | 'Co-Founder';
  title: string;
  image: string;
  fallbackImage?: string;
  yearsOfExperience: string;
  yearsNum: number;
  headline: string;
  shortBio: string;
  about: string[];
  experienceSummary: string;
  experienceHighlights: {
    roleTitle: string;
    focus: string;
    summary: string;
    keyDeliverables: string[];
  }[];
  expertise: string[];
  focusAreas: string[];
  roleAtCareerBuddies: string;
  roleResponsibilities: string[];
  philosophy: {
    quote: string;
    context: string;
  };
  email: string;
  linkedIn: string;
  directWhatsApp?: string;
}

export const LEADERSHIP_SECTION_HEADER = {
  eyebrow: "MEET OUR LEADERSHIP",
  headline: "Meet the People Behind CareerBuddies",
  supportingText: "CareerBuddies is being built with a shared vision of making career guidance, mentorship and professional growth more accessible, practical and meaningful."
};

export const LEADERSHIP_DATA: LeaderProfile[] = [
  {
    id: "leader-nishant-sharma",
    profileSlug: "nishant-sharma",
    name: "Nishant Sharma",
    role: "Founder",
    title: "Founder, CareerBuddies",
    image: "/assets/nishant.jpg",
    fallbackImage: "/nishant.jpg",
    yearsOfExperience: "10+ Years of Professional Experience",
    yearsNum: 10,
    headline: "Driving the vision of structured career transformation, diagnostic clarity, and high-signal mentorship for ambitious professionals.",
    shortBio: "Passionate about democratizing access to high-caliber executive and technical mentorship. Driving the vision of structured career transformation for professionals worldwide.",
    about: [
      "Nishant Sharma is the Founder of CareerBuddies. With over a decade of hands-on professional experience spanning technology strategy, organizational development, and talent roadmapping, Nishant established CareerBuddies out of a core conviction: pivotal career decisions should never have to be navigated alone or through ambiguous advice.",
      "Recognizing that conventional career guidance often lacks structure and real-world applicability, Nishant pioneered CareerBuddies' diagnostic assessment methodology. He leads the company's overarching vision, product direction, and mentorship ecosystem, bringing together seasoned industry practitioners to deliver transparent, actionable career progression frameworks.",
      "His work centers on creating scalable pathways for mid-career engineers, product leaders, and aspiring technologists to identify authentic skill gaps, master strategic interview narratives, and build sustainable long-term careers."
    ],
    experienceSummary: "10+ years driving strategy, leadership advisory, and structured mentorship programs across high-growth technology environments.",
    experienceHighlights: [
      {
        roleTitle: "Founder & Strategic Director",
        focus: "CareerBuddies (2022 – Present)",
        summary: "Established the core platform vision, diagnostic evaluation matrix, and curated network of top-tier industry mentors.",
        keyDeliverables: [
          "Conceptualized and deployed the 1:1 Diagnostic & Action Blueprint framework",
          "Engineered the vetting standards for senior practitioners and leadership advisors",
          "Spearheaded community learning initiatives and interactive career strategy workshops"
        ]
      },
      {
        roleTitle: "Senior Strategic Advisor & Career Consultant",
        focus: "Technology & Talent Advisory (Prior)",
        summary: "Guided hundreds of engineers, managers, and cross-functional professionals through leveling pivots, executive promotions, and compensation negotiations.",
        keyDeliverables: [
          "Developed personalized 90-day milestone transition playbooks for complex domain shifts",
          "Advised emerging leaders on executive presence and stakeholder management",
          "Authored industry frameworks on leveling benchmarks and promotion positioning"
        ]
      }
    ],
    focusAreas: [
      "Career Development",
      "Professional Guidance",
      "Mentorship Architecture",
      "Business Strategy",
      "Community Building",
      "Product Vision"
    ],
    expertise: [
      "Career Development",
      "Professional Guidance",
      "Mentorship Architecture",
      "Business Strategy",
      "Community Building",
      "Product Vision"
    ],
    roleAtCareerBuddies: "Nishant leads the overarching strategic direction, organizational vision, and mentorship quality benchmarks at CareerBuddies. He designs the core diagnostic assessment rubrics, oversees mentor vetting standards, and drives strategic initiatives to ensure every mentee receives structured, personalized career support.",
    roleResponsibilities: [
      "Defining long-term company vision, strategic product roadmap, and service architecture",
      "Designing structured diagnostic rubrics and 90-day milestone execution blueprints",
      "Upholding mentor vetting standards and high-signal advisory benchmarks",
      "Championing community outreach, live leadership masterclasses, and practitioner access"
    ],
    philosophy: {
      quote: "Career guidance is deeply personal. The right advice at the right inflection point can fundamentally reshape a professional's confidence, trajectory, and lifelong potential.",
      context: "A practical, people-focused approach grounded in transparency, diagnostic rigor, and genuine empathy for every career journey."
    },
    email: "nishant.sharma@careerbuddies.in",
    linkedIn: "https://www.linkedin.com/company/careerbuddies",
    directWhatsApp: "+919310288270"
  },
  {
    id: "leader-deepak-sah",
    profileSlug: "deepak",
    name: "Deepak",
    role: "Co-Founder",
    title: "Co-Founder, CareerBuddies",
    image: "/assets/deepak.jpg",
    fallbackImage: "/deepak.jpg",
    yearsOfExperience: "8+ Years of Professional Experience",
    yearsNum: 8,
    headline: "Architecting human-centric mentorship matching engines, career diagnostic rubrics, and personalized growth roadmaps.",
    shortBio: "Product strategist and technologist focused on crafting human-centric mentorship matching engines, career diagnostic rubrics, and personalized growth roadmaps.",
    about: [
      "Deepak is the Co-Founder of CareerBuddies. Bringing over 8 years of robust experience across product development, technology platforms, and user journey optimization, Deepak focuses on transforming complex career dilemmas into intuitive, structured digital solutions.",
      "At CareerBuddies, Deepak is the key architect behind the platform's smart matching engine, diagnostic evaluation rubrics, and interactive user experiences. He works closely with mentees and mentors to identify friction in career progression and translates those insights into practical, high-leverage platform tools.",
      "His technical acumen and deep empathy for the learner journey ensure that every candidate receives timely, tailored guidance paired with actionable milestones and trackable outcomes."
    ],
    experienceSummary: "8+ years in product architecture, user experience design, and digital platform scalability.",
    experienceHighlights: [
      {
        roleTitle: "Co-Founder & Head of Product Experience",
        focus: "CareerBuddies (2022 – Present)",
        summary: "Architected the mentor-mentee matching rubric, learning experience design, and structured diagnostic framework.",
        keyDeliverables: [
          "Engineered the multi-factor smart matching rubric connecting learners with domain experts",
          "Designed interactive diagnostic assessment workflows and progress tracking dashboards",
          "Optimized end-to-end counselling intake and live webinar discovery systems"
        ]
      },
      {
        roleTitle: "Product & Digital Strategy Lead",
        focus: "Technology & Digital Platforms (Prior)",
        summary: "Led product strategy, user research, and technical roadmaps for data-driven web platforms and digital services.",
        keyDeliverables: [
          "Built scalable web interfaces with focus on conversion, accessibility, and intuitive navigation",
          "Implemented user-centric feedback loops that reduced customer onboarding friction",
          "Collaborated with cross-functional engineering teams to deliver robust digital architectures"
        ]
      }
    ],
    focusAreas: [
      "Career Counselling Systems",
      "Professional Development",
      "Technology & Digital Platforms",
      "User Experience (UX)",
      "Growth Strategy",
      "Product Strategy"
    ],
    expertise: [
      "Career Counselling Systems",
      "Professional Development",
      "Technology & Digital Platforms",
      "User Experience (UX)",
      "Growth Strategy",
      "Product Strategy"
    ],
    roleAtCareerBuddies: "Deepak leads product experience, platform engineering, and digital workflows at CareerBuddies. He translates complex mentorship methodologies into seamless digital interactions—from smart mentor discovery and interactive webinars to automated milestone tracking—ensuring learners have an empowering, frictionless journey.",
    roleResponsibilities: [
      "Architecting the smart mentor matching engine and diagnostic assessment tools",
      "Leading platform usability, user experience design, and interface ergonomics",
      "Developing automated CRM synchronization and learner notification workflows",
      "Analyzing learner progression data to continuously refine mentorship rubrics"
    ],
    philosophy: {
      quote: "Technology should amplify human mentorship, not replace it. Our goal is to make expert guidance intuitive, measurable, and accessible to anyone willing to put in the work.",
      context: "Focusing on intuitive tools, measurable progress, and seamless human connection."
    },
    email: "deepak.sah@careerbuddies.in",
    linkedIn: "https://www.linkedin.com/company/careerbuddies",
    directWhatsApp: "+919310288270"
  },
  {
    id: "leader-divyanshu-gautam",
    profileSlug: "divyanshu",
    name: "Divyanshu",
    role: "Co-Founder",
    title: "Co-Founder, CareerBuddies",
    image: "/assets/divyanshu.jpg",
    fallbackImage: "/divyanshu.jpg",
    yearsOfExperience: "8+ Years of Professional Experience",
    yearsNum: 8,
    headline: "Building enterprise partner ecosystems, mentor vetting standards, and community masterclasses connecting learners with industry leaders.",
    shortBio: "Building enterprise partner ecosystems, mentor vetting standards, and community initiatives connecting ambitious learners with industry-leading practitioners.",
    about: [
      "Divyanshu is the Co-Founder of CareerBuddies. With over 8 years of professional experience across operations, talent partnerships, and community ecosystems, Divyanshu plays a vital role in building CareerBuddies' verified mentor network and collaborative learning initiatives.",
      "Divyanshu spearheads mentor onboarding, operational excellence, and practitioner partnerships across Tier-1 tech enterprises and innovative startups. He is dedicated to curating high-impact masterclasses, weekend workshops, and interactive peer forums that bring real hiring realities directly to learners.",
      "Through strategic community outreach and rigorous mentor selection standards, Divyanshu ensures that CareerBuddies maintains the highest caliber of practical, real-world industry advice."
    ],
    experienceSummary: "8+ years scaling operational ecosystems, strategic partnerships, and practitioner-led learning communities.",
    experienceHighlights: [
      {
        roleTitle: "Co-Founder & Head of Ecosystem Partnerships",
        focus: "CareerBuddies (2022 – Present)",
        summary: "Spearheaded mentor onboarding, practitioner vetting, live masterclass series, and community outreach.",
        keyDeliverables: [
          "Built a vetted network of 50+ senior engineering, product, and data mentors from top tech companies",
          "Launched the interactive Masterclass series delivering high-signal, affordable group learning",
          "Established operational frameworks for session quality monitoring and mentee satisfaction"
        ]
      },
      {
        roleTitle: "Operations & Partnerships Strategist",
        focus: "Talent & Community Ecosystems (Prior)",
        summary: "Managed partner relations, talent growth pipelines, and community engagement for professional development networks.",
        keyDeliverables: [
          "Designed operational workflows that scaled practitioner engagement and retention",
          "Facilitated collaborative industry roundtables and live skill-building workshops",
          "Managed end-to-end partner onboarding pipelines with high satisfaction metrics"
        ]
      }
    ],
    focusAreas: [
      "Mentor Partnerships",
      "Community Growth",
      "Operational Scale",
      "Talent Ecosystems",
      "Business Development",
      "Platform Growth"
    ],
    expertise: [
      "Mentor Partnerships",
      "Community Growth",
      "Operational Scale",
      "Talent Ecosystems",
      "Business Development",
      "Platform Growth"
    ],
    roleAtCareerBuddies: "Divyanshu orchestrates mentor relations, community operations, and live learning programs at CareerBuddies. He oversees the vetting and onboarding of senior practitioners, curates industry-relevant workshop curriculums, and builds strategic initiatives that bridge the gap between ambitious professionals and proven industry leaders.",
    roleResponsibilities: [
      "Leading mentor recruitment, credential verification, and pedagogical onboarding",
      "Curating and executing live masterclasses, interactive webinars, and Q&A sessions",
      "Managing community operations, partner relationships, and learner engagement",
      "Scaling operational workflows to support seamless personalized master sessions and group workshops"
    ],
    philosophy: {
      quote: "True professional growth happens when practical knowledge is shared freely by those who have walked the path before you.",
      context: "Committed to authentic practitioner insights, community collaboration, and removing barriers to senior mentorship."
    },
    email: "divyanshu.gautam@careerbuddies.in",
    linkedIn: "https://www.linkedin.com/company/careerbuddies",
    directWhatsApp: "+919310288270"
  }
];

export const getLeaderBySlug = (slug: string): LeaderProfile | undefined => {
  return LEADERSHIP_DATA.find(leader => 
    leader.profileSlug === slug || 
    leader.id === slug ||
    (slug.toLowerCase().includes('nishant') && leader.profileSlug.includes('nishant')) ||
    (slug.toLowerCase().includes('deepak') && leader.profileSlug.includes('deepak')) ||
    (slug.toLowerCase().includes('divyanshu') && leader.profileSlug.includes('divyanshu'))
  );
};

export const getLeaderByIndex = (index: number): LeaderProfile => {
  const normalizedIndex = ((index % LEADERSHIP_DATA.length) + LEADERSHIP_DATA.length) % LEADERSHIP_DATA.length;
  return LEADERSHIP_DATA[normalizedIndex];
};
