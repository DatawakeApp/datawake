import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  // Output to a visible (non-dotted) folder. macOS Finder and file-pickers hide ".output",
  // which makes "Load unpacked" frustrating; "dist/" shows up normally.
  outDir: 'dist',
  manifest: ({ browser }) => ({
    name: 'Datawake',
    description:
      'See who tracks you online, and catch sites that track you after you say Reject. Auto-rejects cookie banners. Local-first, open source.',
    // webRequest in MV3 is observe-only here (we detect, we never block), no data ever leaves the device.
    // `scripting` (Chrome, no install warning): register the MAIN-world GPC script only while GPC is on.
    permissions: [
      'webRequest',
      'storage',
      'tabs',
      'cookies',
      'declarativeNetRequest',
      ...(browser === 'firefox' ? [] : ['scripting']),
    ],
    host_permissions: ['<all_urls>'],
    declarative_net_request: {
      rule_resources: [
        { id: 'gpc', enabled: true, path: 'rules/gpc.json' },
      ],
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
  }),
});
