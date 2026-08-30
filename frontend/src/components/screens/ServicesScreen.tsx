import React, { useState, useMemo } from 'react';
import { STRUCTURED_SERVICES } from '../../data/mockData';
import { ServiceItem, PageView } from '../../types';
import { 
  Compass, 
  Shuffle, 
  FileCheck, 
  Server, 
  Code, 
  Users, 
  TrendingUp, 
  Award, 
  Lightbulb, 
  Cpu, 
  Rocket, 
  Globe,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { PageNavigationControls } from '../common/PageNavigationControls';

interface ServicesScreenProps {
  onSelectService: (service: ServiceItem) => void;
  onOpenCounselling?: (service?: ServiceItem) => void;
  onStartMatching?: () => void;
  setActivePage?: (page: PageView) => void;
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({
  onSelectService,
  onOpenCounselling,
  onStartMatching,
  setActivePage
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Career Strategy',
    'Job Search',
    'Technical Prep',
    'Interview Prep',
    'Leadership',
    'Compensation',
    'Product Management',
    'Startup Advisory',
    'Global Career'
  ];

  const getServiceIcon = (name: string) => {
    switch (name) {
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'Shuffle': return <Shuffle className="w-5 h-5" />;
      case 'FileCheck': return <FileCheck className="w-5 h-5" />;
      case 'Server': return <Server className="w-5 h-5" />;
      case 'Code': return <Code className="w-5 h-5" />;
      case 'Users': return <Users className="w-5 h-5" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      case 'Lightbulb': return <Lightbulb className="w-5 h-5" />;
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Rocket': return <Rocket className="w-5 h-5" />;
      case 'Globe': return <Globe className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const filteredServices = useMemo(() => {
    return STRUCTURED_SERVICES.filter(service => {
      const matchCat = selectedCategory === 'All' || service.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        service.title.toLowerCase().includes(q) ||
        service.shortDescription.toLowerCase().includes(q) ||
        service.category.toLowerCase().includes(q) ||
        service.deliverables.some(d => d.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-10">
        
        {/* Universal Navigation Controls */}
        <PageNavigationControls
          onBackToHome={() => {
            if (setActivePage) {
              setActivePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onBack={() => {
            if (setActivePage) {
              setActivePage('how-it-works');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onNext={() => {
            if (setActivePage) {
              setActivePage('features');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          backLabel="Our Journey"
          nextLabel="Find a Mentor (1:1)"
          currentStepLabel="12 Structured Mentorship Tracks"
        />

        {/* Header Banner */}
        <div className="bg-[#002869] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#79fd8d]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 max-w-2xl flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-[#dae2ff] w-fit">
              <Sparkles className="w-3.5 h-3.5 text-[#79fd8d]" />
              <span>12 Structured Career Acceleration Tracks</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
              Structured Mentorship Tracks
            </h1>

            <p className="text-sm sm:text-base text-[#d7e2ff] leading-relaxed font-medium">
              Every stage of your career requires distinct tools and strategies. From passing high-stakes Staff System Design rounds to negotiating executive equity packages, our verified mentors guide you with structured deliverables.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#cbdaff] shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#747783] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services (e.g. System Design, Salary, Resume, AI)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#747783] hover:text-[#061b3b]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-[#434652]">
              Showing <span className="text-[#002869] font-black">{filteredServices.length}</span> of 12 Services
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-gray-100">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#002869] text-white shadow-xs'
                    : 'bg-[#f1f3ff] text-[#434652] hover:bg-[#dae2ff]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-3xl border border-[#cbdaff] hover:border-[#002869] p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#dae2ff] text-[#002869] group-hover:bg-[#002869] group-hover:text-white transition-colors flex items-center justify-center shadow-xs shrink-0">
                    {getServiceIcon(service.iconName)}
                  </div>
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-[#f1f3ff] text-[#002869] border border-[#cbdaff]/50">
                    {service.category}
                  </span>
                </div>

                <h3 className="text-lg font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif] group-hover:text-[#002869] transition-colors leading-snug">
                  {service.title}
                </h3>

                <p className="text-xs text-[#434652] mt-2 leading-relaxed line-clamp-2">
                  {service.shortDescription}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-1.5">
                  <span className="text-[11px] font-black uppercase text-[#006e29] tracking-wider">
                    Core Deliverables:
                  </span>
                  {service.deliverables.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#061b3b]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006e29] shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                <span className="text-xs font-black text-[#002869]">
                  {service.duration}
                </span>

                <button
                  onClick={() => onSelectService(service)}
                  className="px-3.5 py-2 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Track</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#79fd8d]" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
