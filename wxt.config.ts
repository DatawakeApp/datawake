import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  // Output to a visible (non-dotted) folder. macOS Finder and file-pickers hide ".output",
  // which makes "Load unpacked" frustrating; "dist/" shows up normally.
  outDir: 'dist',
  manifest: ({ browser }) => ({
    name: 'Datawake',
    description:
      'Says no to cookie banners for you, catches sites that keep tracking you anyway, and shows who is tracking you right now.',
    // webRequest in MV3 is observe-only here (we detect, we never block), no data ever leaves the device.
    // `scripting` (Chrome, no install warning): register the MAIN-world GPC script only while GPC is on.
    permissions: [
      'webRequest',
      'storage',
      'tabs',
      'cookies',
      'declarativeNetRequest',
      'scripting',
    ],
    host_permissions: ['<all_urls>'],
    declarative_net_request: {
      rule_resources: [
        { id: 'gpc', enabled: true, path: 'rules/gpc.json' },
      ],
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'extension@datawake.app',
          // 140 is the first version with built-in data consent (required for new add-ons).
          strict_min_version: '140.0',
          // Nothing leaves the device except the optional breach check, which sends the email
          // the user types to the breach database. Firefox asks for consent the first time.
          data_collection_permissions: { required: ['none'], optional: ['personallyIdentifyingInfo'] },
        },
        gecko_android: { strict_min_version: '142.0' },
      },
    }),
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
  }),
});
