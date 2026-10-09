/**
 * Inline SVG logos for known tracker companies.
 * Patterns are checked case-insensitively against the entity name (substring match).
 * Order matters: more-specific patterns first to avoid mis-matches
 * (e.g. 'linkedin' before 'microsoft', 'tiktok' before 'bytedance').
 */
import { parseSvg } from '../ui/svg';

// Compact builder helpers
const g = (inner: string) =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const bg = (fill: string, r = 4) =>
  `<rect width="24" height="24" rx="${r}" fill="${fill}"/>`;
const txt = (t: string, fill: string, size = 10, x = 4, y = 16.5) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" fill="${fill}" font-family="system-ui,-apple-system,sans-serif">${t}</text>`;

type Entry = readonly [pattern: string, svg: string];

const LOGOS: Entry[] = [
  // ── Specific subsidiaries first ──────────────────────────────────────────

  // Microsoft (LinkedIn)
  ['linkedin', g(
    bg('#0A66C2') +
    '<rect x="5" y="10.5" width="2.5" height="8" fill="#fff"/>' +
    '<circle cx="6.25" cy="7.5" r="1.5" fill="#fff"/>' +
    '<path d="M10.5 10.5v8M10.5 12.5c.6-1.3 1.8-2 3-2 2 0 3 1.3 3 3.5v4.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
  )],

  // ByteDance (TikTok)
  ['tiktok', g(
    bg('#010101') +
    '<path d="M15.5 4.5a4.8 4.8 0 003 1.9V9a7.5 7.5 0 01-3-.7v5.2a4.5 4.5 0 11-4.5-4.5h.5v2.5h-.5a2 2 0 102 2V4.5h2.5z" fill="#fff"/>' +
    '<path d="M15.5 4.5a4.8 4.8 0 003 1.9V9a7.5 7.5 0 01-3-.7v5.2a4.5 4.5 0 11-4.5-4.5h.5v2.5h-.5a2 2 0 102 2V4.5z" fill="#69C9D0" opacity="0.6"/>',
  )],

  // Contentsquare (Hotjar)
  ['hotjar', g(
    bg('#FD3A5C') +
    '<path d="M12 5c-3.9 0-6.5 2.7-6.5 6.2 0 2.1.7 3.8 2 5l-1 2.8 1.4.5.7-2.1A7 7 0 0012 18.5a7 7 0 003.4-.9l.7 2.1 1.4-.5-1-2.8c1.3-1.2 2-2.9 2-5C18.5 7.7 15.9 5 12 5z" fill="white"/>',
  )],

  // Twilio (Segment)
  ['segment', g(
    bg('#52BD95') +
    '<circle cx="12" cy="12" r="3.5" fill="#fff"/>' +
    '<circle cx="12" cy="5" r="2" fill="#fff" opacity="0.7"/>' +
    '<circle cx="12" cy="19" r="2" fill="#fff" opacity="0.7"/>' +
    '<circle cx="5" cy="12" r="2" fill="#fff" opacity="0.7"/>' +
    '<circle cx="19" cy="12" r="2" fill="#fff" opacity="0.7"/>',
  )],

  // Oracle (AddThis), before oracle
  ['addthis', g(
    bg('#CF2030') +
    '<path d="M13 5h-2v6H5v2h6v6h2v-6h6v-2h-6z" fill="#fff"/>',
  )],

  // Salesforce (Krux), before salesforce
  ['krux', g(
    bg('#00A1E0') + txt('Kx', '#fff', 10.5, 4, 17),
  )],

  // Experian (Tapad), before experian
  ['tapad', g(
    bg('#9B1D9D') + txt('Tp', '#fff', 10.5, 3.5, 17),
  )],

  // NextRoll (AdRoll)
  ['adroll', g(
    bg('#003366') +
    '<path d="M7 19V5l5 10V5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  )],

  // Microsoft (Xandr), before microsoft
  ['xandr', g(
    bg('#0078D4') + txt('Xandr', '#fff', 7.5, 2.5, 16),
  )],

  // Oracle (Moat), before oracle
  ['moat', g(
    bg('#CF2030') + txt('Moat', '#fff', 8, 2.5, 16.5),
  )],

  // TransUnion (Neustar)
  ['neustar', g(
    bg('#009BC2') + txt('NS', '#fff', 11, 4.5, 17),
  )],

  // Perion (Undertone)
  ['undertone', g(
    bg('#00A550') + txt('UT', '#fff', 11, 4, 17),
  )],

  // ── Major recognisable brands ────────────────────────────────────────────

  // Google (Alphabet)
  ['google', g(
    '<path d="M21.2 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h5.2c-.2 1.1-.9 2-2 2.7v2.2h3.2c1.9-1.7 3-4.2 3-6.5z" fill="#4285F4"/>' +
    '<path d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.2c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.2H3v2.3C4.7 20 8.1 22 12 22z" fill="#34A853"/>' +
    '<path d="M6.2 14.2A7 7 0 016 12c0-.8.1-1.5.2-2.2V7.5H3A10 10 0 002 12c0 1.6.4 3.1 1 4.5l3.2-2.3z" fill="#FBBC05"/>' +
    '<path d="M12 5.5c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 2.4 14.7 1.5 12 1.5 8.1 1.5 4.7 3.5 3 6.8l3.2 2.5c.8-2.4 3-4.2 5.8-4.2 1.5z" fill="#EA4335"/>',
  )],

  // Meta
  ['meta', g(
    bg('#1877F2') +
    '<path d="M17 8c-1.5 0-2.8.9-3.5 2.2C12.8 9 11.5 8 10 8 7.7 8 6 9.8 6 12.2c0 4 3.5 5 5 5 .5 0 1-.1 1.5-.4.5.3 1 .4 1.5.4 1.5 0 5-1 5-5C19 9.8 17.3 8 17 8z" fill="#fff"/>',
  )],

  // Amazon
  ['amazon', g(
    bg('#232F3E') +
    '<path d="M6.5 15.5c3 2 7.5 2 10.5-.5" stroke="#FF9900" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M16 13.8l2.5 1.2-1 1.2" stroke="#FF9900" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    txt('amazon', '#fff', 8, 4.5, 12),
  )],

  // Microsoft
  ['microsoft', g(
    '<rect x="2" y="2" width="9.5" height="9.5" fill="#F25022"/>' +
    '<rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00"/>' +
    '<rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF"/>' +
    '<rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900"/>',
  )],

  // X (Twitter)
  ['x (twitter)', g(
    bg('#000') +
    '<path d="M18 5.5L13 11.5 19 18.5H15.5L11.5 13 7 18.5H5L10.5 12 5 5.5H8.5L12 10.8 16.5 5.5H18z" fill="#fff"/>',
  )],

  // Pinterest
  ['pinterest', g(
    '<circle cx="12" cy="12" r="11" fill="#E60023"/>' +
    '<path d="M9 19c.4-1.7 1.5-5.5 1.5-5.5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .8-.5 2.1-.8 3.3-.2 1 .5 1.8 1.5 1.8 1.8 0 3-2 3-4.7C16 9 14.4 7.5 12 7.5c-2.9 0-4.6 2.2-4.6 4.4 0 .9.3 1.8.8 2.3.1.1.1.2.1.3l-.3 1.2c0 .2-.1.2-.3.1-1.3-.7-2.2-2.6-2.2-4.2 0-3.4 2.5-6.6 7.1-6.6 3.7 0 6.6 2.6 6.6 6.2 0 3.7-2.3 6.6-5.6 6.6-1.1 0-2.1-.6-2.4-1.2L10 19H9z" fill="#fff"/>',
  )],

  // Snap
  ['snap', g(
    bg('#FFFC00') +
    '<path d="M12 4.5c-2.5 0-4 2-4 4.5v1.5c-.3.1-.6.4-.6.9s.2.8.6.9c-.2.8-.8 1.6-2 2.2 1.7.6 3.3.6 4 1.5.7-.9 2.3-.9 4-1.5-1.2-.6-1.8-1.4-2-2.2.4-.1.6-.4.6-.9s-.3-.8-.6-.9V9c0-2.5-1.5-4.5-4-4.5z" fill="#1a1a1a" opacity="0.85"/>',
  )],

  // Reddit
  ['reddit', g(
    '<circle cx="12" cy="12" r="11" fill="#FF4500"/>' +
    '<path d="M20 12a2 2 0 00-2.2-2c-.5 0-.9.1-1.3.4A8 8 0 0012 9l.9-4.1 2.8.6a1.3 1.3 0 102.7.1l-3-.7L14 9A8 8 0 008.5 10.4a2 2 0 10.6 3.4v.2c0 2.6 3 4.6 6.9 4.6s6.9-2 6.9-4.6v-.2c.4-.4.7-1 .7-1.7zM9.5 13.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 3.2c-.8.8-2 1-2.5 1s-1.7-.2-2.5-1l.4-.5c.6.6 1.6.8 2.1.8s1.5-.2 2.1-.8l.4.5zm.5-3.2a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#fff"/>',
  )],

  // Adobe
  ['adobe', g(
    bg('#FA0F00', 3) +
    '<path d="M9 4L2.5 20h5.2l1.4-3.8h4.8L15.3 20H20L13.5 4H9zm.5 9.2l1.8-5 1.8 5H9.5z" fill="#fff"/>',
  )],

  // Stripe
  ['stripe', g(
    bg('#635BFF') +
    '<path d="M11.5 9.5c0-.9.7-1.2 1.8-1.2.9 0 1.8.3 2.6.8l.9-2.3C15.9 6.3 14.7 6 13 6c-2.5 0-4.5 1.3-4.5 3.8 0 3.7 5 3.2 5 5 0 .8-.7 1.2-1.8 1.2-1.1 0-2.2-.5-3-1.2L7.5 17.2c1 .8 2.5 1.3 4 1.3 2.8 0 4.8-1.4 4.8-4 0-4-5-3.5-4.8-5z" fill="#fff"/>',
  )],

  // PayPal
  ['paypal', g(
    bg('#009CDE') +
    '<path d="M8 5.5h4.5c2.5 0 4 1.2 4 3.2 0 2.7-2 4.3-5 4.3H10L9 18.5H6.5L8 5.5zm2.5 5.5h1.8c1.2 0 2-.6 2-1.7s-.6-1.7-2-1.7H11l-.5 3.4z" fill="#003087"/>',
  )],

  // Cloudflare
  ['cloudflare', g(
    bg('#F38020') +
    '<path d="M16.5 10.8c.1-.3.1-.6.1-.8 0-2.2-1.8-4-4-4A4 4 0 009 8.2c-.4-.2-.9-.3-1.4-.3A2.6 2.6 0 005 10.5v.3H16.5z" fill="#fff" opacity="0.95"/>' +
    '<path d="M17 14H7v-3.5l.4-.3c.3 0 .6.1.9.2l.6.4.2-.7A3 3 0 0112 8.5c1.7 0 3 1.3 3 3v.5l.3-.1.8-.1c.9 0 1.5.4 2 1L17 14z" fill="#fff"/>',
  )],

  // HubSpot
  ['hubspot', g(
    bg('#FF7A59') +
    '<circle cx="16.5" cy="7.5" r="3" fill="#fff"/>' +
    '<circle cx="16.5" cy="7.5" r="1.5" fill="#FF7A59"/>' +
    '<line x1="16.5" y1="10.5" x2="16.5" y2="13" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' +
    '<circle cx="12" cy="16" r="4.5" fill="none" stroke="#fff" stroke-width="2.5"/>',
  )],

  // Intercom
  ['intercom', g(
    bg('#286EFA') +
    '<rect x="4" y="5" width="16" height="11" rx="2" fill="#fff" opacity="0.95"/>' +
    '<path d="M7 14l-3 3V5" fill="#286EFA" opacity="0.4"/>' +
    '<path d="M7.5 9.5h9M7.5 12h6" stroke="#286EFA" stroke-width="1.8" stroke-linecap="round"/>',
  )],

  // Salesforce
  ['salesforce', g(
    bg('#00A1E0') +
    '<path d="M12 5.5a3.5 3.5 0 00-3.3 2.3A2.5 2.5 0 004.5 10a2.5 2.5 0 002.5 2.5H17a1.5 1.5 0 000-3c-.1 0-.2 0-.3.1A3 3 0 0014 7.5a3 3 0 00-2 .8A3.5 3.5 0 0012 5.5z" fill="#fff"/>' +
    '<path d="M10 16h4M12 14v4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  )],

  // Zendesk
  ['zendesk', g(
    bg('#03363D') +
    '<path d="M12 7.5a4.5 4.5 0 01-4.5 4.5H12V7.5z" fill="#87CEEB"/>' +
    '<path d="M12 7.5a4.5 4.5 0 014.5 4.5H12V7.5z" fill="#87CEEB" opacity="0.5"/>' +
    '<path d="M7.5 12.5a4.5 4.5 0 014.5 4.5H7.5v-4.5z" fill="#78D3B5"/>' +
    '<path d="M12 12.5a4.5 4.5 0 014.5 4.5H12v-4.5z" fill="#78D3B5" opacity="0.5"/>',
  )],

  // Oracle
  ['oracle', g(
    '<rect x="1" y="8" width="22" height="8" rx="4" fill="#C74634"/>',
  )],

  // Yahoo
  ['yahoo', g(
    bg('#6001D2') +
    '<path d="M5 6l4 7.5L7.5 17H10l1.5-3.5L13 17h2.5L14 13.5l4-7.5H15L12 11.5 9 6H5z" fill="#fff"/>',
  )],

  // Yandex
  ['yandex', g(
    bg('#FC3F1D') +
    '<path d="M14.5 4H12C9.2 4 7.5 5.5 7.5 8 7.5 10 8.5 11.3 10 12L6 20h2.7L12 13h1V20H15.5V4h-1zm0 7h-1c-1.5 0-2.5-.9-2.5-2.5S12 6 13.5 6h1v5z" fill="#fff"/>',
  )],

  // Criteo
  ['criteo', g(
    bg('#F8582B') +
    '<path d="M16 9.5A5 5 0 107 12a5 5 0 009 .5zm-2.5 3A2.5 2.5 0 119.5 12a2.5 2.5 0 014 0z" fill="#fff"/>',
  )],

  // Taboola
  ['taboola', g(
    bg('#1A1A1A') +
    '<path d="M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm0 3a4.5 4.5 0 110 9 4.5 4.5 0 010-9zm0 2a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" fill="#0AE0A0"/>',
  )],

  // Outbrain
  ['outbrain', g(
    bg('#FF6600') +
    '<circle cx="12" cy="12" r="6" fill="none" stroke="#fff" stroke-width="2"/>' +
    '<circle cx="12" cy="12" r="2.5" fill="#fff"/>',
  )],

  // The Trade Desk
  ['trade desk', g(
    bg('#1B3D6E') + txt('TTD', '#fff', 9.5, 3, 16.5),
  )],

  ['the trade', g(
    bg('#1B3D6E') + txt('TTD', '#fff', 9.5, 3, 16.5),
  )],

  // Quantcast
  ['quantcast', g(
    bg('#0C2340') +
    '<path d="M12 5.5a6.5 6.5 0 014.5 11.1l1.2 1.2-1.6 1.4-1.2-1.2A6.5 6.5 0 1112 5.5zm0 2a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" fill="#00C2F3"/>',
  )],

  // Amplitude
  ['amplitude', g(
    bg('#176DF3') +
    '<path d="M4 17.5l3.5-7.5 3.5 5.5 2-4 3.5 6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  )],

  // Mixpanel
  ['mixpanel', g(
    bg('#7856FF') +
    '<circle cx="8" cy="12" r="3" fill="#fff"/>' +
    '<circle cx="16" cy="12" r="3" fill="#fff" opacity="0.6"/>' +
    '<circle cx="12" cy="7.5" r="3" fill="#fff" opacity="0.35"/>',
  )],

  // Twilio (parent of Segment)
  ['twilio', g(
    bg('#F22F46') +
    '<circle cx="12" cy="12" r="3" fill="#fff"/>' +
    '<circle cx="12" cy="5" r="2" fill="#fff"/>' +
    '<circle cx="12" cy="19" r="2" fill="#fff"/>' +
    '<circle cx="5" cy="12" r="2" fill="#fff"/>' +
    '<circle cx="19" cy="12" r="2" fill="#fff"/>',
  )],

  // Sentry
  ['sentry', g(
    bg('#362D59') +
    '<path d="M13.4 5l-1.5 2.6A7 7 0 0118 17H15.5a4.5 4.5 0 00-7-5.2L7 9.2A7 7 0 0113.4 5zm-1 4.5l1 1.7A2.2 2.2 0 0111 17H7.5A6.8 6.8 0 0112.4 9.5zm-4.1 7.5H6A9 9 0 0114.5 4L15.7 2 14 1A12 12 0 002 20l.9.5H8c0-.5.1-1 .3-1.5z" fill="#A99CE0"/>',
  )],

  // New Relic
  ['new relic', g(
    bg('#1CE783') + txt('NR', '#1D252C', 11, 4, 17),
  )],

  // Datadog
  ['datadog', g(
    bg('#632CA6') +
    '<path d="M4.5 12a7.5 7.5 0 1015 0 7.5 7.5 0 00-15 0zm2 0a5.5 5.5 0 1111 0 5.5 5.5 0 01-11 0z" fill="#7358FF"/>' +
    '<circle cx="12" cy="12" r="2.5" fill="#fff"/>',
  )],

  // FullStory
  ['fullstory', g(
    bg('#0F1E3C') +
    '<path d="M6 8h12M6 12h8M6 16h10" stroke="#5AA7FF" stroke-width="2" stroke-linecap="round"/>',
  )],

  // LogRocket
  ['logrocket', g(
    bg('#764ABC') +
    '<path d="M12 5.5L5 9.5v5l7 4 7-4v-5L12 5.5z" fill="none" stroke="#fff" stroke-width="1.8"/>' +
    '<circle cx="12" cy="12" r="2.5" fill="#fff"/>',
  )],

  // Optimizely
  ['optimizely', g(
    bg('#1B6AC9') +
    '<circle cx="12" cy="12" r="6" fill="none" stroke="#fff" stroke-width="2"/>' +
    '<path d="M9 12h6M12 9v6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  )],

  // Heap
  ['heap', g(
    bg('#6C3EC8') + txt('H', '#fff', 13, 6.5, 17.5),
  )],

  // Chartbeat
  ['chartbeat', g(
    bg('#E5183E') +
    '<path d="M4 17.5l4-5.5 3 3.5 3-6.5 4 3.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  )],

  // PostHog
  ['posthog', g(
    bg('#F54E00') +
    '<path d="M8.5 12a3.5 3.5 0 013.5-3.5V15.5A3.5 3.5 0 018.5 12z" fill="#fff"/>' +
    '<path d="M12 8.5a3.5 3.5 0 013.5 3.5A3.5 3.5 0 0112 15.5V8.5z" fill="#fff" opacity="0.5"/>',
  )],

  // Pendo
  ['pendo', g(
    bg('#FF4876') +
    '<path d="M7 7h5c2 0 3.5 1.5 3.5 3.5S14 14 12 14H7V7z" fill="#fff"/>' +
    '<path d="M7 14v4" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>',
  )],

  // Crazy Egg
  ['crazy egg', g(
    bg('#F98C1D') +
    '<path d="M12 5.5a6.5 6.5 0 016 4.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="12" cy="13" r="4" fill="#fff"/>',
  )],

  // Lucky Orange
  ['lucky orange', g(
    bg('#FF6900') +
    '<circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff" stroke-width="2"/>' +
    '<circle cx="12" cy="12" r="2.5" fill="#fff"/>',
  )],

  // Smartlook
  ['smartlook', g(
    bg('#EB3D4D') +
    '<path d="M5 12a7 7 0 0114 0" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="12" cy="12" r="2.5" fill="#fff"/>',
  )],

  // Mouseflow
  ['mouseflow', g(
    bg('#00C2CB') +
    '<path d="M12 4.5c-2 0-3.5 1.6-3.5 3.5v5a3.5 3.5 0 007 0V8c0-2-1.5-3.5-3.5-3.5z" fill="#fff"/>' +
    '<line x1="12" y1="4.5" x2="12" y2="9.5" stroke="#00C2CB" stroke-width="1.5"/>',
  )],

  // OneTrust
  ['onetrust', g(
    bg('#00853F') +
    '<path d="M12 4l7 3v5c0 4-3 6.5-7 7.5-4-1-7-3.5-7-7.5V7l7-3z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M9 12l2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  )],

  // Tealium
  ['tealium', g(
    bg('#00B7C9') +
    '<path d="M6 8h12M6 12h12M6 16h12" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  )],

  // Drift
  ['drift', g(
    bg('#3A0CA3') +
    '<path d="M4 6h16a1 1 0 011 1v8a1 1 0 01-1 1H9l-5 3.5V7a1 1 0 011-1z" fill="#fff" opacity="0.95"/>',
  )],

  // Klaviyo
  ['klaviyo', g(
    bg('#1B1B1B') +
    '<path d="M6 5h12v14H6zM9 9h6M9 12h6M9 15h6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>',
  )],

  // Adjust
  ['adjust', g(
    bg('#005FF9') +
    '<path d="M8 18L12 7.5l4 10.5M9.5 14h5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  )],

  // Branch
  ['branch', g(
    bg('#6CD800') +
    '<path d="M8 5v8M16 5v4M8 13c0 2 1.8 3.5 4 3.5s4-1.5 4-3.5" stroke="#1A1A1A" stroke-width="2.2" stroke-linecap="round"/>',
  )],

  // AppsFlyer
  ['appsflyer', g(
    bg('#00C1D4') +
    '<path d="M12 5c-4 0-7 3.1-7 7s3.1 7 7 7M12 5l3.5 3.5-3.5 3.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  )],

  // Parse.ly
  ['parse', g(
    bg('#6A3FC8') +
    '<path d="M7 18V8l5-3 5 3v10M10 10h4v8h-4z" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  )],

  // Comscore
  ['comscore', g(
    bg('#00A0DF') + txt('Cs', '#fff', 12, 4, 17),
  )],

  // LaunchDarkly
  ['launchdarkly', g(
    bg('#3DD6F5') +
    '<path d="M12 4L4.5 20H12L20 12z" fill="#405BFF"/>',
  )],

  // Bombora
  ['bombora', g(
    bg('#0066CC') +
    '<path d="M5.5 17c2.5-6 4.5-7 6.5-6s4 4.5 6.5-1" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
  )],

  // Permutive
  ['permutive', g(
    bg('#7B2FBE') +
    '<path d="M7.5 7h5c2 0 3.5 1.5 3.5 3.5S14.5 14 12.5 14H7.5V7z" fill="#fff"/>' +
    '<line x1="7.5" y1="14" x2="7.5" y2="19" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>',
  )],

  // RTB House
  ['rtb house', g(
    bg('#00A5FF') +
    '<path d="M12 4.5L4.5 9.5v10h4v-6h7v6h4v-10L12 4.5z" fill="#fff"/>',
  )],

  // NextRoll
  ['nextroll', g(
    bg('#003366') +
    '<path d="M7 19V5l5 10V5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  )],

  // Sourcepoint
  ['sourcepoint', g(
    bg('#0051A5') +
    '<path d="M12 5c-3.8 0-7 3-7 7" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M12 5c3.8 0 7 3 7 7" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.5"/>' +
    '<circle cx="12" cy="12" r="3" fill="#fff"/>',
  )],

  // Usercentrics
  ['usercentrics', g(
    bg('#1EB8E0') +
    '<path d="M8 5v8.5a4 4 0 008 0V5M7 17h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  )],

  // CookieFirst
  ['cookiefirst', g(
    bg('#1C77C3') +
    '<circle cx="12" cy="12" r="7" fill="#F5A623"/>' +
    '<circle cx="10" cy="10" r="1.5" fill="#8B5E3C"/>' +
    '<circle cx="14.5" cy="13" r="1.5" fill="#8B5E3C"/>' +
    '<circle cx="10" cy="14.5" r="1" fill="#8B5E3C"/>',
  )],

  // VWO
  ['vwo', g(
    bg('#F3791B') + txt('VWO', '#fff', 9, 2.5, 16.5),
  )],

  // Automattic (WordPress.com, Akismet, Jetpack)
  ['automattic', g(
    '<circle cx="12" cy="12" r="10.5" fill="#21759B"/>' +
    '<circle cx="12" cy="12" r="10.5" fill="none" stroke="#fff" stroke-width="1" opacity="0.3"/>' +
    txt('W', '#fff', 13, 6.5, 17.5),
  )],

  // Acxiom
  ['acxiom', g(
    bg('#002B5C') + txt('Acx', '#fff', 8.5, 3, 16.5),
  )],

  // Adform
  ['adform', g(
    bg('#0082C8') + txt('Af', '#fff', 11, 4.5, 17),
  )],

  // Audigent
  ['audigent', g(
    bg('#3D1EB2') + txt('Au', '#fff', 11, 4, 17),
  )],

  // Merkle
  ['merkle', g(
    bg('#12B5CB') + txt('Mk', '#fff', 11, 3.5, 17),
  )],

  // Experian
  ['experian', g(
    bg('#9B1D9D') + txt('E', '#fff', 14, 7, 17.5),
  )],

  // Epsilon
  ['epsilon', g(
    bg('#E31B23') + txt('ε', '#fff', 14, 7, 18),
  )],

  // LiveRamp
  ['liveramp', g(
    bg('#00C08B') + txt('LR', '#fff', 11, 4, 17),
  )],

  // LiveIntent
  ['liveintent', g(
    bg('#007BFF') + txt('LI', '#fff', 11, 5, 17),
  )],

  // ID5
  ['id5', g(
    bg('#0068C8') + txt('ID5', '#fff', 9, 3, 16.5),
  )],

  // Index Exchange
  ['index exchange', g(
    bg('#003087') + txt('IX', '#fff', 12, 4.5, 17),
  )],

  // OpenX
  ['openx', g(
    bg('#00B6F0') + txt('OX', '#fff', 11, 3.5, 17),
  )],

  // PubMatic
  ['pubmatic', g(
    bg('#00AADC') + txt('PM', '#fff', 10, 3.5, 17),
  )],

  // Magnite
  ['magnite', g(
    bg('#FF4D00') + txt('Mg', '#fff', 10, 3.5, 17),
  )],

  // Integral Ad Science
  ['integral ad', g(
    bg('#00B4D8') + txt('IAS', '#fff', 9, 2.5, 16.5),
  )],

  // DoubleVerify
  ['doubleverify', g(
    bg('#3E00B6') + txt('DV', '#fff', 11, 4.5, 17),
  )],

  // Lotame
  ['lotame', g(
    bg('#FF6600') + txt('LT', '#fff', 11, 4.5, 17),
  )],

  // MediaMath
  ['mediamath', g(
    bg('#000066') + txt('MM', '#fff', 10, 3.5, 17),
  )],

  // GumGum
  ['gumgum', g(
    bg('#FF0066') + txt('GG', '#fff', 10, 3.5, 17),
  )],

  // Kargo
  ['kargo', g(
    bg('#0E0E0E') + txt('Kg', '#fff', 10.5, 4, 17),
  )],

  // Sharethrough
  ['sharethrough', g(
    bg('#FF6B00') + txt('ST', '#fff', 11, 4, 17),
  )],

  // Smaato
  ['smaato', g(
    bg('#00A0DF') + txt('Sm', '#fff', 10.5, 3.5, 17),
  )],

  // TripleLift
  ['triplelift', g(
    bg('#CE3B3B') + txt('TL', '#fff', 11, 4.5, 17),
  )],

  // IPONWEB
  ['iponweb', g(
    bg('#2A2E5B') + txt('IPW', '#fff', 8.5, 2.5, 16),
  )],

  // Improve Digital
  ['improve digital', g(
    bg('#00529B') + txt('ID', '#fff', 11.5, 4.5, 17),
  )],

  // TransUnion
  ['transunion', g(
    bg('#009BC2') + txt('TU', '#fff', 11, 4.5, 17),
  )],

  // Dun & Bradstreet
  ['dun &', g(
    bg('#C8102E') + txt('D&B', '#fff', 8.5, 2.5, 16.5),
  )],

  // Dun & Bradstreet (alternate)
  ['bradstreet', g(
    bg('#C8102E') + txt('D&B', '#fff', 8.5, 2.5, 16.5),
  )],

  // Teads
  ['teads', g(
    bg('#4D63F0') + txt('Td', '#fff', 11, 4.5, 17),
  )],

  // Yieldmo
  ['yieldmo', g(
    bg('#262626') + txt('Ym', '#00D4AA', 10, 4, 17),
  )],

  // Media.net
  ['media.net', g(
    bg('#FF6B35') + txt('M.n', '#fff', 9, 3, 16.5),
  )],

  // Sovrn
  ['sovrn', g(
    bg('#333') + txt('Sv', '#fff', 11, 4.5, 17),
  )],

  // Equativ
  ['equativ', g(
    bg('#FF4800') + txt('Eq', '#fff', 11, 4, 17),
  )],

  // Braze
  ['braze', g(
    bg('#FF3A44') + txt('Bz', '#fff', 10.5, 4, 17),
  )],

  // 33Across
  ['33across', g(
    bg('#111') + txt('33×', '#FF6600', 9, 2.5, 16.5),
  )],

  // Drip
  ['drip', g(
    bg('#4A4AFF') +
    '<path d="M12 5v7M9.5 9l2.5 3 2.5-3" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M9 17a3 3 0 006 0" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>',
  )],

  // mParticle
  ['mparticle', g(
    bg('#662D91') +
    '<circle cx="12" cy="12" r="3" fill="#fff"/>' +
    '<circle cx="5" cy="9" r="1.8" fill="#fff" opacity="0.5"/>' +
    '<circle cx="19" cy="9" r="1.8" fill="#fff" opacity="0.5"/>' +
    '<circle cx="5" cy="15" r="1.8" fill="#fff" opacity="0.5"/>' +
    '<circle cx="19" cy="15" r="1.8" fill="#fff" opacity="0.5"/>',
  )],

  // GumGum (duplicate coverage)
  ['gum', g(
    bg('#FF0066') + txt('GG', '#fff', 10, 3.5, 17),
  )],

  // Bombora (alternate)
  ['b2b', g(
    bg('#0066CC') +
    '<path d="M5.5 17c2.5-6 4.5-7 6.5-6s4 4.5 6.5-1" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
  )],

  // Perion (parent of Undertone)
  ['perion', g(
    bg('#00A550') + txt('Pr', '#fff', 11, 4, 17),
  )],

  // RTB (generic fallback for RTB House)
  ['rtb', g(
    bg('#00A5FF') +
    '<path d="M12 4.5L4.5 9.5v10h4v-6h7v6h4v-10L12 4.5z" fill="#fff"/>',
  )],
];

/** Returns an inline SVG string for the given entity name, or null if none known. */
export function getCompanyLogo(entity: string): string | null {
  const lower = entity.toLowerCase();
  for (const [pattern, svg] of LOGOS) {
    if (lower.includes(pattern)) return svg;
  }
  return null;
}

/**
 * Creates a 20×20 logo element:
 * - SVG icon for known companies
 * - Two-letter initials (on a tinted background) for unknown ones
 */
export function companyLogoEl(entity: string, color: string): HTMLElement {
  const wrap = document.createElement('span');
  wrap.className = 'co-logo';

  const svg = getCompanyLogo(entity);
  if (svg) {
    const node = parseSvg(svg);
    if (node) wrap.appendChild(node);
    wrap.classList.add('co-logo--img');
  } else {
    const name = entity.replace(/\s*\([^)]+\)\s*$/, '').trim();
    const initials = name.replace(/[^A-Z0-9]/gi, '').slice(0, 2).toUpperCase() || name.slice(0, 2).toUpperCase();
    wrap.textContent = initials;
    wrap.style.setProperty('--co-color', color);
    wrap.classList.add('co-logo--init');
  }

  return wrap;
}
