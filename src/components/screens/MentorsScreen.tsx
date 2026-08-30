import React, { useState, useMemo } from 'react';
import { MOCK_MENTORS } from '../../data/mockData';
import { Mentor, Category, PageView } from '../../types';
import { 
  Search, 
  Filter, 
  Star, 
  ShieldCheck, 
  Calendar, 
  Sparkles, 
  SlidersHorizontal,
  Grid,
  List,
  Heart,
  Bookmark,
  Building,
  Check
} from 'lucide-react';
import { PageNavigationControls } from '../common/PageNavigationControls';

interface MentorsScreenProps {
  onSelectMentor: (mentor: Mentor) => void;
  onBookMentor: (mentor: Mentor) => void;
  onStartMatching: () => void;
  setActivePage?: (page: PageView) => void;
}

const CATEGORIES: Category[] = [
  'All',
  'Engineering',
  'Product',
  'Design',
  'Data & AI',
  'Marketing & Growth',
  'Leadership'
];

export const MentorsScreen: React.FC<MentorsScreenProps> = ({
  onSelectMentor,
  onBookMentor,
  onStartMatching,
  setActivePage
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'rating' | 'price-low' | 'price-high' | 'sessions'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [savedMentors, setSavedMentors] = useState<string[]>([]);

  const toggleSaveMentor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedMentors(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredMentors = useMemo(() => {
    return MOCK_MENTORS.filter(mentor => {
      const matchesCategory = selectedCategory === 'All' || mentor.category === selectedCategory;
      const matchesCompany = selectedCompany === 'All' || mentor.company.toLowerCase() === selectedCompany.toLowerCase();
      
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        mentor.name.toLowerCase().includes(query) ||
        mentor.title.toLowerCase().includes(query) ||
        mentor.company.toLowerCase().includes(query) ||
        mentor.bio.toLowerCase().includes(query) ||
        mentor.topics.some(t => t.toLowerCase().includes(query)) ||
        mentor.skills.some(s => s.toLowerCase().includes(query));

      return matchesCategory && matchesCompany && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price-low') return a.hourlyRate - b.hourlyRate;
      if (sortBy === 'price-high') return b.hourlyRate - a.hourlyRate;
      if (sortBy === 'sessions') return b.sessionsCompleted - a.sessionsCompleted;
      return 0;
    });
  }, [selectedCategory, selectedCompany, searchQuery, sortBy]);

  const uniqueCompanies = ['All', ...Array.from(new Set(MOCK_MENTORS.map(m => m.company)))];

  return (
    <div className="w-full min-h-screen bg-[#f9f9ff] py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto">
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
              setActivePage('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onNext={() => {
            if (setActivePage) {
              setActivePage('career-check-in');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          backLabel="Mentorship Tracks"
          nextLabel="2-Min Career Check-In"
          currentStepLabel="Find a Mentor (1:1 Advisory)"
        />

        {/* Header Title & Match Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 sm:p-8 rounded-3xl border border-[#cbdaff] shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#002869]" />
              <span>Verified Top 3% Tech Leaders</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#061b3b]">
              Find Your Ideal Career Mentor
            </h1>
            <p className="text-sm text-[#434652] mt-1 max-w-xl">
              1-on-1 strategy sessions, mock interviews, leveling reviews, and continuous guidance from staff engineers and executives.
            </p>
          </div>

          <button
            onClick={onStartMatching}
            className="flex items-center gap-2 px-5 py-3 bg-[#002869] hover:bg-[#0b3d91] text-white font-semibold text-sm rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#79fd8d]" />
            <span>Smart Match Me (30s)</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#e0e8ff] shadow-xs mb-8 flex flex-col gap-4">
          {/* Top Filter Row: Search & Dropdowns */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#747783] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role, company, skill (e.g., 'Staff Eng', 'System Design', 'Stripe')..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9ff] border border-[#e0e8ff] rounded-lg text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] focus:bg-white transition-colors"
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

            {/* Company Select */}
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#747783] hidden sm:block" />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="bg-[#f9f9ff] border border-[#e0e8ff] rounded-lg px-3 py-2.5 text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869]"
              >
                <option value="All">All Companies</option>
                {uniqueCompanies.filter(c => c !== 'All').map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#747783] hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#f9f9ff] border border-[#e0e8ff] rounded-lg px-3 py-2.5 text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869]"
              >
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="sessions">Most Completed Sessions</option>
              </select>
            </div>

            {/* Grid / List view toggle */}
            <div className="hidden sm:flex items-center border border-[#e0e8ff] rounded-lg p-1 bg-[#f9f9ff]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-[#002869]' : 'text-[#747783]'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-xs text-[#002869]' : 'text-[#747783]'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Chips Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-gray-100 pt-3">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-[#002869] text-white shadow-xs'
                    : 'bg-[#f1f3ff] text-[#434652] hover:bg-[#e0e8ff]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-semibold text-[#434652]">
            Showing <span className="text-[#002869] font-bold">{filteredMentors.length}</span> verified mentors
          </p>
          {savedMentors.length > 0 && (
            <span className="text-xs text-[#006e29] font-semibold flex items-center gap-1">
              <Bookmark className="w-3.5 h-3.5 fill-[#006e29]" />
              {savedMentors.length} Saved in Wishlist
            </span>
          )}
        </div>

        {/* Mentors Grid / List */}
        {filteredMentors.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#e0e8ff]">
            <Search className="w-12 h-12 text-[#747783] mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-[#061b3b] mb-1">No mentors match your filter</h3>
            <p className="text-sm text-[#434652] max-w-md mx-auto mb-4">
              Try adjusting your search terms or select "All" categories to see all verified leaders.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedCompany('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#002869] text-white text-xs font-bold rounded-lg hover:bg-[#0b3d91]"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map(mentor => {
              const isSaved = savedMentors.includes(mentor.id);
              return (
                <div
                  key={mentor.id}
                  className="bg-white border border-[#e0e8ff] hover:border-[#002869]/50 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all group relative"
                >
                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => toggleSaveMentor(mentor.id, e)}
                    className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#f1f3ff] text-[#747783] hover:text-[#002869] transition-colors cursor-pointer"
                    title={isSaved ? "Remove from saved" : "Save mentor"}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#002869] text-[#002869]' : ''}`} />
                  </button>

                  <div>
                    {/* Top Row: Avatar & Profile Info */}
                    <div className="flex items-start gap-4 mb-4 pr-6">
                      <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        className="w-16 h-16 rounded-xl object-cover border border-[#e0e8ff] shadow-xs shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-base text-[#061b3b] truncate">
                            {mentor.name}
                          </h3>
                          {mentor.verified && (
                            <span title="Verified Mentor">
                              <ShieldCheck className="w-4 h-4 text-[#006e29] shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#434652] truncate font-medium">{mentor.title}</p>
                        <div className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-[#dae2ff] text-[#001947] text-[11px] font-bold">
                          {mentor.company}
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-[#434652] leading-relaxed line-clamp-2 mb-4">
                      {mentor.bio}
                    </p>

                    {/* Topics Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {mentor.topics.slice(0, 3).map((topic, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-[#f9f9ff] border border-[#e0e8ff] text-[#061b3b] px-2 py-0.5 rounded-md"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>

                    {/* Next Available Pill */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#006e29] bg-[#79fd8d]/20 px-2.5 py-1 rounded-md mb-4 font-semibold w-fit">
                      <Calendar className="w-3 h-3" />
                      <span>Next available: {mentor.availableNext}</span>
                    </div>
                  </div>

                  {/* Footer: Rating, Rate, Actions */}
                  <div className="pt-4 border-t border-[#e0e8ff] flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-[#061b3b]">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{mentor.rating}</span>
                        <span className="text-[#747783] font-normal">({mentor.reviewCount})</span>
                      </div>
                      <span className="text-xs text-[#006e29] font-bold">
                        ${mentor.hourlyRate}<span className="text-[10px] text-[#747783] font-normal">/session</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectMentor(mentor)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#002869] hover:bg-[#dae2ff]/50 rounded-lg transition-colors cursor-pointer"
                      >
                        Bio & Reviews
                      </button>
                      <button
                        onClick={() => onBookMentor(mentor)}
                        className="px-4 py-1.5 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-semibold rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        Book Call
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col gap-4">
            {filteredMentors.map(mentor => {
              const isSaved = savedMentors.includes(mentor.id);
              return (
                <div
                  key={mentor.id}
                  className="bg-white border border-[#e0e8ff] rounded-2xl p-5 hover:border-[#002869]/50 hover:shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="w-16 h-16 rounded-xl object-cover border border-[#e0e8ff] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-[#061b3b]">{mentor.name}</h3>
                        {mentor.verified && <ShieldCheck className="w-4 h-4 text-[#006e29]" />}
                        <span className="px-2 py-0.5 rounded bg-[#dae2ff] text-[#001947] text-[11px] font-bold">
                          {mentor.company}
                        </span>
                        <span className="text-xs text-[#747783]">• {mentor.experienceYears} yrs exp</span>
                      </div>
                      <p className="text-xs font-medium text-[#434652] mt-0.5">{mentor.title}</p>
                      <p className="text-xs text-[#434652] mt-1 line-clamp-1">{mentor.bio}</p>
                      
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {mentor.topics.map((t, idx) => (
                          <span key={idx} className="text-[10px] bg-[#f9f9ff] border border-[#e0e8ff] px-2 py-0.5 rounded text-[#061b3b]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <div className="text-left md:text-right">
                      <div className="flex items-center gap-1 text-xs font-bold text-[#061b3b]">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{mentor.rating}</span>
                        <span className="text-[#747783] font-normal">({mentor.reviewCount})</span>
                      </div>
                      <div className="text-sm font-bold text-[#006e29]">
                        ${mentor.hourlyRate}<span className="text-[10px] text-[#747783] font-normal">/session</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => toggleSaveMentor(mentor.id, e)}
                        className="p-2 rounded-lg border border-[#e0e8ff] hover:bg-[#f1f3ff] text-[#747783]"
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#002869] text-[#002869]' : ''}`} />
                      </button>
                      <button
                        onClick={() => onSelectMentor(mentor)}
                        className="px-3.5 py-2 text-xs font-semibold text-[#002869] border border-[#002869] rounded-lg hover:bg-[#dae2ff]/50"
                      >
                        Bio
                      </button>
                      <button
                        onClick={() => onBookMentor(mentor)}
                        className="px-4 py-2 bg-[#002869] hover:bg-[#0b3d91] text-white text-xs font-semibold rounded-lg shadow-xs"
                      >
                        Book Call
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
