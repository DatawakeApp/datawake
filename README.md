<p align="center"><img src="public/icon/128.png" width="96" height="96" alt="Datawake logo"></p>

# Datawake

**See which companies are tracking you in real time, and who they really are.**

Datawake is a free, open-source, **local-first** browser extension. As you browse, it shows the
third-party trackers loading on each page and names the **parent company** behind them
(`doubleclick.net` → *Google (Alphabet)*, `adnxs.com` → *Microsoft (Xandr)*), explains what
they do with your data, builds a picture of your overall footprint, and helps you send GDPR
data requests, all computed on your device.

> Status: **early but functional.** Layers 0-2 are in: real-time detection, a weekly report,
> your data footprint, and GDPR request letters.

## What it does

- **Live tracker X-ray** (popup): for the current page, the companies tracking you, grouped
  and explained, with a live count on the toolbar badge.
- **Recognises ~1,000 trackers + ~5,500 owned domains** via the bundled DuckDuckGo Tracker
  Radar dataset, layered under curated friendly names.
- **Understanding layer**: plain-language notes on who each company is and what each kind of
  tracking (advertising, analytics, session replay…) does with your data.
- **Weekly report** (dashboard): who tracked you most, what they were doing, and which sites
  tracked you most, over 7/30/all days.
- **Your footprint**: every company seen across your browsing, plus accounts you add, as a
  running "who has data on you" list.
- **GDPR requests**: generate ready-to-send Article 15 (access) and Article 17 (erasure)
  letters, find a contact, copy or open in email, and track each request's status.

## Privacy stance (the whole point)

- **Detection sends nothing.** The tracker X-ray makes **no network requests**.
- **No account, no backend, no telemetry.**
- **Everything stays local**: history (IndexedDB, ~90-day cap), your footprint, your requests,
  and your details all live in your browser only.
- **Minimal permissions**, each with a reason:
  - `webRequest` + `<all_urls>`: to *observe* (never block) which third parties a page loads.
  - `storage`: local history, settings, and live state across worker restarts.
  - `tabs`: to know which page the popup is describing.
- **Open source under AGPL-3.0** so anyone can verify every claim above.

## Develop

Requires Node 18+ (tested on Node 22).

```bash
npm install            # installs deps + runs `wxt prepare`
npm run dev            # dev build (see note below about Chrome 137+)
npm test               # unit tests (Vitest)
npm run compile        # typecheck
npm run build          # production build → dist/chrome-mv3
npm run build:firefox  # → dist/firefox-mv3 (Firefox 128+)
npm run build:trackers # refresh the bundled tracker dataset from DuckDuckGo
npm run build:icons    # regenerate PNG icons from the SVG source
npm run try            # drive real sites in headless Chrome through the matcher
```

### Loading it in the browser

Chrome **removed `--load-extension` in v137**, so `npm run dev`'s auto-launch no longer injects
the extension. Load it manually instead:

1. `npm run build`
2. Chrome → `chrome://extensions` → enable **Developer mode**
3. **Load unpacked** → select **`dist/chrome-mv3`**

After rebuilding, click the **reload** icon on the Datawake card to pick up changes.

## How it works

A background service worker observes outgoing requests, computes each request's registrable
domain ([tldts](https://github.com/remusao/tldts)), decides first- vs third-party against the
page's own domain, and attributes third parties to a parent company via curated overrides →
the bundled [DuckDuckGo Tracker Radar](https://github.com/duckduckgo/tracker-radar) dataset →
domain ownership. Live per-tab state is mirrored to `storage.session` so it survives the MV3
worker sleeping; first sightings are written to a local 90-day history that powers the report
and footprint.

## Roadmap

- **L0 · Tracker X-ray**: ✅ real-time, local, parent-company attribution, explanations.
- **L1 · Footprint**: ✅ "who has your data" from browsing + manual accounts. (Inbox scanning
  is deferred until funded, due to Google's restricted-scope audit cost.)
- **L2 · Requests**: ✅ GDPR Art. 15 / 17 letters + local request tracking (EU-first).
- **L3 · Broker graph**: planned: a sourced, community-maintained "sold to whom" map.

## License & contributions

AGPL-3.0-only. Contributions will require signing a CLA (so the project can offer an optional
hosted automation tier later without re-licensing the core).

Datawake is an informational tool, not legal advice.
