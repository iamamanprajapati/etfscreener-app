// ETF descriptions and categories for Indian ETFs

export const getETFDescription = (symbol) => {
  const descriptions = {
    'NIFTYBEES.NS': 'Nifty 50 ETF - Tracks the Nifty 50 index, representing 50 large-cap stocks from various sectors of the Indian economy.',
    'BANKBEES.NS': 'Banking ETF - Tracks the Nifty Bank index, representing major banking stocks in India.',
    'GOLDBEES.NS': 'Gold ETF - Tracks the price of gold, providing exposure to gold as an asset class.',
    'ITBEES.NS': 'IT ETF - Tracks the Nifty IT index, representing major IT companies in India.',
    'AUTOBEES.NS': 'Auto ETF - Tracks the Nifty Auto index, representing automobile and related companies.',
    'FMCGIETF.NS': 'FMCG ETF - Tracks the Nifty FMCG index, representing fast-moving consumer goods companies.',
    'PHARMABEES.NS': 'Pharma ETF - Tracks the Nifty Pharma index, representing pharmaceutical companies.',
    'ENERGYIETF.NS': 'Energy ETF - Tracks the Nifty Energy index, representing energy sector companies.',
    'METALIETF.NS': 'Metals ETF - Tracks the Nifty Metal index, representing metal and mining companies.',
    'REALTYIETF.NS': 'Realty ETF - Tracks the Nifty Realty index, representing real estate companies.',
    'PSUBNKBEES.NS': 'PSU Bank ETF - Tracks the Nifty PSU Bank index, representing public sector banks.',
    'CONSUMBEES.NS': 'Consumption ETF - Tracks the Nifty Consumption index, representing consumption-focused companies.',
    'NEXT50IETF.NS': 'Nifty Next 50 ETF - Tracks the Nifty Next 50 index, representing the next 50 large-cap stocks after Nifty 50.',
    'MON100.NS': 'Nasdaq 100 ETF - Tracks the Nasdaq 100 index, providing exposure to US technology stocks.',
    'MAFANG.NS': 'NYSE FANG+ ETF - Tracks the NYSE FANG+ index, representing major technology and internet companies.',
    'HNGSNGBEES.NS': 'Hang Seng Tech ETF - Tracks the Hang Seng Tech index, representing Chinese technology companies.',
    'SETFGOLD.NS': 'Gold ETF - Tracks the price of gold, providing exposure to gold as an asset class.',
    'SILVER1.NS': 'Silver ETF - Tracks the price of silver, providing exposure to silver as an asset class.',
    'CPSEETF.NS': 'CPSE ETF - Tracks the Nifty CPSE index, representing central public sector enterprises.',
    'MOCAPITAL.NS': 'Capital Markets ETF - Tracks companies in the capital markets sector.',
    'BFSI.NS': 'BFSI ETF - Tracks the banking, financial services, and insurance sector.',
    'INTERNET.NS': 'Internet ETF - Tracks internet and technology companies.',
    'EVINDIA.NS': 'EV India ETF - Tracks electric vehicle and related companies in India.',
    'GROWWPOWER.NS': 'Power ETF - Tracks the power sector companies.',
    'OILIETF.NS': 'Oil & Gas ETF - Tracks oil and gas sector companies.',
    'GROWWRAIL.NS': 'Railways ETF - Tracks railway infrastructure and related companies.',
    'MODEFENCE.NS': 'Defence ETF - Tracks defence and aerospace companies.',
    'MOMGF.NS': 'Manufacturing ETF - Tracks manufacturing sector companies.',
    'HEALTHY.NS': 'Healthcare ETF - Tracks healthcare and pharmaceutical companies.',
    'MOREALTY.NS': 'Realty ETF - Tracks real estate and construction companies.',
    'PVTBANIETF.NS': 'Private Bank ETF - Tracks private sector banks.',
  };
  
  return descriptions[symbol] || null;
};

export const getETFCategory = (symbol) => {
  const categories = {
    'NIFTYBEES.NS': 'Broad Market',
    'BANKBEES.NS': 'Banking',
    'GOLDBEES.NS': 'Precious Metals',
    'ITBEES.NS': 'Technology',
    'AUTOBEES.NS': 'Automotive',
    'FMCGIETF.NS': 'Consumer Goods',
    'PHARMABEES.NS': 'Healthcare',
    'ENERGYIETF.NS': 'Energy',
    'METALIETF.NS': 'Materials',
    'REALTYIETF.NS': 'Real Estate',
    'PSUBNKBEES.NS': 'Banking',
    'CONSUMBEES.NS': 'Consumer',
    'NEXT50IETF.NS': 'Broad Market',
    'MON100.NS': 'International',
    'MAFANG.NS': 'International',
    'HNGSNGBEES.NS': 'International',
    'SETFGOLD.NS': 'Precious Metals',
    'SILVER1.NS': 'Precious Metals',
    'CPSEETF.NS': 'Government',
    'MOCAPITAL.NS': 'Financial Services',
    'BFSI.NS': 'Financial Services',
    'INTERNET.NS': 'Technology',
    'EVINDIA.NS': 'Automotive',
    'GROWWPOWER.NS': 'Utilities',
    'OILIETF.NS': 'Energy',
    'GROWWRAIL.NS': 'Infrastructure',
    'MODEFENCE.NS': 'Defence',
    'MOMGF.NS': 'Manufacturing',
    'HEALTHY.NS': 'Healthcare',
    'MOREALTY.NS': 'Real Estate',
    'PVTBANIETF.NS': 'Banking',
  };
  
  return categories[symbol] || 'Other';
};
