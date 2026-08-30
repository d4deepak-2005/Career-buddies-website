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
    headline: "Building a meaningful career guidance ecosystem that helps working professionals navigate important career decisions with greater clarity and confidence.",
    shortBio: "Nishant Sharma is the Founder of CareerBuddies and brings over 10 years of professional experience to the platform. His focus is on building a meaningful career guidance ecosystem that helps working professionals navigate important career decisions with greater clarity and confidence.",
    about: [
      "Nishant Sharma is the Founder of CareerBuddies and brings over 10 years of professional experience to the platform. His focus is on building a meaningful career guidance ecosystem that helps working professionals navigate important career decisions with greater clarity and confidence.",
      "Through CareerBuddies, he is focused on connecting career aspirations with practical guidance, industry perspectives and structured learning opportunities. His approach centres on understanding the challenges professionals face at different stages of their careers, from career transitions and role progression to leadership growth and long-term professional development.",
      "As Founder, Nishant leads the overall vision and direction of CareerBuddies, with the goal of building a platform that makes quality career guidance more accessible, relevant and practical for ambitious professionals."
    ],
    experienceSummary: "Over 10 years of professional experience, focused on building a meaningful career guidance ecosystem for working professionals.",
    experienceHighlights: [
      {
        roleTitle: "Founder",
        focus: "CareerBuddies",
        summary: "Leads the overall vision and direction of CareerBuddies, with the goal of building a platform that makes quality career guidance more accessible, relevant and practical for ambitious professionals.",
        keyDeliverables: [
          "Connecting career aspirations with practical guidance, industry perspectives and structured learning opportunities",
          "Understanding the challenges professionals face at different stages of their careers",
          "Building a meaningful career guidance ecosystem that is accessible, relevant and practical"
        ]
      }
    ],
    focusAreas: [
      "Career Guidance",
      "Professional Development",
      "Career Transitions",
      "Role Progression",
      "Leadership Growth",
      "Long-term Professional Development"
    ],
    expertise: [
      "Career Guidance",
      "Professional Development",
      "Career Transitions",
      "Role Progression",
      "Leadership Growth",
      "Long-term Professional Development"
    ],
    roleAtCareerBuddies: "As Founder, Nishant leads the overall vision and direction of CareerBuddies, with the goal of building a platform that makes quality career guidance more accessible, relevant and practical for ambitious professionals.",
    roleResponsibilities: [
      "Leading the overall vision and direction of CareerBuddies",
      "Connecting career aspirations with practical guidance and industry perspectives",
      "Building structured learning opportunities for professionals",
      "Making quality career guidance more accessible, relevant and practical"
    ],
    philosophy: {
      quote: "Quality career guidance should be accessible, relevant and practical for ambitious professionals.",
      context: "Focused on connecting career aspirations with practical guidance and structured learning."
    },
    email: "nishant.sharma@careerbuddies.in",
    linkedIn: "https://www.linkedin.com/company/careerbuddies",
    directWhatsApp: "+919310288270"
  },
  {
    id: "leader-deepak-sah",
    profileSlug: "deepak",
    name: "Deepak Sah",
    role: "Co-Founder",
    title: "Co-Founder, CareerBuddies",
    image: "/assets/deepak.jpg",
    fallbackImage: "/deepak.jpg",
    yearsOfExperience: "8+ Years of Professional Experience",
    yearsNum: 8,
    headline: "Focused on understanding the evolving needs of working professionals and contributing towards a more structured and accessible approach to career development.",
    shortBio: "Deepak Sah is the Co-Founder of CareerBuddies and brings over 8 years of professional experience. He is focused on understanding the evolving needs of working professionals and contributing towards a more structured and accessible approach to career development.",
    about: [
      "Deepak Sah is the Co-Founder of CareerBuddies and brings over 8 years of professional experience. He is focused on understanding the evolving needs of working professionals and contributing towards a more structured and accessible approach to career development.",
      "His perspective is centred on the practical challenges professionals encounter while navigating career growth, exploring new opportunities and making important professional decisions. At CareerBuddies, he contributes to shaping experiences and initiatives that help professionals access relevant guidance and make more informed career choices.",
      "As Co-Founder, Deepak works towards strengthening the CareerBuddies vision of creating a supportive platform where professionals can learn, gain perspective and move forward in their careers with greater clarity."
    ],
    experienceSummary: "Over 8 years of professional experience, focused on a more structured and accessible approach to career development for working professionals.",
    experienceHighlights: [
      {
        roleTitle: "Co-Founder",
        focus: "CareerBuddies",
        summary: "Works towards strengthening the CareerBuddies vision of creating a supportive platform where professionals can learn, gain perspective and move forward in their careers with greater clarity.",
        keyDeliverables: [
          "Understanding the evolving needs of working professionals",
          "Shaping experiences and initiatives that help professionals access relevant guidance",
          "Helping professionals make more informed career choices"
        ]
      }
    ],
    focusAreas: [
      "Career Development",
      "Professional Guidance",
      "Career Growth",
      "Informed Career Choices",
      "Professional Decisions",
      "Structured Learning"
    ],
    expertise: [
      "Career Development",
      "Professional Guidance",
      "Career Growth",
      "Informed Career Choices",
      "Professional Decisions",
      "Structured Learning"
    ],
    roleAtCareerBuddies: "As Co-Founder, Deepak works towards strengthening the CareerBuddies vision of creating a supportive platform where professionals can learn, gain perspective and move forward in their careers with greater clarity.",
    roleResponsibilities: [
      "Understanding the evolving needs of working professionals",
      "Shaping experiences and initiatives that provide relevant guidance",
      "Helping professionals make more informed career choices",
      "Strengthening the CareerBuddies vision of a supportive learning platform"
    ],
    philosophy: {
      quote: "Professionals deserve a supportive platform where they can learn, gain perspective and move forward with clarity.",
      context: "Focused on a structured and accessible approach to career development."
    },
    email: "deepak.sah@careerbuddies.in",
    linkedIn: "https://www.linkedin.com/company/careerbuddies",
    directWhatsApp: "+919310288270"
  },
  {
    id: "leader-divyanshu-gautam",
    profileSlug: "divyanshu",
    name: "Divyanshu Gautam",
    role: "Co-Founder",
    title: "Co-Founder, CareerBuddies",
    image: "/assets/divyanshu.jpg",
    fallbackImage: "/divyanshu.jpg",
    yearsOfExperience: "6+ Years of Professional Experience",
    yearsNum: 6,
    headline: "Focused on making career guidance and professional development more practical, approachable and relevant for working professionals.",
    shortBio: "Divyanshu Gautam is the Co-Founder of CareerBuddies and brings over 6 years of professional experience. His focus is on contributing to initiatives that make career guidance and professional development more practical, approachable and relevant for working professionals.",
    about: [
      "Divyanshu Gautam is the Co-Founder of CareerBuddies and brings over 6 years of professional experience. His focus is on contributing to initiatives that make career guidance and professional development more practical, approachable and relevant for working professionals.",
      "He understands that career growth is not always a linear journey and that professionals often need the right perspective, guidance and support when making important decisions. Through CareerBuddies, he contributes to building experiences that help individuals better understand their career options and approach their professional growth with confidence.",
      "As Co-Founder, Divyanshu supports the development and growth of the CareerBuddies ecosystem, with a focus on creating meaningful value for professionals across different stages of their careers."
    ],
    experienceSummary: "Over 6 years of professional experience, focused on making career guidance and professional development more practical, approachable and relevant.",
    experienceHighlights: [
      {
        roleTitle: "Co-Founder",
        focus: "CareerBuddies",
        summary: "Supports the development and growth of the CareerBuddies ecosystem, with a focus on creating meaningful value for professionals across different stages of their careers.",
        keyDeliverables: [
          "Contributing to initiatives that make career guidance more practical and approachable",
          "Building experiences that help individuals understand their career options",
          "Supporting professionals to approach their growth with confidence"
        ]
      }
    ],
    focusAreas: [
      "Career Guidance",
      "Professional Development",
      "Career Growth",
      "Career Options",
      "Professional Confidence",
      "Ecosystem Development"
    ],
    expertise: [
      "Career Guidance",
      "Professional Development",
      "Career Growth",
      "Career Options",
      "Professional Confidence",
      "Ecosystem Development"
    ],
    roleAtCareerBuddies: "As Co-Founder, Divyanshu supports the development and growth of the CareerBuddies ecosystem, with a focus on creating meaningful value for professionals across different stages of their careers.",
    roleResponsibilities: [
      "Supporting the development and growth of the CareerBuddies ecosystem",
      "Building experiences that help individuals understand their career options",
      "Making career guidance more practical, approachable and relevant",
      "Creating meaningful value for professionals across different career stages"
    ],
    philosophy: {
      quote: "Career growth is not always a linear journey — the right perspective, guidance and support make a real difference.",
      context: "Focused on practical, approachable career guidance for every stage."
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
