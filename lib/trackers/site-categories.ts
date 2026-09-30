/**
 * Curated domain → content category map.
 * Used to reconstruct an interest profile from browsing history, no inference, just
 * "you visited health sites, ad networks categorise you as Health & Fitness."
 */

export interface CategoryProfile {
  category: string;
  color: string;
  siteCount: number;
  trackerHits: number;
  topCompanies: string[];
}

const COLORS: Record<string, string> = {
  'News': '#79a9ff',
  'Technology': '#5bd6a5',
  'Shopping': '#ffb066',
  'Finance': '#f1c40f',
  'Health & Fitness': '#2ecc71',
  'Travel': '#3498db',
  'Sports': '#e74c3c',
  'Entertainment': '#9b59b6',
  'Food & Drink': '#e67e22',
  'Automotive': '#95a5a6',
  'Real Estate': '#1abc9c',
  'Education': '#f39c12',
  'Gaming': '#8e44ad',
  'Parenting': '#27ae60',
  'Fashion & Beauty': '#e91e63',
  'Pets': '#795548',
  'Home & Garden': '#4caf50',
  'Science': '#00bcd4',
  'Social Media': '#3f51b5',
};

export const SITE_CATEGORIES: Record<string, string> = {
  // News
  'cnn.com': 'News', 'bbc.com': 'News', 'bbc.co.uk': 'News', 'foxnews.com': 'News',
  'nytimes.com': 'News', 'washingtonpost.com': 'News', 'theguardian.com': 'News',
  'reuters.com': 'News', 'apnews.com': 'News', 'nbcnews.com': 'News',
  'cbsnews.com': 'News', 'abcnews.go.com': 'News', 'usatoday.com': 'News',
  'huffpost.com': 'News', 'politico.com': 'News', 'thehill.com': 'News',
  'axios.com': 'News', 'bloomberg.com': 'News', 'businessinsider.com': 'News',
  'vox.com': 'News', 'buzzfeed.com': 'News', 'vice.com': 'News', 'slate.com': 'News',
  'theatlantic.com': 'News', 'newyorker.com': 'News', 'time.com': 'News',
  'newsweek.com': 'News', 'dailymail.co.uk': 'News', 'independent.co.uk': 'News',
  'telegraph.co.uk': 'News', 'thesun.co.uk': 'News', 'mirror.co.uk': 'News',
  'lemonde.fr': 'News', 'lefigaro.fr': 'News', 'elpais.com': 'News',
  'spiegel.de': 'News', 'corriere.it': 'News', 'repubblica.it': 'News',
  'sueddeutsche.de': 'News', 'faz.net': 'News', 'msn.com': 'News',
  'nypost.com': 'News', 'latimes.com': 'News', 'chicagotribune.com': 'News',
  'bostonglobe.com': 'News', 'miamiherald.com': 'News', 'sfgate.com': 'News',
  'seattletimes.com': 'News', 'denverpost.com': 'News', 'dallasnews.com': 'News',
  'startribune.com': 'News', 'breitbart.com': 'News', 'thedailybeast.com': 'News',
  'rawstory.com': 'News', 'mediaite.com': 'News', 'propublica.org': 'News',

  // Technology
  'techcrunch.com': 'Technology', 'theverge.com': 'Technology', 'wired.com': 'Technology',
  'arstechnica.com': 'Technology', 'engadget.com': 'Technology', 'gizmodo.com': 'Technology',
  'zdnet.com': 'Technology', 'cnet.com': 'Technology', 'pcmag.com': 'Technology',
  'tomshardware.com': 'Technology', 'techradar.com': 'Technology', 'makeuseof.com': 'Technology',
  'howtogeek.com': 'Technology', 'digitaltrends.com': 'Technology', '9to5mac.com': 'Technology',
  '9to5google.com': 'Technology', 'macrumors.com': 'Technology', 'androidcentral.com': 'Technology',
  'xda-developers.com': 'Technology', 'github.com': 'Technology', 'stackoverflow.com': 'Technology',
  'dev.to': 'Technology', 'medium.com': 'Technology', 'hackernoon.com': 'Technology',
  'producthunt.com': 'Technology', 'slashdot.org': 'Technology', 'thenextweb.com': 'Technology',
  'mashable.com': 'Technology', 'venturebeat.com': 'Technology', 'tomsguide.com': 'Technology',
  'gsmarena.com': 'Technology', 'phonearena.com': 'Technology', 'androidauthority.com': 'Technology',
  'anandtech.com': 'Technology', 'notebookcheck.net': 'Technology', 'ycombinator.com': 'Technology',

  // Shopping
  'amazon.com': 'Shopping', 'amazon.co.uk': 'Shopping', 'amazon.de': 'Shopping',
  'amazon.fr': 'Shopping', 'amazon.it': 'Shopping', 'amazon.es': 'Shopping',
  'ebay.com': 'Shopping', 'ebay.co.uk': 'Shopping', 'etsy.com': 'Shopping',
  'walmart.com': 'Shopping', 'target.com': 'Shopping', 'bestbuy.com': 'Shopping',
  'wayfair.com': 'Shopping', 'zappos.com': 'Shopping', 'nordstrom.com': 'Shopping',
  'macys.com': 'Shopping', 'gap.com': 'Shopping', 'hm.com': 'Shopping',
  'zara.com': 'Shopping', 'asos.com': 'Shopping', 'shein.com': 'Shopping',
  'aliexpress.com': 'Shopping', 'wish.com': 'Shopping', 'temu.com': 'Shopping',
  'overstock.com': 'Shopping', 'homedepot.com': 'Shopping', 'lowes.com': 'Shopping',
  'ikea.com': 'Shopping', 'costco.com': 'Shopping', 'samsclub.com': 'Shopping',
  'rakuten.com': 'Shopping', 'kohls.com': 'Shopping', 'jcpenney.com': 'Shopping',
  'newegg.com': 'Shopping', 'bhphotovideo.com': 'Shopping', 'adorama.com': 'Shopping',
  'mercadolibre.com': 'Shopping', 'zalando.com': 'Shopping', 'otto.de': 'Shopping',
  'aboutyou.com': 'Shopping', 'shopify.com': 'Shopping',

  // Finance
  'bankofamerica.com': 'Finance', 'chase.com': 'Finance', 'wellsfargo.com': 'Finance',
  'citibank.com': 'Finance', 'capitalone.com': 'Finance', 'discover.com': 'Finance',
  'americanexpress.com': 'Finance', 'paypal.com': 'Finance', 'venmo.com': 'Finance',
  'coinbase.com': 'Finance', 'binance.com': 'Finance', 'kraken.com': 'Finance',
  'robinhood.com': 'Finance', 'etrade.com': 'Finance', 'fidelity.com': 'Finance',
  'vanguard.com': 'Finance', 'schwab.com': 'Finance', 'tdameritrade.com': 'Finance',
  'mint.com': 'Finance', 'creditkarma.com': 'Finance', 'nerdwallet.com': 'Finance',
  'wsj.com': 'Finance', 'marketwatch.com': 'Finance', 'investopedia.com': 'Finance',
  'bankrate.com': 'Finance', 'lendingtree.com': 'Finance', 'sofi.com': 'Finance',
  'betterment.com': 'Finance', 'ally.com': 'Finance', 'usbank.com': 'Finance',
  'hsbc.com': 'Finance', 'barclays.co.uk': 'Finance', 'lloydsbank.com': 'Finance',
  'natwest.com': 'Finance', 'coinmarketcap.com': 'Finance', 'coingecko.com': 'Finance',
  'finance.yahoo.com': 'Finance', 'fool.com': 'Finance', 'seeking alpha.com': 'Finance',
  'seekingalpha.com': 'Finance', 'moneycontrol.com': 'Finance', 'cnbc.com': 'Finance',

  // Health & Fitness
  'webmd.com': 'Health & Fitness', 'healthline.com': 'Health & Fitness',
  'mayoclinic.org': 'Health & Fitness', 'nih.gov': 'Health & Fitness',
  'medicalnewstoday.com': 'Health & Fitness', 'everydayhealth.com': 'Health & Fitness',
  'myfitnesspal.com': 'Health & Fitness', 'strava.com': 'Health & Fitness',
  'peloton.com': 'Health & Fitness', 'drugs.com': 'Health & Fitness',
  'rxlist.com': 'Health & Fitness', 'goodrx.com': 'Health & Fitness',
  'zocdoc.com': 'Health & Fitness', 'noom.com': 'Health & Fitness',
  'weightwatchers.com': 'Health & Fitness', 'livestrong.com': 'Health & Fitness',
  'bodybuilding.com': 'Health & Fitness', 'menshealth.com': 'Health & Fitness',
  'womenshealthmag.com': 'Health & Fitness', 'self.com': 'Health & Fitness',
  'prevention.com': 'Health & Fitness', 'medscape.com': 'Health & Fitness',
  'nhs.uk': 'Health & Fitness', 'patient.info': 'Health & Fitness',
  'healthgrades.com': 'Health & Fitness', 'sleepfoundation.org': 'Health & Fitness',
  'kidshealth.org': 'Health & Fitness', 'emedicinehealth.com': 'Health & Fitness',
  'vitals.com': 'Health & Fitness', 'ratemds.com': 'Health & Fitness',
  'psychologytoday.com': 'Health & Fitness', 'verywellmind.com': 'Health & Fitness',
  'verywellhealth.com': 'Health & Fitness', 'verywellfit.com': 'Health & Fitness',

  // Travel
  'booking.com': 'Travel', 'expedia.com': 'Travel', 'tripadvisor.com': 'Travel',
  'airbnb.com': 'Travel', 'hotels.com': 'Travel', 'kayak.com': 'Travel',
  'skyscanner.com': 'Travel', 'skyscanner.net': 'Travel', 'momondo.com': 'Travel',
  'trivago.com': 'Travel', 'priceline.com': 'Travel', 'orbitz.com': 'Travel',
  'hotwire.com': 'Travel', 'delta.com': 'Travel', 'united.com': 'Travel',
  'aa.com': 'Travel', 'southwest.com': 'Travel', 'spirit.com': 'Travel',
  'jetblue.com': 'Travel', 'ryanair.com': 'Travel', 'easyjet.com': 'Travel',
  'marriott.com': 'Travel', 'hilton.com': 'Travel', 'hyatt.com': 'Travel',
  'ihg.com': 'Travel', 'accorhotels.com': 'Travel', 'lonelyplanet.com': 'Travel',
  'viator.com': 'Travel', 'getyourguide.com': 'Travel', 'klook.com': 'Travel',
  'vrbo.com': 'Travel', 'hostelworld.com': 'Travel', 'hertz.com': 'Travel',
  'enterprise.com': 'Travel', 'avis.com': 'Travel', 'rome2rio.com': 'Travel',
  'flightradar24.com': 'Travel', 'seat61.com': 'Travel', 'googleflights.com': 'Travel',

  // Sports
  'espn.com': 'Sports', 'nfl.com': 'Sports', 'nba.com': 'Sports',
  'mlb.com': 'Sports', 'nhl.com': 'Sports', 'fifa.com': 'Sports',
  'uefa.com': 'Sports', 'bleacherreport.com': 'Sports', 'cbssports.com': 'Sports',
  'foxsports.com': 'Sports', 'nbcsports.com': 'Sports', 'si.com': 'Sports',
  'the-ringer.com': 'Sports', 'draftkings.com': 'Sports', 'fanduel.com': 'Sports',
  'bet365.com': 'Sports', 'betmgm.com': 'Sports', 'skysports.com': 'Sports',
  'goal.com': 'Sports', 'transfermarkt.com': 'Sports', 'flashscore.com': 'Sports',
  'sofascore.com': 'Sports', 'basketball-reference.com': 'Sports',
  'baseball-reference.com': 'Sports', 'pro-football-reference.com': 'Sports',
  'atptour.com': 'Sports', 'pga.com': 'Sports', 'formula1.com': 'Sports',
  'motogp.com': 'Sports', 'wrestling-online.com': 'Sports', 'ufc.com': 'Sports',
  'boxing scene.com': 'Sports', 'deadspin.com': 'Sports', 'rotowire.com': 'Sports',

  // Entertainment
  'netflix.com': 'Entertainment', 'hulu.com': 'Entertainment', 'disneyplus.com': 'Entertainment',
  'max.com': 'Entertainment', 'hbomax.com': 'Entertainment', 'peacocktv.com': 'Entertainment',
  'paramountplus.com': 'Entertainment', 'youtube.com': 'Entertainment', 'spotify.com': 'Entertainment',
  'pandora.com': 'Entertainment', 'soundcloud.com': 'Entertainment', 'imdb.com': 'Entertainment',
  'rottentomatoes.com': 'Entertainment', 'metacritic.com': 'Entertainment',
  'pitchfork.com': 'Entertainment', 'rollingstone.com': 'Entertainment',
  'billboard.com': 'Entertainment', 'vulture.com': 'Entertainment',
  'avclub.com': 'Entertainment', 'letterboxd.com': 'Entertainment',
  'goodreads.com': 'Entertainment', 'audible.com': 'Entertainment',
  'npr.org': 'Entertainment', 'consequence.net': 'Entertainment',
  'last.fm': 'Entertainment', 'nme.com': 'Entertainment', 'allmusic.com': 'Entertainment',
  'discogs.com': 'Entertainment', 'tvguide.com': 'Entertainment',
  'tvline.com': 'Entertainment', 'deadline.com': 'Entertainment',

  // Food & Drink
  'allrecipes.com': 'Food & Drink', 'foodnetwork.com': 'Food & Drink',
  'epicurious.com': 'Food & Drink', 'seriouseats.com': 'Food & Drink',
  'bonappetit.com': 'Food & Drink', 'delish.com': 'Food & Drink',
  'food52.com': 'Food & Drink', 'thekitchn.com': 'Food & Drink',
  'yelp.com': 'Food & Drink', 'doordash.com': 'Food & Drink',
  'ubereats.com': 'Food & Drink', 'grubhub.com': 'Food & Drink',
  'instacart.com': 'Food & Drink', 'opentable.com': 'Food & Drink',
  'resy.com': 'Food & Drink', 'foodandwine.com': 'Food & Drink',
  'eater.com': 'Food & Drink', 'thrillist.com': 'Food & Drink',
  'tastingtable.com': 'Food & Drink', 'cookinglight.com': 'Food & Drink',
  'saveur.com': 'Food & Drink', 'tablespoon.com': 'Food & Drink',
  'just-eat.com': 'Food & Drink', 'deliveroo.com': 'Food & Drink',
  'vivino.com': 'Food & Drink', 'untappd.com': 'Food & Drink',

  // Automotive
  'cars.com': 'Automotive', 'autotrader.com': 'Automotive', 'carmax.com': 'Automotive',
  'carvana.com': 'Automotive', 'edmunds.com': 'Automotive', 'kbb.com': 'Automotive',
  'motortrend.com': 'Automotive', 'caranddriver.com': 'Automotive',
  'roadandtrack.com': 'Automotive', 'jalopnik.com': 'Automotive',
  'autoblog.com': 'Automotive', 'truecar.com': 'Automotive', 'carfax.com': 'Automotive',
  'vroom.com': 'Automotive', 'autozone.com': 'Automotive', 'napaonline.com': 'Automotive',
  'rockauto.com': 'Automotive', 'tesla.com': 'Automotive', 'toyota.com': 'Automotive',
  'ford.com': 'Automotive', 'chevrolet.com': 'Automotive', 'bmw.com': 'Automotive',
  'mercedes-benz.com': 'Automotive', 'audi.com': 'Automotive', 'honda.com': 'Automotive',
  'hyundaiusa.com': 'Automotive', 'kia.com': 'Automotive', 'nissanusa.com': 'Automotive',
  'volkswagen.com': 'Automotive', 'subaru.com': 'Automotive', 'hemmings.com': 'Automotive',
  'classiccars.com': 'Automotive', 'car-part.com': 'Automotive',

  // Real Estate
  'zillow.com': 'Real Estate', 'redfin.com': 'Real Estate', 'realtor.com': 'Real Estate',
  'trulia.com': 'Real Estate', 'apartments.com': 'Real Estate', 'rent.com': 'Real Estate',
  'zumper.com': 'Real Estate', 'hotpads.com': 'Real Estate', 'homes.com': 'Real Estate',
  'opendoor.com': 'Real Estate', 'remax.com': 'Real Estate', 'century21.com': 'Real Estate',
  'compass.com': 'Real Estate', 'loopnet.com': 'Real Estate', 'movoto.com': 'Real Estate',
  'rightmove.co.uk': 'Real Estate', 'zoopla.co.uk': 'Real Estate',
  'immobilienscout24.de': 'Real Estate', 'seloger.com': 'Real Estate',

  // Education
  'coursera.org': 'Education', 'udemy.com': 'Education', 'edx.org': 'Education',
  'khanacademy.org': 'Education', 'duolingo.com': 'Education', 'quizlet.com': 'Education',
  'chegg.com': 'Education', 'w3schools.com': 'Education', 'codecademy.com': 'Education',
  'freecodecamp.org': 'Education', 'pluralsight.com': 'Education',
  'skillshare.com': 'Education', 'brilliant.org': 'Education', 'udacity.com': 'Education',
  'masterclass.com': 'Education', 'sparknotes.com': 'Education',
  'britannica.com': 'Education', 'wikipedia.org': 'Education',
  'dictionary.com': 'Education', 'merriam-webster.com': 'Education',
  'coursehero.com': 'Education', 'study.com': 'Education', 'vocabulary.com': 'Education',

  // Gaming
  'steampowered.com': 'Gaming', 'ign.com': 'Gaming', 'gamespot.com': 'Gaming',
  'polygon.com': 'Gaming', 'kotaku.com': 'Gaming', 'pcgamer.com': 'Gaming',
  'eurogamer.net': 'Gaming', 'rockpapershotgun.com': 'Gaming', 'epicgames.com': 'Gaming',
  'ea.com': 'Gaming', 'battle.net': 'Gaming', 'xbox.com': 'Gaming',
  'playstation.com': 'Gaming', 'nintendo.com': 'Gaming', 'gog.com': 'Gaming',
  'humblebundle.com': 'Gaming', 'gamefaqs.com': 'Gaming',
  'g2a.com': 'Gaming', 'neoseeker.com': 'Gaming', 'gamerant.com': 'Gaming',
  'dualshockers.com': 'Gaming', 'vgchartz.com': 'Gaming',

  // Parenting
  'babycenter.com': 'Parenting', 'parents.com': 'Parenting',
  'whattoexpect.com': 'Parenting', 'thebump.com': 'Parenting',
  'momjunction.com': 'Parenting', 'care.com': 'Parenting', 'babylist.com': 'Parenting',
  'commonsensemedia.org': 'Parenting', 'scholastic.com': 'Parenting',
  'nickjr.com': 'Parenting', 'pbs.org': 'Parenting', 'starfall.com': 'Parenting',

  // Fashion & Beauty
  'sephora.com': 'Fashion & Beauty', 'ulta.com': 'Fashion & Beauty',
  'glossier.com': 'Fashion & Beauty', 'allure.com': 'Fashion & Beauty',
  'elle.com': 'Fashion & Beauty', 'vogue.com': 'Fashion & Beauty',
  'harpersbazaar.com': 'Fashion & Beauty', 'instyle.com': 'Fashion & Beauty',
  'refinery29.com': 'Fashion & Beauty', 'byrdie.com': 'Fashion & Beauty',
  'cosmopolitan.com': 'Fashion & Beauty', 'glamour.com': 'Fashion & Beauty',
  'thecut.com': 'Fashion & Beauty', 'popsugar.com': 'Fashion & Beauty',
  'whowhatwear.com': 'Fashion & Beauty', 'stylebop.com': 'Fashion & Beauty',

  // Home & Garden
  'hgtv.com': 'Home & Garden', 'bhg.com': 'Home & Garden', 'thisoldhouse.com': 'Home & Garden',
  'bobvila.com': 'Home & Garden', 'potterybarn.com': 'Home & Garden',
  'crateandbarrel.com': 'Home & Garden', 'williams-sonoma.com': 'Home & Garden',
  'restorationhardware.com': 'Home & Garden', 'cb2.com': 'Home & Garden',
  'westelm.com': 'Home & Garden', 'houzz.com': 'Home & Garden',
  'apartmenttherapy.com': 'Home & Garden', 'architecturaldigest.com': 'Home & Garden',
  'dezeen.com': 'Home & Garden', 'gardenersworld.com': 'Home & Garden',

  // Pets
  'petco.com': 'Pets', 'petsmart.com': 'Pets', 'aspca.org': 'Pets',
  'akc.org': 'Pets', 'petmd.com': 'Pets', 'dogtime.com': 'Pets',
  'cattime.com': 'Pets', 'rover.com': 'Pets', 'wag.com': 'Pets',
  'hillspet.com': 'Pets', 'purina.com': 'Pets', 'royalcanin.com': 'Pets',

  // Science
  'nationalgeographic.com': 'Science', 'scientificamerican.com': 'Science',
  'nature.com': 'Science', 'newscientist.com': 'Science', 'space.com': 'Science',
  'nasa.gov': 'Science', 'smithsonianmag.com': 'Science', 'discovermagazine.com': 'Science',
  'popsci.com': 'Science', 'phys.org': 'Science', 'sciencedaily.com': 'Science',
  'livescience.com': 'Science',

  // Social Media
  'facebook.com': 'Social Media', 'instagram.com': 'Social Media',
  'twitter.com': 'Social Media', 'x.com': 'Social Media', 'tiktok.com': 'Social Media',
  'pinterest.com': 'Social Media', 'reddit.com': 'Social Media',
  'snapchat.com': 'Social Media', 'linkedin.com': 'Social Media',
  'tumblr.com': 'Social Media', 'quora.com': 'Social Media',
  'discord.com': 'Social Media', 'threads.net': 'Social Media',
};

export function categoryColor(cat: string): string {
  return COLORS[cat] ?? '#7e8a99';
}

export function lookupCategory(domain: string): string | null {
  return SITE_CATEGORIES[domain] ?? SITE_CATEGORIES[domain.replace(/^www\./, '')] ?? null;
}

export function computeProfile(
  rows: { site: string; entity: string; known: boolean }[],
): CategoryProfile[] {
  const map = new Map<string, { sites: Set<string>; companies: Map<string, number>; hits: number }>();

  for (const r of rows) {
    const cat = lookupCategory(r.site);
    if (!cat) continue;

    if (!map.has(cat)) map.set(cat, { sites: new Set(), companies: new Map(), hits: 0 });
    const c = map.get(cat)!;
    c.sites.add(r.site);
    c.hits++;
    if (r.entity && r.known) {
      c.companies.set(r.entity, (c.companies.get(r.entity) ?? 0) + 1);
    }
  }

  return [...map.entries()]
    .map(([category, d]) => ({
      category,
      color: categoryColor(category),
      siteCount: d.sites.size,
      trackerHits: d.hits,
      topCompanies: [...d.companies.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([e]) => e),
    }))
    .filter((c) => c.siteCount > 0)
    .sort((a, b) => b.trackerHits - a.trackerHits);
}
