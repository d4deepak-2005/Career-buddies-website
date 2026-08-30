import React from 'react';
import { WHY_TRUST_POINTS } from '../../config/siteConfig';
import { 
  Compass, 
  Users, 
  Target, 
  GraduationCap, 
  CheckCircle2, 
  ShieldCheck,
  HeartHandshake
} from 'lucide-react';

export const WhyTrustSection: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass':
        return <Compass className="w-5 h-5 text-[#002869]" />;
      case 'Users':
        return <Users className="w-5 h-5 text-[#006e29]" />;
      case 'Target':
        return <Target className="w-5 h-5 text-[#002869]" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-[#006e29]" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5 text-[#002869]" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-[#002869]" />;
    }
  };

  return (
    <section className="w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-white">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-10 sm:gap-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3 sm:gap-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f1f3ff] border border-[#cbdaff] text-[#002869] text-xs font-bold">
            <HeartHandshake className="w-3.5 h-3.5 text-[#006e29]" />
            <span>Authentic Guidance Philosophy</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#061b3b] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Why Trust CareerBuddies?
          </h2>

          <p className="text-sm sm:text-base text-[#434652] leading-relaxed">
            We reject superficial career hacks and generic motivation. Our platform is built on grounded conversations with experienced practitioners who understand what hiring bars truly require.
          </p>
        </div>

        {/* Qualitative Trust Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {WHY_TRUST_POINTS.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#f9f9ff] border border-[#e0e8ff] hover:border-[#002869]/40 rounded-3xl p-6 sm:p-7 transition-all duration-200 hover:shadow-xs flex flex-col justify-between"
            >
              <div className="flex flex-col gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#cbdaff] flex items-center justify-center shadow-xs">
                  {getIcon(item.icon)}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#061b3b] font-['Plus_Jakarta_Sans',sans-serif]">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#434652] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}

          {/* Guarantee / Commitment Card */}
          <div className="bg-[#002869] text-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-sm md:col-span-2 lg:col-span-1">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#79fd8d]/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col gap-3 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-[#79fd8d] mb-1">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                Our Commitment to You
              </h3>
              <p className="text-xs sm:text-sm text-[#dae2ff] leading-relaxed">
                If a 1:1 session or masterclass does not deliver clear, actionable value for your career questions, our team will personally arrange an alternative session or provide a hassle-free refund.
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-white/15 flex items-center justify-between text-xs text-[#79fd8d] font-bold relative z-10">
              <span>Hassle-Free Satisfaction Standard</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
