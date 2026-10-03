<p align="center"><img src="public/icon/128.png" width="96" height="96" alt="Datawake logo"></p>

# Datawake

**Says no to cookie banners for you, catches sites that keep tracking you anyway, and shows who is tracking you right now.**

Datawake is a free, open-source, local-first browser extension for Chrome and Firefox. Everything
it records stays on your device: no account, no backend, no telemetry.

Website: [datawake.app](https://datawake.app) · Privacy policy: [datawake.app/privacy](https://datawake.app/privacy)

## What it does

- **Says no for you.** Clicks Reject on cookie banners from the major consent platforms (by their
  own APIs where possible, otherwise by finding the reject button) and sends the Global Privacy
  Control signal.
- **Catches sites that ignore it.** After Reject, it checks whether the site still sets tracking
  cookies or fingerprints your device, and keeps the evidence as a violation.
- **Shows who is tracking you right now.** The popup lists the companies on the current page,
  grouped by what they do, marks the ones sending data at this moment, and updates live.
- **Detects fingerprinting** by canvas, audio, fonts (canvas and page elements), graphics card and
  hardware details, and tells bot checks apart from tracking. Observe only: nothing is changed.
- **Flags "pay or OK" walls**, including ones where Reject quietly leads to a subscription page,
  and leaves that choice to you.
- **Helps you act.** Writes a complaint to your data protection authority from the evidence,
  drafts GDPR access and deletion letters, and makes shareable receipts.
- **Dashboard.** Every site you visited and what happened there, every company that tracked you
  and whether it sells or shares your data, and the audience categories you are likely put in.

Trackers are recognised with the bundled [DuckDuckGo Tracker Radar](https://github.com/duckduckgo/tracker-radar)
data, layered under curated company names and notes.

## Privacy

- The only request the extension makes on its own is the optional email breach check, which goes
  straight from your browser to Have I Been Pwned with your own API key.
- History is stored in your browser (IndexedDB) and pruned after 90 days; violations are kept as
  evidence until you clear them.
- Permissions, each with a reason:
  - `webRequest` and host access to all sites: observe (never block) which third parties a page
    loads, read the banner, and check cookies after Reject on whatever site you visit.
  - `cookies`: compare cookie names and domains before and after Reject. Values are never stored.
  - `declarativeNetRequest`: add the `Sec-GPC: 1` header while GPC is on.
  - `scripting`: register the GPC page script only while GPC is on.
  - `tabs`: know which site each tab shows, and open the dashboard.
  - `storage`: settings and local history.

## Develop

Requires Node 18 or later (tested on Node 22).

```bash
npm install            # installs dependencies and runs `wxt prepare`
npm test               # unit tests (Vitest)
npm run compile        # type check
npm run build          # Chrome build, output in dist/chrome-mv3
npm run build:firefox  # Firefox build (Manifest V3, Firefox 128+), output in dist/firefox-mv3
npm run zip            # store package for Chrome
npm run zip:firefox    # store package and sources for Firefox Add-ons
npm run build:trackers # refresh the bundled tracker data from DuckDuckGo
npm run build:icons    # regenerate the PNG icons from the SVG source
```

### Loading it in the browser

Chrome: run `npm run build`, open `chrome://extensions`, turn on Developer mode, choose
**Load unpacked** and select `dist/chrome-mv3`. Reload the card after each rebuild.

Firefox: run `npm run build:firefox`, open `about:debugging#/runtime/this-firefox`, choose
**Load Temporary Add-on** and select `dist/firefox-mv3/manifest.json`.

## How it works

A background script observes outgoing requests, works out each request's registrable domain
([tldts](https://github.com/remusao/tldts)), decides first or third party against the page, and
names the company behind it. Content scripts read cookie banners and click Reject; small scripts in
the page itself call consent platforms' own reject functions, read the TCF consent API, send GPC,
and watch the browser features fingerprinting scripts use. Per-tab state is mirrored to
`storage.session` so it survives the background worker sleeping.

## License

AGPL-3.0-only. See [LICENSE](LICENSE).

Datawake is an informational tool. The letters and complaints it drafts are not legal advice.
