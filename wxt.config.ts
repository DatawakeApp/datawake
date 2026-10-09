import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
/**
 * Scripts that run in the page's own context. Their bundles start with `var name = ...`, which
 * would put `name` on the page's window, where any site could see it and detect Datawake. Wrap
 * each one in a function after the build so nothing is left behind.
 */
const PAGE_WORLD_SCRIPTS = ['fp-probe', 'fp-protect', 'gpc', 'cmp-reject', 'tcf-probe'];

function hidePageWorldGlobals(outDir: string): void {
  for (const name of PAGE_WORLD_SCRIPTS) {
    const file = path.join(outDir, 'content-scripts', `${name}.js`);
    if (!fs.existsSync(file)) continue;
    const code = fs.readFileSync(file, 'utf8');
    if (code.startsWith('(function(){')) continue;
    fs.writeFileSync(file, `(function(){${code}\n})();`);
  }
}

export default defineConfig({
  hooks: {
    'build:done': (wxt) => hidePageWorldGlobals(wxt.config.outDir),
  },
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
    // Asked for only when the user turns on notifications in Settings or the popup.
    optional_permissions: ['notifications'],
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
