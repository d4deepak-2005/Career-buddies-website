import React, { useState } from 'react';
import { CAREER_PLANS } from '../../data/mockData';
import { PlanItem, PageView } from '../../types';
import { ProgrammeDetailModal } from '../modals/ProgrammeDetailModal';
import { 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight, 
  FileText, 
  CreditCard,
  Building,
  CheckCircle2
} from 'lucide-react';
import { PageNavigationControls } from '../common/PageNavigationControls';

interface PlansScreenProps {
  onSelectPlan: (plan: PlanItem) => void;
  onOpenCounselling?: () => void;
  setActivePage?: (page: PageView) => void;
}

export const PlansScreen: React.FC<PlansScreenProps> = ({
  onSelectPlan,
  onOpenCounselling,
  setActivePage
}) => {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [detailPlan, setDetailPlan] = useState<PlanItem | null>(null);

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
              setActivePage('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onNext={() => {
            if (setActivePage) {
              setActivePage('webinars');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          backLabel="Services"
          nextLabel="Browse Masterclasses"
          currentStepLabel="Plans & Milestone Pricing"
        />

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#002869]" />
            <span>INVEST IN YOUR TRAJECTORY</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
            Transparent, High-ROI Mentorship Plans
          </h1>

          <p className="text-sm sm:text-base text-[#434652] leading-relaxed font-medium">
            Choose the structured guidance level that matches your current career milestone. Most mentees recoup their program investment within their first salary leveling negotiation.
          </p>

          {/* Currency Toggle */}
          <div className="inline-flex items-center bg-white p-1 rounded-xl border border-[#cbdaff] mt-2 shadow-2xs">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                currency === 'INR'
                  ? 'bg-[#002869] text-white shadow-xs'
                  : 'text-[#434652] hover:text-[#061b3b]'
              }`}
            >
              INR (₹)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-[#002869] text-white shadow-xs'
                  : 'text-[#434652] hover:text-[#061b3b]'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {CAREER_PLANS.map((plan) => {
            const isFeatured = plan.isRecommended;
            const isElevate = plan.id === 'elevate';
            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  isFeatured
                    ? 'border-2 border-[#002869] shadow-xl ring-4 ring-[#002869]/5 bg-white'
                    : isElevate
                    ? 'border-2 border-[#1f8a70]/50 shadow-lg bg-gradient-to-br from-[#eef7f3] to-[#e9f1fb]'
                    : 'border border-[#cbdaff] hover:border-[#002869]/40 shadow-xs bg-white'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#006e29] text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-xs">
                    {isFeatured ? 'Recommended Track' : plan.badge}
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-[#747783] mt-0.5">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="my-6 pb-6 border-b border-gray-100">
                    {plan.isCustomPricing ? (
                      <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dae2ff] text-[#001947] text-xs font-black w-fit">
                          <Sparkles className="w-3.5 h-3.5 text-[#002869]" />
                          <span>Custom Fee Structure</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-[#061b3b]">
                          Personalised Investment
                        </span>
                        <p className="text-xs text-[#006e29] font-bold bg-[#79fd8d]/15 p-2.5 rounded-xl border border-[#006e29]/20 leading-relaxed">
                          {plan.customPricingNote || "Get a personalised plan and fee structure based on your career profile and requirements."}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-[#061b3b]">
                            {currency === 'INR' ? plan.priceINR : plan.priceUSD}
                          </span>
                          <span className="text-xs text-[#747783] font-semibold">{plan.period}</span>
                        </div>
                        <p className="text-xs text-[#434652] mt-2 font-medium">{plan.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  <div className="space-y-3 mb-8">
                    <span className="text-xs font-black uppercase text-[#002869] tracking-wider block">
                      Plan Deliverables:
                    </span>
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-[#061b3b]">
                        {feature.included ? (
                          <CheckCircle2 className="w-4 h-4 text-[#006e29] shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'font-medium' : 'text-gray-400'}>
                          {feature.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => onSelectPlan(plan)}
                    className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      plan.isCustomPricing
                        ? 'bg-[#006e29] hover:bg-[#00531d] text-white shadow-md'
                        : isFeatured
                        ? 'bg-[#002869] hover:bg-[#0b3d91] text-white'
                        : 'bg-[#f1f3ff] hover:bg-[#dae2ff] text-[#002869] border border-[#cbdaff]'
                    }`}
                  >
                    <span>{plan.isCustomPricing ? 'Connect with an Advisor' : `Choose ${plan.name}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
