/**
 * Seed tracker → parent-company map.
 *
 * Hand-curated starter set covering the most common trackers so the extension
 * is useful on day one. Keys are registrable domains (eTLD+1).
 */

export interface TrackerInfo {
  entity: string;
  category?: 'Advertising' | 'Analytics' | 'Social' | 'Customer data' | 'Tag manager' | 'Session replay';
  /**
   * Essential third parties (payments, CDNs, error/perf monitoring) are recognized and named,
   * but NOT counted as "tracking you": excluded from tracker counts, privacy-score penalties,
   * and, critically, violation detection. They collect data for function/risk, not ad targeting,
   * so flagging a Stripe or Sentry cookie as an illegal post-Reject violation would be a false alarm.
   */
  essential?: boolean;
}

export const TRACKERS: Record<string, TrackerInfo> = {
  // ── Google / Alphabet ───────────────────────────────────────────────
  'doubleclick.net': { entity: 'Google (Alphabet)', category: 'Advertising' },
  'google-analytics.com': { entity: 'Google (Alphabet)', category: 'Analytics' },
  'googletagmanager.com': { entity: 'Google (Alphabet)', category: 'Tag manager' },
  'googlesyndication.com': { entity: 'Google (Alphabet)', category: 'Advertising' },
  'googleadservices.com': { entity: 'Google (Alphabet)', category: 'Advertising' },
  'g.doubleclick.net': { entity: 'Google (Alphabet)', category: 'Advertising' },
  'app-measurement.com': { entity: 'Google (Alphabet)', category: 'Analytics' },
  // gstatic is Google's static asset / font CDN, present on much of the web, not an ad tracker.
  'gstatic.com': { entity: 'Google (Alphabet)', essential: true },
  'googletagservices.com': { entity: 'Google (Alphabet)', category: 'Tag manager' },

  // ── Meta ────────────────────────────────────────────────────────────
  'facebook.com': { entity: 'Meta', category: 'Social' },
  'facebook.net': { entity: 'Meta', category: 'Advertising' },
  'fbcdn.net': { entity: 'Meta', category: 'Social' },
  'instagram.com': { entity: 'Meta', category: 'Social' },
  'connect.facebook.net': { entity: 'Meta', category: 'Advertising' },

  // ── Amazon ──────────────────────────────────────────────────────────
  'amazon-adsystem.com': { entity: 'Amazon', category: 'Advertising' },
  'serving-sys.com': { entity: 'Amazon (Sizmek)', category: 'Advertising' },
  'assoc-amazon.com': { entity: 'Amazon', category: 'Advertising' },
  'media-amazon.com': { entity: 'Amazon', category: 'Advertising' },

  // ── Microsoft ───────────────────────────────────────────────────────
  'bing.com': { entity: 'Microsoft', category: 'Advertising' },
  'clarity.ms': { entity: 'Microsoft', category: 'Session replay' },
  'adnxs.com': { entity: 'Microsoft (Xandr)', category: 'Advertising' },
  'appnexus.com': { entity: 'Microsoft (Xandr)', category: 'Advertising' },
  'linkedin.com': { entity: 'Microsoft (LinkedIn)', category: 'Social' },
  'licdn.com': { entity: 'Microsoft (LinkedIn)', category: 'Advertising' },
  'microsoft.com': { entity: 'Microsoft', category: 'Analytics' },
  'msads.net': { entity: 'Microsoft', category: 'Advertising' },
  'atdmt.com': { entity: 'Microsoft', category: 'Advertising' },

  // ── Adobe ───────────────────────────────────────────────────────────
  'demdex.net': { entity: 'Adobe', category: 'Advertising' },
  'omtrdc.net': { entity: 'Adobe', category: 'Analytics' },
  '2o7.net': { entity: 'Adobe', category: 'Analytics' },
  'everesttech.net': { entity: 'Adobe', category: 'Advertising' },
  'adobedtm.com': { entity: 'Adobe', category: 'Tag manager' },
  'adobedc.net': { entity: 'Adobe', category: 'Analytics' },
  'scene7.com': { entity: 'Adobe', category: 'Analytics' },

  // ── Oracle ──────────────────────────────────────────────────────────
  'bluekai.com': { entity: 'Oracle', category: 'Advertising' },
  'moatads.com': { entity: 'Oracle (Moat)', category: 'Advertising' },
  'addthis.com': { entity: 'Oracle (AddThis)', category: 'Social' },
  'eloqua.com': { entity: 'Oracle', category: 'Customer data' },
  'oracleinfinity.io': { entity: 'Oracle', category: 'Analytics' },

  // ── Salesforce ──────────────────────────────────────────────────────
  'krxd.net': { entity: 'Salesforce (Krux)', category: 'Advertising' },
  'salesforceliveagent.com': { entity: 'Salesforce', category: 'Customer data' },
  'pardot.com': { entity: 'Salesforce', category: 'Customer data' },
  'exacttarget.com': { entity: 'Salesforce', category: 'Customer data' },

  // ── X / Twitter ─────────────────────────────────────────────────────
  'twitter.com': { entity: 'X (Twitter)', category: 'Social' },
  'x.com': { entity: 'X (Twitter)', category: 'Social' },
  'ads-twitter.com': { entity: 'X (Twitter)', category: 'Advertising' },
  't.co': { entity: 'X (Twitter)', category: 'Social' },
  'twimg.com': { entity: 'X (Twitter)', category: 'Social' },

  // ── ByteDance / TikTok ──────────────────────────────────────────────
  'tiktok.com': { entity: 'ByteDance (TikTok)', category: 'Social' },
  'tiktokcdn.com': { entity: 'ByteDance (TikTok)', category: 'Advertising' },
  'byteoverseas.com': { entity: 'ByteDance (TikTok)', category: 'Advertising' },

  // ── Snap ────────────────────────────────────────────────────────────
  'snapchat.com': { entity: 'Snap', category: 'Social' },
  'sc-static.net': { entity: 'Snap', category: 'Advertising' },
  'snapkit.com': { entity: 'Snap', category: 'Advertising' },

  // ── Pinterest ───────────────────────────────────────────────────────
  'pinterest.com': { entity: 'Pinterest', category: 'Social' },
  'pinimg.com': { entity: 'Pinterest', category: 'Advertising' },

  // ── Reddit ──────────────────────────────────────────────────────────
  'reddit.com': { entity: 'Reddit', category: 'Social' },
  'redditstatic.com': { entity: 'Reddit', category: 'Advertising' },
  'redd.it': { entity: 'Reddit', category: 'Social' },

  // ── Yahoo / Verizon ─────────────────────────────────────────────────
  'yahoo.com': { entity: 'Yahoo', category: 'Advertising' },
  'yahooapis.com': { entity: 'Yahoo', category: 'Advertising' },
  'yimg.com': { entity: 'Yahoo', category: 'Advertising' },
  'gemini.yahoo.com': { entity: 'Yahoo', category: 'Advertising' },
  'oath.com': { entity: 'Yahoo', category: 'Advertising' },

  // ── Ad exchanges / RTB ──────────────────────────────────────────────
  'criteo.com': { entity: 'Criteo', category: 'Advertising' },
  'criteo.net': { entity: 'Criteo', category: 'Advertising' },
  'adsrvr.org': { entity: 'The Trade Desk', category: 'Advertising' },
  'rubiconproject.com': { entity: 'Magnite', category: 'Advertising' },
  'spotxchange.com': { entity: 'Magnite', category: 'Advertising' },
  'pubmatic.com': { entity: 'PubMatic', category: 'Advertising' },
  'openx.net': { entity: 'OpenX', category: 'Advertising' },
  'casalemedia.com': { entity: 'Index Exchange', category: 'Advertising' },
  'smartadserver.com': { entity: 'Equativ', category: 'Advertising' },
  'adform.net': { entity: 'Adform', category: 'Advertising' },
  'mathtag.com': { entity: 'MediaMath', category: 'Advertising' },
  'bidswitch.net': { entity: 'IPONWEB', category: 'Advertising' },
  'teads.tv': { entity: 'Teads', category: 'Advertising' },
  'gumgum.com': { entity: 'GumGum', category: 'Advertising' },
  'yieldmo.com': { entity: 'Yieldmo', category: 'Advertising' },
  'doubleverify.com': { entity: 'DoubleVerify', category: 'Advertising' },
  'rtbhouse.com': { entity: 'RTB House', category: 'Advertising' },
  'creativecdn.com': { entity: 'RTB House', category: 'Advertising' },
  'triplelift.com': { entity: 'TripleLift', category: 'Advertising' },
  '33across.com': { entity: '33Across', category: 'Advertising' },
  'adroll.com': { entity: 'NextRoll (AdRoll)', category: 'Advertising' },
  'smaato.net': { entity: 'Smaato', category: 'Advertising' },
  'sharethrough.com': { entity: 'Sharethrough', category: 'Advertising' },
  'lijit.com': { entity: 'Sovrn', category: 'Advertising' },
  'sovrn.com': { entity: 'Sovrn', category: 'Advertising' },
  'media.net': { entity: 'Media.net', category: 'Advertising' },
  'kargo.com': { entity: 'Kargo', category: 'Advertising' },
  'improvedigital.com': { entity: 'Improve Digital', category: 'Advertising' },
  'undertone.com': { entity: 'Perion (Undertone)', category: 'Advertising' },
  'integralads.com': { entity: 'Integral Ad Science', category: 'Advertising' },
  'iasds01.com': { entity: 'Integral Ad Science', category: 'Advertising' },
  'taboola.com': { entity: 'Taboola', category: 'Advertising' },
  'outbrain.com': { entity: 'Outbrain', category: 'Advertising' },

  // ── Identity & data brokers ─────────────────────────────────────────
  'crwdcntrl.net': { entity: 'Lotame', category: 'Advertising' },
  'lotame.com': { entity: 'Lotame', category: 'Advertising' },
  'rlcdn.com': { entity: 'LiveRamp', category: 'Advertising' },
  'liveramp.com': { entity: 'LiveRamp', category: 'Advertising' },
  'agkn.com': { entity: 'TransUnion (Neustar)', category: 'Advertising' },
  'eyeota.net': { entity: 'Dun & Bradstreet', category: 'Advertising' },
  'tapad.com': { entity: 'Experian (Tapad)', category: 'Advertising' },
  'liveintent.com': { entity: 'LiveIntent', category: 'Advertising' },
  'servedby-liveintent.com': { entity: 'LiveIntent', category: 'Advertising' },
  'bombora.com': { entity: 'Bombora', category: 'Advertising' },
  'id5.io': { entity: 'ID5', category: 'Advertising' },
  'audigent.com': { entity: 'Audigent', category: 'Advertising' },
  'acxiom.com': { entity: 'Acxiom', category: 'Advertising' },
  'epsilon.com': { entity: 'Epsilon', category: 'Advertising' },
  'conversantmedia.com': { entity: 'Epsilon', category: 'Advertising' },
  'merkle.com': { entity: 'Merkle', category: 'Advertising' },

  // ── Analytics & product ─────────────────────────────────────────────
  'scorecardresearch.com': { entity: 'Comscore', category: 'Analytics' },
  'comscore.com': { entity: 'Comscore', category: 'Analytics' },
  'quantserve.com': { entity: 'Quantcast', category: 'Analytics' },
  'quantcast.com': { entity: 'Quantcast', category: 'Analytics' },
  'hotjar.com': { entity: 'Contentsquare (Hotjar)', category: 'Session replay' },
  'fullstory.com': { entity: 'FullStory', category: 'Session replay' },
  'mouseflow.com': { entity: 'Mouseflow', category: 'Session replay' },
  'crazyegg.com': { entity: 'Crazy Egg', category: 'Session replay' },
  'mixpanel.com': { entity: 'Mixpanel', category: 'Analytics' },
  'amplitude.com': { entity: 'Amplitude', category: 'Analytics' },
  'segment.com': { entity: 'Twilio (Segment)', category: 'Customer data' },
  'segment.io': { entity: 'Twilio (Segment)', category: 'Customer data' },
  'optimizely.com': { entity: 'Optimizely', category: 'Analytics' },
  'branch.io': { entity: 'Branch', category: 'Analytics' },
  'appsflyer.com': { entity: 'AppsFlyer', category: 'Analytics' },
  'newrelic.com': { entity: 'New Relic', category: 'Analytics', essential: true },
  'nr-data.net': { entity: 'New Relic', category: 'Analytics', essential: true },
  'heapanalytics.com': { entity: 'Heap', category: 'Analytics' },
  'heap.io': { entity: 'Heap', category: 'Analytics' },
  'vwo.com': { entity: 'VWO', category: 'Analytics' },
  'chartbeat.com': { entity: 'Chartbeat', category: 'Analytics' },
  'chartbeat.net': { entity: 'Chartbeat', category: 'Analytics' },
  'parsely.com': { entity: 'Parse.ly', category: 'Analytics' },
  'permutive.com': { entity: 'Permutive', category: 'Analytics' },
  'permutive.app': { entity: 'Permutive', category: 'Analytics' },
  'posthog.com': { entity: 'PostHog', category: 'Analytics' },
  'pendo.io': { entity: 'Pendo', category: 'Analytics' },
  'cdn.pendo.io': { entity: 'Pendo', category: 'Analytics' },
  'adjust.com': { entity: 'Adjust', category: 'Analytics' },
  'adjust.net': { entity: 'Adjust', category: 'Analytics' },

  // ── Session replay ──────────────────────────────────────────────────
  'logrocket.com': { entity: 'LogRocket', category: 'Session replay' },
  'lr-ingest.io': { entity: 'LogRocket', category: 'Session replay' },
  'smartlook.com': { entity: 'Smartlook', category: 'Session replay' },
  'luckyorange.com': { entity: 'Lucky Orange', category: 'Session replay' },
  'inspectlet.com': { entity: 'Inspectlet', category: 'Session replay' },

  // ── Customer data / CRM ─────────────────────────────────────────────
  'tiqcdn.com': { entity: 'Tealium', category: 'Tag manager' },
  'tealium.com': { entity: 'Tealium', category: 'Tag manager' },
  'tealiumiq.com': { entity: 'Tealium', category: 'Tag manager' },
  'mparticle.com': { entity: 'mParticle', category: 'Customer data' },
  'braze.com': { entity: 'Braze', category: 'Customer data' },
  'appboy.com': { entity: 'Braze', category: 'Customer data' },
  'klaviyo.com': { entity: 'Klaviyo', category: 'Customer data' },
  'hs-analytics.net': { entity: 'HubSpot', category: 'Customer data' },
  'hsadspixel.net': { entity: 'HubSpot', category: 'Advertising' },
  'hsforms.com': { entity: 'HubSpot', category: 'Customer data' },
  'hscollectedforms.net': { entity: 'HubSpot', category: 'Customer data' },
  'hubspot.com': { entity: 'HubSpot', category: 'Customer data' },
  'intercom.io': { entity: 'Intercom', category: 'Customer data' },
  'intercomcdn.com': { entity: 'Intercom', category: 'Customer data' },
  'zdassets.com': { entity: 'Zendesk', category: 'Customer data' },
  'zendesk.com': { entity: 'Zendesk', category: 'Customer data' },
  'drip.com': { entity: 'Drip', category: 'Customer data' },
  'drift.com': { entity: 'Drift', category: 'Customer data' },

  // ── Consent & verification (essential, these RUN the banner; the cookie
  //    they set after you click Reject is the record of your rejection, not tracking) ──
  'onetrust.com': { entity: 'OneTrust', essential: true },
  'cookiepro.com': { entity: 'OneTrust', essential: true },
  'sp-prod.net': { entity: 'Sourcepoint', essential: true },
  'sourcepoint.com': { entity: 'Sourcepoint', essential: true },
  'usercentrics.eu': { entity: 'Usercentrics', essential: true },
  'cookiefirst.com': { entity: 'CookieFirst', essential: true },
  'cookiebot.com': { entity: 'Cookiebot', essential: true },
  'cookie-script.com': { entity: 'CookieScript', essential: true },

  // ── Additional ad-tech (category coverage, were surfacing as "Other/LOW") ──
  'inmobi.com': { entity: 'InMobi', category: 'Advertising' },
  'ogury.com': { entity: 'Ogury', category: 'Advertising' },
  'ogury.io': { entity: 'Ogury', category: 'Advertising' },
  'presage.io': { entity: 'Ogury', category: 'Advertising' },
  'connatix.com': { entity: 'Connatix', category: 'Advertising' },
  'vidazoo.com': { entity: 'Vidazoo', category: 'Advertising' },
  'onetag.com': { entity: 'OneTag', category: 'Advertising' },
  'onetag-sys.com': { entity: 'OneTag', category: 'Advertising' },
  'richaudience.com': { entity: 'Rich Audience', category: 'Advertising' },
  'smilewanted.com': { entity: 'SmileWanted', category: 'Advertising' },
  'connectad.io': { entity: 'ConnectAd', category: 'Advertising' },
  'ironsrc.com': { entity: 'Unity (ironSource)', category: 'Advertising' },
  'is-ad.com': { entity: 'Unity (ironSource)', category: 'Advertising' },
  'id5-sync.com': { entity: 'ID5', category: 'Advertising' },

  // ── Error monitoring & observability (essential, not ad tracking) ───
  'sentry.io': { entity: 'Sentry', category: 'Analytics', essential: true },
  'ingest.sentry.io': { entity: 'Sentry', category: 'Analytics', essential: true },
  'sentry-cdn.com': { entity: 'Sentry', essential: true },
  'datadoghq.com': { entity: 'Datadog', category: 'Analytics', essential: true },
  'browser-intake-datadoghq.com': { entity: 'Datadog', category: 'Analytics', essential: true },

  // ── Feature management (essential, functional flags, not ad tracking) ──
  'launchdarkly.com': { entity: 'LaunchDarkly', essential: true },
  'eventsource.io': { entity: 'LaunchDarkly', essential: true },

  // ── Publisher / content ─────────────────────────────────────────────
  'pixel.wp.com': { entity: 'Automattic', category: 'Analytics' },
  'stats.wp.com': { entity: 'Automattic', category: 'Analytics' },

  // ── Infrastructure & payments ────────────────────────────────────────
  'yandex.ru': { entity: 'Yandex', category: 'Analytics' },
  'mc.yandex.ru': { entity: 'Yandex', category: 'Analytics' },
  // CDN, payments, recognized but essential (not ad tracking).
  'cloudflareinsights.com': { entity: 'Cloudflare', category: 'Analytics', essential: true },
  'stripe.com': { entity: 'Stripe', essential: true },
  'stripe.network': { entity: 'Stripe', essential: true },
  'js.stripe.com': { entity: 'Stripe', essential: true },
  'paypal.com': { entity: 'PayPal', essential: true },
  'paypalobjects.com': { entity: 'PayPal', essential: true },
};
