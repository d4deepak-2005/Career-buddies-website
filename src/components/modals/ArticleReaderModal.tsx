import React from 'react';
import { X, Clock, Calendar, User, Tag, Share2, BookOpen, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ResourceArticle } from '../../types';

interface ArticleReaderModalProps {
  article: ResourceArticle | null;
  onClose: () => void;
  onBookCounselling: () => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  onClose,
  onBookCounselling
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#e0e8ff] flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-[#f9f9ff] border-b border-[#e0e8ff] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-bold">
              {article.categoryName}
            </span>
            <span className="text-xs text-[#747783] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readTime}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-[#747783] hover:text-[#061b3b] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Article Content */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          {/* Article Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#061b3b] leading-tight mb-4 font-['Plus_Jakarta_Sans',sans-serif]">
            {article.title}
          </h1>

          {/* Author Byline */}
          <div className="flex items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-100 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#002869] text-white flex items-center justify-center font-bold text-sm">
                {article.author.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#061b3b]">{article.author}</h4>
                <p className="text-[11px] text-[#434652]">{article.authorRole}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#747783] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {article.publishedDate}
              </span>
              <button
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  } catch (e) {
                    console.log('Clipboard error:', e);
                  }
                }}
                className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                  copied 
                    ? 'bg-[#e8f5e9] border-[#a5d6a7] text-[#1b5e20]' 
                    : 'border-[#e0e8ff] hover:bg-[#f1f3ff] text-[#434652]'
                }`}
                title="Share article"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006e29]" />
                    <span className="text-[10px] font-bold">Copied!</span>
                  </>
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Article Summary Box */}
          <div className="bg-[#f1f3ff] p-4 rounded-xl border border-[#cbdaff] mb-6">
            <h4 className="text-xs font-bold text-[#002869] uppercase tracking-wider mb-1">
              Executive Summary
            </h4>
            <p className="text-xs sm:text-sm text-[#061b3b] leading-relaxed">
              {article.summary}
            </p>
          </div>

          {/* Formatted Content */}
          <div className="prose prose-sm max-w-none text-[#434652] leading-relaxed space-y-4">
            {article.content.split('\n\n').map((paragraph, index) => {
              const trimmed = paragraph.trim();
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-lg font-bold text-[#061b3b] mt-6 mb-2">
                    {trimmed.replace('### ', '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('#### ')) {
                return (
                  <h4 key={index} className="text-base font-bold text-[#002869] mt-4 mb-2">
                    {trimmed.replace('#### ', '')}
                  </h4>
                );
              }
              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote key={index} className="pl-4 border-l-4 border-[#002869] bg-[#f9f9ff] py-2 px-3 italic text-xs text-[#061b3b] my-3 rounded-r">
                    {trimmed.replace('> ', '')}
                  </blockquote>
                );
              }
              if (trimmed.startsWith('* ') || trimmed.startsWith('1. ')) {
                const items = trimmed.split('\n');
                return (
                  <ul key={index} className="list-disc pl-5 space-y-1.5 my-3 text-xs">
                    {items.map((it, idx) => (
                      <li key={idx} className="text-[#434652]">
                        {it.replace(/^(\*|\d+\.)\s*/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={index} className="text-xs sm:text-sm text-[#434652] leading-relaxed">
                  {trimmed}
                </p>
              );
            })}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap mt-8 pt-6 border-t border-gray-100">
            <Tag className="w-3.5 h-3.5 text-[#747783]" />
            {article.tags.map((tag, idx) => (
              <span key={idx} className="text-[11px] bg-[#f1f3ff] text-[#002869] px-2.5 py-1 rounded-md font-medium">
                #{tag}
              </span>
            ))}
          </div>

          {/* Mentorship CTA inside Article */}
          <div className="mt-8 p-6 bg-[#002869] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-base text-white">Apply These Insights with a Mentor</h4>
              <p className="text-xs text-[#dae2ff] mt-1">Get 1:1 guidance, resume teardown, or interview simulation from veteran leaders.</p>
            </div>
            <button
              onClick={() => {
                onClose();
                onBookCounselling();
              }}
              className="px-5 py-2.5 bg-white text-[#002869] hover:bg-[#f9f9ff] font-bold text-xs rounded-xl shadow-sm shrink-0 cursor-pointer"
            >
              Book Free Counselling
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
