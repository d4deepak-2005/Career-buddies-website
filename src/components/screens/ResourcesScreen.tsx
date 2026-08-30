import React, { useState, useMemo } from 'react';
import { RESOURCE_CATEGORIES, RESOURCE_ARTICLES } from '../../data/mockData';
import { ResourceArticle, PageView } from '../../types';
import { 
  BookOpen, 
  Search, 
  Clock, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Tag, 
  Filter,
  FileText,
  Bookmark
} from 'lucide-react';
import { PageNavigationControls } from '../common/PageNavigationControls';

interface ResourcesScreenProps {
  onSelectArticle: (article: ResourceArticle) => void;
  onOpenCounselling?: () => void;
  setActivePage?: (page: PageView) => void;
}

export const ResourcesScreen: React.FC<ResourcesScreenProps> = ({
  onSelectArticle,
  onOpenCounselling,
  setActivePage
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredArticles = useMemo(() => {
    return RESOURCE_ARTICLES.filter(article => {
      const matchCat = selectedCategory === 'all' || article.categoryId === selectedCategory || article.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        article.title.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        article.categoryName.toLowerCase().includes(q) ||
        article.author.toLowerCase().includes(q) ||
        article.tags.some(t => t.toLowerCase().includes(q));
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
              setActivePage('webinars');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onNext={() => {
            if (setActivePage) {
              setActivePage('contact');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          backLabel="Webinars"
          nextLabel="Contact Us"
          currentStepLabel="Career Playbooks & Guides"
        />

        {/* Header */}
        <div className="bg-[#002869] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#79fd8d]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 max-w-2xl flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-[#dae2ff] w-fit">
              <BookOpen className="w-3.5 h-3.5 text-[#79fd8d]" />
              <span>CareerBuddies Knowledge Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
              Career Playbooks & Guides
            </h1>

            <p className="text-sm sm:text-base text-[#d7e2ff] leading-relaxed font-medium">
              Battle-tested frameworks for System Design interviews, Staff+ promotion rubrics, executive compensation negotiation, and tech stack transitions.
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
                placeholder="Search articles (e.g. System Design, Promo Rubric, Negotiation)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9ff] border border-[#cbdaff] rounded-xl text-xs sm:text-sm text-[#061b3b] focus:outline-none focus:border-[#002869] focus:bg-white"
              />
            </div>

            <div className="text-xs font-bold text-[#434652]">
              Showing <span className="text-[#002869] font-black">{filteredArticles.length}</span> Playbooks
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-gray-100">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#002869] text-white shadow-xs'
                  : 'bg-[#f1f3ff] text-[#434652] hover:bg-[#dae2ff]'
              }`}
            >
              All Topics
            </button>
            {RESOURCE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#002869] text-white shadow-xs'
                    : 'bg-[#f1f3ff] text-[#434652] hover:bg-[#dae2ff]'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => onSelectArticle(article)}
              className="bg-white rounded-3xl border border-[#cbdaff] hover:border-[#002869] p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-lg group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-[#dae2ff] text-[#001947]">
                    {article.categoryName}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-[#747783] font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{article.readTime}</span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif] group-hover:text-[#002869] transition-colors leading-snug">
                  {article.title}
                </h3>

                <p className="text-xs text-[#434652] mt-2 leading-relaxed line-clamp-3">
                  {article.summary}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {article.tags.map((t, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-md bg-[#f1f3ff] text-[#434652] text-[10px] font-semibold"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#061b3b]">{article.author}</span>
                  <span className="text-[10px] text-[#747783]">{article.authorRole}</span>
                </div>

                <span className="text-xs font-bold text-[#002869] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
