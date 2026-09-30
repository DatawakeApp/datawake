export interface LetterParams {
  company: string;
  name: string;
  email: string;
  address?: string;
  date?: string;
}

export interface Letter {
  subject: string;
  body: string;
}

export type RequestKind = 'access' | 'erasure';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function accessLetter(p: LetterParams): Letter {
  const date = p.date || today();
  const subject = `Data Subject Access Request (GDPR Art. 15): ${p.name}`;
  const body = `To the Data Protection Officer / Privacy Team at ${p.company},

I am exercising my right of access under Article 15 of the EU General Data Protection Regulation (GDPR).

Please provide, within one month (Art. 12(3)):
1. Confirmation of whether you process personal data about me;
2. A copy of all personal data you hold about me;
3. The purposes of the processing;
4. The categories of personal data concerned;
5. The recipients or categories of recipients the data has been or will be disclosed to, in particular any recipients in third countries;
6. Where possible, the envisaged retention period;
7. The source of the data, where it was not collected from me;
8. Whether automated decision-making, including profiling, takes place, and meaningful information about the logic involved.

Please provide the data in a commonly used, machine-readable electronic format.

My identifying details:
Name: ${p.name}
Email: ${p.email}${p.address ? `\nAddress: ${p.address}` : ''}

If you need to verify my identity, please tell me specifically what is required, and do not use this request to collect more data than necessary.

Date: ${date}

Regards,
${p.name}`;
  return { subject, body };
}

export function erasureLetter(p: LetterParams): Letter {
  const date = p.date || today();
  const subject = `Request for Erasure (GDPR Art. 17): ${p.name}`;
  const body = `To the Data Protection Officer / Privacy Team at ${p.company},

I am exercising my right to erasure ("right to be forgotten") under Article 17 of the EU General Data Protection Regulation (GDPR).

Please erase all personal data you hold about me and confirm the erasure in writing within one month (Art. 12(3)). Where you have made my personal data public or shared it with other controllers or processors, please also inform them of this request as required by Art. 17(2) and Art. 19, and provide me with the list of those recipients.

If you believe you have lawful grounds to retain some or all of my data, please specify the exact data, the legal basis, and the retention period.

Please also stop any further processing of my personal data for direct marketing and, where applicable, withdraw it from any sale or sharing.

My identifying details:
Name: ${p.name}
Email: ${p.email}${p.address ? `\nAddress: ${p.address}` : ''}

Date: ${date}

Regards,
${p.name}`;
  return { subject, body };
}

export function buildLetter(kind: RequestKind, p: LetterParams): Letter {
  return kind === 'access' ? accessLetter(p) : erasureLetter(p);
}
