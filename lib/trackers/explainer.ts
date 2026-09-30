import { categoryDoes } from './categories';

/**
 * Plain-language notes on who a company is. Category-level "what it does to you"
 * lives in categories.ts; this file is the entity-level "who".
 */

const ENTITY_NOTES: Record<string, string> = {
  // ── Big platforms ──
  'Google (Alphabet)':
    "The world's largest advertising and analytics company; combines data across Search, YouTube, Android, Chrome, Maps and millions of websites.",
  Meta: "Facebook and Instagram's parent. Tracks you across the web via Like buttons and the Meta Pixel to target ads.",
  Amazon: 'Runs a fast-growing ad network and identity graph on top of its retail and AWS cloud reach.',
  Microsoft: 'Owns LinkedIn, Bing, the Xandr ad exchange and Clarity session-replay tool.',
  'Microsoft (Xandr)': "Microsoft's ad exchange (formerly AppNexus) -- buys and sells ad space targeted at you in real time.",
  'Microsoft (LinkedIn)': "LinkedIn's tracking, used to target ads based on your professional profile.",
  Apple: 'Runs ads and analytics on its own services; generally more privacy-restrictive than its peers.',
  Yahoo: 'Ad-tech and media group; runs an ad exchange, Gemini ad platform, and audience data business.',
  Yandex: "Russia's largest search and ad company; Metrica analytics and its ad network track you across sites.",
  Baidu: "China's largest search and ad company; analytics and ad tracking across sites.",

  // ── Ad platforms & exchanges ──
  'The Trade Desk': 'One of the largest independent ad platforms; bids to show you ads in real time and promotes its UID2 identity graph.',
  Criteo: 'Retargeting company. It runs the ads that "follow you" after you look at a product online.',
  'RTB House': 'Retargeting company using deep-learning to follow you with personalised ads.',
  Magnite: 'The largest independent sell-side ad platform (Rubicon + Telaria + SpotX); runs real-time bidding auctions.',
  PubMatic: 'Sell-side ad platform running real-time bidding auctions on the pages you visit.',
  'Index Exchange': 'Ad exchange running real-time bidding; broadcasts your context to many buyers simultaneously.',
  OpenX: 'Ad exchange and audience-data marketplace running real-time bidding.',
  Equativ: 'European sell-side ad platform (formerly Smart Adserver) running real-time bidding.',
  Sharethrough: 'Ad exchange specialising in native, in-feed ads via real-time bidding.',
  Sovrn: 'Sell-side ad platform and data company for publishers.',
  MediaMath: 'Demand-side ad platform that buys targeted ads in real time (now Infillion).',
  'Media.net': 'Contextual and display ad network powering Yahoo/Bing marketplace ads.',
  Teads: 'Video and outstream ad marketplace running real-time bidding.',
  Adform: 'European ad platform and identity solution spanning both buy and sell sides.',
  GumGum: 'Contextual advertising company that analyses page content to place ads without relying on your identity.',
  Yieldmo: 'Ad exchange focused on attention and ad-format optimisation.',
  TripleLift: 'Native and programmatic ad exchange running real-time bidding.',
  '33Across': 'Programmatic ad platform and cross-site identity ("Lexicon") provider.',
  'NextRoll (AdRoll)': 'Retargeting and prospecting ad platform (AdRoll).',
  Smaato: 'Mobile-focused ad exchange.',
  Kargo: 'Mobile-focused ad marketplace with branded ad formats.',
  'Improve Digital': 'European sell-side programmatic ad platform.',
  'Perion (Undertone)': 'Performance and branded advertising platform.',
  'Integral Ad Science': 'Ad verification and measurement firm that scores ad viewability and brand safety.',
  DoubleVerify: 'Ad verification and measurement company that fingerprints ad views and viewability.',
  Taboola: 'Content-recommendation network ("around the web") that profiles your interests to push paid links.',
  Outbrain: 'Content-recommendation network that profiles your interests to push paid links.',
  IPONWEB: 'Ad-tech infrastructure company; its BidSwitch routes bids between many SSPs and DSPs.',

  // ── Identity & data brokers ──
  LiveRamp: 'Identity-resolution company that links your identifiers across companies and sells "matched" audiences.',
  Acxiom: 'One of the oldest and largest data brokers; compiles and sells detailed consumer profiles (owned by IPG).',
  Experian: 'Credit bureau and major data broker selling marketing audiences.',
  Equifax: 'Credit bureau that also monetises consumer data for marketing.',
  TransUnion: "Credit bureau and data broker; owns Neustar's marketing and identity business.",
  'TransUnion (Neustar)': 'Neustar (owned by TransUnion) links your identity across services and sells marketing data.',
  Epsilon: 'Marketing data broker and email/identity company (owned by Publicis).',
  Merkle: 'Data-driven marketing and identity company (Dentsu).',
  'Dun & Bradstreet': 'Business-data broker; via Eyeota it sells audience segments.',
  'Experian (Tapad)': 'Tapad (Experian) links your phone, laptop and other devices into one profile.',
  Lotame: 'Data-management platform and audience-data marketplace that buys and sells segments.',
  Audigent: 'Data and identity curation platform that packages audience data for advertisers.',
  ID5: 'A shared advertising identity used across many sites to recognise you persistently.',
  LiveIntent: 'Identity and email-based ad-targeting company.',
  Permutive: 'Publisher data platform that builds first-party audiences from your behaviour without third-party cookies.',
  Bombora: 'Sells business "intent" data about what companies and professionals are researching.',

  // ── Analytics & experimentation ──
  Adobe: 'Marketing and analytics cloud (Audience Manager, Analytics, Target) used by many large brands.',
  Comscore: "Audience-measurement firm that estimates who is in a site's audience and sells ratings and segments.",
  Nielsen: 'Audience-measurement firm that estimates audiences and sells ratings and segments to media buyers.',
  Quantcast: 'Audience-measurement and ad-targeting firm; also offers a consent management platform.',
  Mixpanel: 'Product analytics that tracks events and user journeys inside apps.',
  Amplitude: 'Product analytics that builds behavioural user profiles for product teams.',
  Heap: 'Auto-capture product analytics that records all on-page interactions without manual event setup.',
  'New Relic': 'Application performance monitoring; its RUM (real user monitoring) can capture page and user signals.',
  Datadog: 'Monitoring and observability platform; its browser RUM captures user interactions and errors.',
  Sentry: 'Error monitoring that captures context about your session to help developers debug.',
  Optimizely: 'A/B testing and experimentation platform that profiles you to vary content.',
  VWO: 'A/B testing and behavioural analytics platform.',
  'Quantum Metric': 'Session analytics and replay for enterprises.',
  'Contentsquare (Hotjar)': 'Session-replay and heatmap analytics that records your on-page behaviour.',
  FullStory: 'Session-replay analytics that can record your exact on-page behaviour in detail.',
  Mouseflow: 'Session-replay and heatmap analytics.',
  'Crazy Egg': 'Heatmap and session-recording analytics.',
  LogRocket: 'Session-replay and product analytics that records your browser session.',
  Smartlook: 'Session-replay and analytics tool.',
  'Lucky Orange': 'Heatmaps and session-replay analytics.',
  Chartbeat: 'Real-time content analytics for publishers.',
  'Parse.ly': 'Content analytics for publishers (owned by Automattic).',
  PostHog: 'Open-source product analytics with session recording; can be self-hosted.',
  Pendo: 'Product analytics and in-app guidance tool that tracks your interactions.',
  Adjust: 'Mobile measurement and attribution platform tracking app installs and events.',
  AppsFlyer: 'Mobile attribution and marketing analytics platform.',
  Branch: 'Mobile linking and attribution platform.',
  LaunchDarkly: 'Feature-flag and feature-management platform; tracks which features you see.',

  // ── Customer data, CRM & chat ──
  'Twilio (Segment)': "Customer-data platform that collects your behaviour and routes it to a company's other tools.",
  Tealium: 'Customer-data platform and tag manager that routes your data to other marketing and analytics tools.',
  mParticle: "Customer-data platform that unifies your activity across a company's apps and channels.",
  Braze: 'Customer-engagement and messaging platform that profiles you for targeted campaigns.',
  Klaviyo: 'Marketing platform that profiles shoppers for email and SMS targeting.',
  Intercom: 'Customer messaging and support platform that tracks your activity to build customer profiles.',
  Zendesk: 'Customer-support suite; its chat and help-centre widgets see your activity.',
  HubSpot: 'Marketing and CRM platform that tracks website visitors to build lead profiles.',
  Salesforce: 'CRM and marketing cloud that unifies and activates customer data across channels.',
  'Salesforce (Krux)': "Salesforce's data platform (Krux) building and sharing audience segments.",
  Drift: 'Conversational marketing platform that tracks engagement and qualifies leads.',
  Drip: 'E-commerce CRM and email-marketing platform that tracks shopper behaviour.',

  // ── Consent & verification ──
  OneTrust: 'A cookie banner provider that, ironically, is itself a tracker on many sites.',
  Sourcepoint: 'Consent-management and ad-block analytics company.',
  Usercentrics: 'European consent-management platform for GDPR/ePrivacy compliance.',

  // ── Social ──
  'ByteDance (TikTok)': "TikTok's parent; its pixel tracks conversions and builds ad-targeting profiles.",
  'X (Twitter)': 'Tracks visits via its pixel and embeds to target ads and link activity to your account.',
  Snap: "Snapchat's parent; its pixel tracks conversions for Snapchat ad targeting.",
  Pinterest: 'Tracks conversions via its tag to target ads based on browsing.',
  Reddit: 'Tracks conversions via its pixel to target ads across the web.',

  // ── Infrastructure & payments ──
  Cloudflare: 'Infrastructure and CDN provider; sees your traffic but markets privacy-preserving analytics.',
  Akamai: 'CDN and security infrastructure that sees your web requests.',
  Fastly: 'CDN infrastructure that delivers content and sees your requests.',
  Stripe: 'Payment processing and fraud detection; collects device signals for risk, not ad targeting.',
  PayPal: 'Payments platform; its tracking supports fraud detection and some advertising.',
  Automattic: 'Runs WordPress.com, Jetpack and Parse.ly; analytics across a very large number of sites.',

  // ── Publishing & subscription platforms ──
  'Piano Software': 'Subscription and audience analytics platform used by media companies to track how you read and to gate premium content.',

  // ── Affiliate & commerce ──
  Rakuten: 'Affiliate marketing network (Rakuten Advertising) that tracks purchases and conversions across retailer sites.',
  Conversant: 'Affiliate marketing and personalised-ad platform (CJ Affiliate); tracks purchases and browsing across retailer sites.',
  'Commission Junction': 'Affiliate marketing network (CJ Affiliate by Conversant) that tracks purchases across sites.',
  Intuit: 'Financial software company (TurboTax, QuickBooks, Mint); tracks conversions and usage across its properties.',

  // ── Enterprise data & cloud ──
  Oracle: 'Runs one of the largest data brokers (Oracle Data Cloud / BlueKai) that builds profiles on hundreds of millions of people.',
  IBM: 'Enterprise tech giant; Watson Advertising and Acoustic products offer audience analytics and ad targeting.',
  'Zeta Global': 'AI-powered marketing platform that buys and activates consumer data for targeted advertising.',
  ZOHO: 'Business software suite; its marketing and CRM tools track visits and leads.',

  // ── Publisher ad networks ──
  'Raptive (AdThrive)': 'Premium ad management network for publishers; manages display ads on the sites you visit.',
  Mediavine: 'Ad management network for lifestyle publishers; manages display ads and tracks engagement.',
  Ezoic: 'AI-driven ad management platform for publishers; tests ad layouts using your behaviour.',

  // ── Additional ad-tech ──
  Adkernel: 'White-label ad-serving and SSP infrastructure used by many smaller publishers.',
  Demandbase: 'B2B account-based marketing platform that identifies and targets business visitors by company.',
  Blis: 'Location-data and audience-targeting platform that uses device signals to build behavioural profiles.',
  Siteimprove: 'Digital analytics and accessibility platform; analytics module tracks page visits and behaviour.',
  Webtrekk: 'German web analytics company (now part of Mapp) tracking user behaviour for enterprise publishers.',
  'AB Tasty': 'A/B testing and personalisation platform that varies page content based on your profile.',
  ExoClick: 'High-volume ad network primarily serving entertainment and adult media sites.',
};

export function whoIs(entity: string): string | undefined {
  return ENTITY_NOTES[entity];
}

export interface Explanation {
  who?: string;
  meaning: string;
  category?: string;
}

export function explain(entity: string, category?: string): Explanation {
  return { who: whoIs(entity), meaning: categoryDoes(category), category: category || undefined };
}
