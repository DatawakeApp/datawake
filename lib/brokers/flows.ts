/**
 * Curated, best-known "where your data goes" notes for major entities. Factual and
 * non-alarmist; framed as best-known industry behaviour, not an authoritative graph.
 */

export type Sharing = 'sells' | 'shares' | 'internal';

export interface DataFlow {
  role: string;
  /** Plain-language: what actually happens to your data. */
  flow: string;
  sharing: Sharing;
}

const sell = (role: string, flow: string): DataFlow => ({ role, flow, sharing: 'sells' });
const share = (role: string, flow: string): DataFlow => ({ role, flow, sharing: 'shares' });
const internal = (role: string, flow: string): DataFlow => ({ role, flow, sharing: 'internal' });

export const FLOWS: Record<string, DataFlow> = {
  // ── Big platforms ──
  'Google (Alphabet)': share(
    'Ad platform & analytics',
    'Builds a profile across its services and millions of sites, and runs real-time ad auctions that broadcast page and audience signals to many bidders.',
  ),
  Meta: share('Social ads platform', 'Links your browsing to your Facebook/Instagram identity via the Meta Pixel to target ads.'),
  Amazon: share('Retail ad network', 'Combines retail, device and browsing signals into an ad and identity graph used to target you.'),
  Microsoft: share('Ads, analytics & identity', 'Combines Bing, Xandr, LinkedIn and Clarity signals to target ads and measure behaviour.'),
  'Microsoft (Xandr)': sell('Ad exchange (RTB)', 'Runs real-time bidding; your identifiers and context are sent to many buyers, and audience data is bought and sold.'),
  'Microsoft (LinkedIn)': share('Professional social ads', 'Tracks visits to target ads based on your professional profile.'),
  Yahoo: sell('Ad platform & exchange', 'Runs an ad exchange and sells audience data built from its media and ad reach.'),
  Yandex: share('Search ads & analytics', 'Metrica analytics and its ad network profile you across sites.'),

  // ── Ad exchanges & platforms ──
  'The Trade Desk': sell('Demand-side ad platform', 'Buys ad space targeted at you in real time, ingests third-party data, and promotes its UID2 identity graph.'),
  Criteo: sell('Retargeting ad network', 'Tracks products you view to follow you with ads, trading audience data with partners.'),
  'RTB House': sell('Retargeting', 'Follows you with personalised ads using deep-learning real-time bidding.'),
  Magnite: sell('Ad exchange (RTB)', 'Largest independent sell-side platform; runs real-time bidding auctions on pages you visit.'),
  PubMatic: sell('Ad exchange (RTB)', 'Sell-side platform running real-time bidding auctions and audience data.'),
  'Index Exchange': sell('Ad exchange (RTB)', 'Runs real-time bidding; your identifiers and context are broadcast to many buyers.'),
  OpenX: sell('Ad exchange (RTB)', 'Runs real-time bidding auctions and an audience-data marketplace.'),
  Equativ: sell('Ad exchange (RTB)', 'European sell-side platform running real-time bidding auctions.'),
  Sharethrough: sell('Ad exchange (RTB)', 'Native-ad exchange broadcasting your context to buyers in real time.'),
  Sovrn: sell('Ad exchange (RTB)', 'Publisher sell-side platform and data company.'),
  MediaMath: sell('Demand-side ad platform', 'Buys targeted ads for you in real time using third-party audience data.'),
  Teads: sell('Ad marketplace (RTB)', 'Video-ad marketplace running real-time bidding.'),
  Adform: sell('Ad platform & identity', 'Buy/sell ad platform with its own cross-site identity solution.'),
  TripleLift: sell('Ad exchange (RTB)', 'Native programmatic exchange running real-time bidding.'),
  '33Across': sell('Ad platform & identity', 'Programmatic ads plus a cross-site identity graph.'),
  'NextRoll (AdRoll)': sell('Retargeting', 'Retargets and prospects you with ads across the web.'),
  Smaato: sell('Mobile ad exchange', 'Mobile real-time bidding exchange.'),
  Kargo: sell('Mobile ad marketplace', 'Sells branded ad formats via programmatic auctions targeting mobile audiences.'),
  GumGum: share('Contextual ads', 'Reads page content to place ads; less reliant on your identity.'),
  Taboola: share('Content-recommendation network', 'Profiles your interests to recommend paid links and target ads.'),
  Outbrain: share('Content-recommendation network', 'Profiles your interests to recommend paid links and target ads.'),

  // ── Identity & data brokers ──
  LiveRamp: sell('Identity resolution / broker', 'Links your identifiers across companies and sells “matched” audiences to advertisers and platforms.'),
  Acxiom: sell('Data broker', 'Compiles and sells detailed consumer profiles to marketers.'),
  Experian: sell('Credit bureau & broker', 'Sells marketing audiences built from consumer data.'),
  Equifax: sell('Credit bureau & broker', 'Monetises consumer data for marketing.'),
  TransUnion: sell('Credit bureau & broker', 'Sells identity and marketing data, including via Neustar.'),
  'TransUnion (Neustar)': sell('Identity & marketing data', 'Resolves your identity and sells marketing data.'),
  Epsilon: sell('Marketing data broker', 'Sells email- and identity-based marketing audiences.'),
  Merkle: sell('Marketing data & identity', 'Builds and sells data-driven audiences (Dentsu).'),
  'Dun & Bradstreet': sell('B2B data broker', 'Sells business and audience segments (via Eyeota).'),
  'Experian (Tapad)': sell('Cross-device identity', 'Links your devices into one profile sold to advertisers.'),
  Lotame: sell('Data marketplace', 'Buys and sells audience segments about you.'),
  Audigent: sell('Data/identity curation', 'Packages and sells audience data to advertisers.'),
  ID5: share('Shared ad identity', 'Gives you a shared ID so many sites can recognise and target you.'),
  LiveIntent: sell('Email-identity ads', 'Targets ads using email-based identity.'),
  Bombora: sell('B2B intent data broker', 'Sells “intent” data about what companies and people are researching.'),

  // ── Analytics & experimentation ──
  Adobe: share('Marketing & analytics cloud', 'Audience Manager and Analytics build and share audience segments for brands.'),
  Comscore: sell('Audience measurement', "Estimates who is in a site's audience and sells ratings and segments."),
  Nielsen: sell('Audience measurement', 'Measures audiences and sells ratings and segments.'),
  Quantcast: sell('Audience measurement & ads', 'Builds audience profiles and sells targeting and measurement.'),
  Mixpanel: share('Product analytics', 'Tracks your events to profile product usage for the site owner.'),
  Amplitude: share('Product analytics', 'Builds behavioural profiles from your events.'),
  Heap: share('Product analytics', 'Auto-records all interactions to analyse your behaviour.'),
  PostHog: internal('Product analytics', 'Open-source product analytics; data stays with the site owner.'),
  Pendo: internal('Product analytics & guidance', 'Tracks your interactions to analyse product usage.'),
  Optimizely: share('Experimentation', 'Profiles you to vary content in A/B tests.'),
  VWO: share('Experimentation', 'A/B testing and behavioural analytics.'),
  Chartbeat: share('Content analytics', 'Measures reading behaviour for publishers.'),
  'Parse.ly': share('Content analytics', 'Measures content engagement for publishers.'),
  Permutive: share('Audience platform', 'Builds first-party audience segments from your behaviour and shares them with advertisers.'),
  'Contentsquare (Hotjar)': share('Session replay', 'Records on-page behaviour and heatmaps.'),
  FullStory: share('Session replay', 'Can record detailed on-page behaviour.'),
  Mouseflow: share('Session replay', 'Records sessions and heatmaps.'),
  'Crazy Egg': share('Session replay', 'Heatmaps and session recordings.'),
  LogRocket: share('Session replay', 'Records your browser session and reports it to the site owner.'),
  Smartlook: share('Session replay', 'Records sessions and builds heatmaps from user behaviour.'),
  Adjust: internal('Mobile attribution', 'Tracks app installs and in-app events for mobile advertisers.'),
  AppsFlyer: internal('Mobile attribution', 'Tracks mobile install sources and in-app events.'),
  Branch: internal('Mobile linking', 'Deep-link attribution for mobile apps.'),
  LaunchDarkly: internal('Feature management', 'Tracks which feature flags are shown to you.'),
  'New Relic': internal('Performance monitoring', 'Monitors performance; can capture some user signals.'),
  Datadog: internal('Monitoring', 'Observability tooling; its RUM may capture interactions.'),
  Sentry: internal('Error monitoring', 'Captures errors and session context.'),

  // ── Customer data, CRM & chat ──
  'Twilio (Segment)': share('Customer-data platform', "Collects your behaviour and routes it into a company's other tools."),
  Tealium: share('Customer-data platform', 'Routes your data into many other marketing and analytics tools.'),
  mParticle: share('Customer-data platform', "Unifies and forwards your activity across a company's apps."),
  Braze: share('Engagement platform', 'Profiles you to send targeted messages.'),
  Klaviyo: share('Marketing platform', 'Profiles shoppers for email and SMS targeting.'),
  Intercom: share('Support & messaging', 'Tracks your activity to build customer profiles.'),
  HubSpot: share('Marketing & CRM', 'Tracks visitors to build lead profiles.'),
  Drift: share('Conversational marketing', 'Tracks engagement to qualify leads and personalise chat responses.'),
  Salesforce: share('CRM & marketing cloud', 'Unifies and activates customer data across channels.'),
  'Salesforce (Krux)': sell('Data platform (DMP)', 'Builds and shares audience segments about you.'),
  Zendesk: internal('Customer support', 'Support and chat widgets that see your activity.'),

  // ── Social ──
  'ByteDance (TikTok)': share('Social ads platform', 'Its pixel tracks conversions and builds ad-targeting profiles.'),
  'X (Twitter)': share('Social ads platform', 'Tracks visits via its pixel to target ads and link activity to your account.'),
  Snap: share('Social ads platform', 'Its pixel tracks conversions for Snapchat ad targeting.'),
  Pinterest: share('Social ads platform', 'Its tag tracks conversions to target ads.'),
  Reddit: share('Social ads platform', 'Its pixel tracks conversions to target ads.'),

  // ── Consent & verification ──
  OneTrust: internal('Consent platform', 'Manages consent banners; also present as a tracker on many sites.'),
  Sourcepoint: internal('Consent management', 'Manages consent and privacy compliance flows for publishers.'),
  Usercentrics: internal('Consent platform', 'EU consent-management platform; present as a script on many sites.'),
  DoubleVerify: share('Ad verification', 'Measures and fingerprints ad views and viewability.'),
  'Integral Ad Science': share('Ad verification', 'Measures ad viewability and context; shares signals with publishers.'),

  // ── Infrastructure & payments ──
  Cloudflare: internal('Infrastructure / CDN', 'Delivers content and security; sees your IP but markets privacy-preserving analytics.'),
  Akamai: internal('CDN / security', 'Delivers content and security; sees your requests.'),
  Fastly: internal('CDN', 'Delivers content; sees your requests.'),
  Stripe: internal('Payments & fraud', 'Processes payments and runs fraud checks; collects device signals for risk, not ad targeting.'),
  PayPal: internal('Payments', 'Processes payments and fraud checks.'),
  Automattic: share('Publishing & analytics', 'Runs analytics across many sites via Jetpack and Parse.ly.'),
};

export function dataFlow(entity: string): DataFlow | null {
  return FLOWS[entity] ?? null;
}

const SHARING_LABEL: Record<Sharing, string> = {
  sells: 'Sells or brokers your data',
  shares: 'Shares your data for targeting',
  internal: 'Mostly uses data internally',
};

export function sharingLabel(s: Sharing): string {
  return SHARING_LABEL[s];
}

const SHARING_COLOR: Record<Sharing, string> = {
  sells: '#f1707a',
  shares: '#ffb066',
  internal: '#8a94a6',
};

export function sharingColor(s: Sharing): string {
  return SHARING_COLOR[s];
}
