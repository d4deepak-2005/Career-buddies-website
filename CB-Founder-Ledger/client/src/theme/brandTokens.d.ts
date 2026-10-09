export interface BrandTokens {
  colors: Record<'navy' | 'navyDeep' | 'blue' | 'blueBright' | 'green' | 'greenDark' | 'mint' | 'tint50' | 'tint100' | 'tint200' | 'tint300' | 'tint400' | 'inkMuted' | 'inkFaint' | 'ink' | 'danger' | 'dangerSoft' | 'white', string>;
  font: string;
  radius: { card: string };
  chart: string[];
}
export const brandTokens: BrandTokens;
