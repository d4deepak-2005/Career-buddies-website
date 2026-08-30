import React from 'react';
import { X, CheckCircle2, Clock, Users, ArrowRight, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { ServiceItem } from '../../types';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onBookService: (service: ServiceItem) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onBookService
}) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#e0e8ff] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#002869] text-white p-6 relative flex items-start justify-between">
          <div className="pr-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#dae2ff] text-[#001947] text-[11px] font-bold">
                {service.category}
              </span>
              {service.badge && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#79fd8d] text-[#00531d] text-[11px] font-bold">
                  {service.badge}
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
              {service.title}
            </h3>
            <div className="flex items-center gap-4 text-xs text-[#d7e2ff] mt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {service.duration}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#79fd8d]" />
                100% Vetted Mentors
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Overview */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#002869] mb-2">
              Service Overview
            </h4>
            <p className="text-sm text-[#434652] leading-relaxed">
              {service.fullDescription}
            </p>
          </div>

          {/* Key Deliverables */}
          <div className="bg-[#f1f3ff] p-5 rounded-xl border border-[#cbdaff]/70">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#061b3b] mb-3 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#002869]" />
              Structured Deliverables
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {service.deliverables.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[#061b3b] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ideal For */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#002869] mb-2.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#002869]" />
              Who This Is Designed For
            </h4>
            <div className="flex flex-col gap-2">
              {service.idealFor.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[#434652] bg-[#f9f9ff] px-3 py-2 rounded-lg border border-[#e0e8ff]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#002869]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Outcome Highlight */}
          <div className="p-4 bg-[#79fd8d]/20 border border-[#79fd8d] rounded-xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#006e29] shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-[#00531d] uppercase block">Primary Outcome</span>
              <span className="text-xs text-[#061b3b] font-semibold">{service.keyOutcome}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f9f9ff] border-t border-[#e0e8ff] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#434652] hover:text-[#061b3b] cursor-pointer"
          >
            Back to Catalog
          </button>

          <button
            onClick={() => {
              onClose();
              onBookService(service);
            }}
            className="px-6 py-2.5 bg-[#002869] hover:bg-[#0b3d91] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Book Free Counselling for this Service</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
