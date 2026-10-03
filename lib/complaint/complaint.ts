/**
 * A complaint to a data protection authority about a site that kept tracking after Reject, built
 * only from what Datawake recorded. Factual and hedged ("appears to"): the authority decides.
 */
import type { Authority } from './authorities';
import { groupViolationCookiesByCompany } from '../cookies/describe';

export interface ViolationEvidence {
  site: string;
  url: string;
  timestamp: number;
  newCookies: Array<{ name: string; domain: string }>;
  fingerprinters?: readonly string[];
}

export interface Complainant {
  name: string;
  email: string;
}

export interface Complaint {
  subject: string;
  body: string;
}

const LAW: Record<Authority['law'], string> = {
  eu: 'Under Article 5(3) of the ePrivacy Directive (2002/58/EC), as implemented in national law, storing or reading non-essential information on my device requires my consent. I refused, so this processing appears to have no legal basis under Article 6(1) GDPR, and my refusal was not respected.',
  uk: 'Under regulation 6 of the Privacy and Electronic Communications Regulations (PECR), storing or reading non-essential information on my device requires my consent. I refused, so this processing appears to have no lawful basis under Article 6(1) UK GDPR, and my refusal was not respected.',
};

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

export function buildComplaint(v: ViolationEvidence, authority: Authority, who: Complainant): Complaint {
  const when = new Date(v.timestamp);
  const date = when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const groups = groupViolationCookiesByCompany(v.newCookies);
  const fp = v.fingerprinters ?? [];

  const evidence: string[] = [];
  if (v.newCookies.length > 0) {
    evidence.push(`- It set ${plural(v.newCookies.length, 'tracking cookie', 'tracking cookies')} from ${plural(groups.length, 'company', 'companies')}:`);
    for (const g of groups) {
      const names = g.cookies.map((c) => c.name).join(', ');
      evidence.push(`    ${g.company}: ${names}`);
    }
  }
  if (fp.length > 0) {
    evidence.push(`- Scripts from ${fp.join(', ')} identified my device by fingerprinting, which works without cookies.`);
  }

  const what = v.newCookies.length > 0 ? 'set tracking cookies' : 'fingerprinted my device';
  const subject = `Complaint: ${v.site} ${what} after I refused consent`;

  const body = [
    `To ${authority.addressee ?? authority.name},`,
    '',
    `I would like to report the website ${v.site} (${v.url}).`,
    '',
    `On ${date}, I refused consent on the site's cookie banner. My browser extension, Datawake, clicked "Reject" on my behalf, as I had set it to, and also sent the Global Privacy Control signal. At ${time}, Datawake recorded that the site tracked me anyway:`,
    '',
    ...evidence,
    '',
    LAW[authority.law],
    '',
    'I ask you to look into this. I can provide the evidence file recorded by Datawake on request.',
    '',
    'Kind regards,',
    who.name.trim() || '[Your name]',
    who.email.trim() || '[Your email]',
  ].join('\n');

  return { subject, body };
}

/** The raw evidence as a JSON file the user can attach. */
export function evidenceFile(v: ViolationEvidence): string {
  return JSON.stringify(
    {
      site: v.site,
      url: v.url,
      detectedAt: new Date(v.timestamp).toISOString(),
      cookiesSetAfterReject: v.newCookies,
      fingerprintingAfterReject: v.fingerprinters ?? [],
      recordedBy: 'Datawake browser extension (https://datawake.app). Recorded locally on the complainant\'s device.',
    },
    null,
    2,
  );
}
