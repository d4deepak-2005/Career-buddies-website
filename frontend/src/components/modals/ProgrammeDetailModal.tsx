import React from 'react';
import { PlanItem } from '../../types';
import { X, CheckCircle2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface ProgrammeDetailModalProps {
  plan: PlanItem | null;
  onClose: () => void;
  onConnectAdvisor: (plan: PlanItem) => void;
}

export const ProgrammeDetailModal: React.FC<ProgrammeDetailModalProps> = ({
  plan,
  onClose,
  onConnectAdvisor
}) => {
  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#cbdaff] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#002869] text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-xs font-black uppercase tracking-wider text-[#79fd8d]">
            {plan.tagline}
          </span>
          <h3 className="text-2xl font-black text-white font-['Plus_Jakarta_Sans',sans-serif] mt-1">
            {plan.name}
          </h3>
          <p className="text-xs text-[#d7e2ff] mt-1.5 leading-relaxed pr-6">
            {plan.description}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Investment */}
          <div className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#cbdaff]">
            {plan.isCustomPricing ? (
              <div className="flex flex-col gap-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-black w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-[#002869]" />
                  <span>Personalised Investment</span>
                </div>
                <p className="text-xs text-[#006e29] font-bold leading-relaxed">
                  {plan.customPricingNote || 'Connect with our Career Advisor to understand the programme investment based on your profile and requirements.'}
                </p>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-bold uppercase text-[#747783] tracking-wider">Investment:</span>
                <span className="text-2xl font-black text-[#002869]">{plan.priceINR}</span>
                {plan.period && <span className="text-xs text-[#747783] font-semibold">{plan.period}</span>}
              </div>
            )}
          </div>

          {/* Support / Sessions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-[#e0e8ff]">
              <div className="text-[11px] font-bold uppercase text-[#747783] tracking-wider mb-0.5">Includes</div>
              <div className="text-xs font-bold text-[#061b3b]">{plan.sessionsCount}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#e0e8ff]">
              <div className="text-[11px] font-bold uppercase text-[#747783] tracking-wider mb-0.5">Support</div>
              <div className="text-xs font-bold text-[#061b3b]">{plan.supportType}</div>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-black uppercase text-[#002869] tracking-wider">
              Programme Deliverables:
            </span>
            {plan.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-[#061b3b]">
                <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0 mt-0.5" />
                <span className="font-medium">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-[#747783]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#006e29]" />
            <span>Best for: {plan.bestFor}</span>
          </div>
          <button
            onClick={() => onConnectAdvisor(plan)}
            className="px-5 py-3 rounded-xl bg-[#006e29] hover:bg-[#00531d] text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Connect with an Advisor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgrammeDetailModal;
