/**
 * Data protection authorities a person can complain to (GDPR Art. 77: the one where they live).
 * Links checked 2026-10-03. Germany has one authority per state for companies, so it links the
 * official list; anyone else can find theirs through the EDPB.
 */

export type Law = 'eu' | 'uk';

export interface Authority {
  country: string; // ISO 3166-1 alpha-2
  countryName: string;
  name: string;
  url: string;
  law: Law;
  /** How the letter addresses it, when that differs from `name`. */
  addressee?: string;
}

export const FIND_AUTHORITY_URL = 'https://www.edpb.europa.eu/about-edpb/about-edpb/members_en';

export const AUTHORITIES: readonly Authority[] = [
  { country: 'AT', countryName: 'Austria', name: 'Österreichische Datenschutzbehörde (DSB)', url: 'https://www.dsb.gv.at/', law: 'eu' },
  { country: 'BE', countryName: 'Belgium', name: 'Data Protection Authority (APD/GBA)', url: 'https://www.dataprotectionauthority.be/', law: 'eu' },
  { country: 'CZ', countryName: 'Czechia', name: 'Úřad pro ochranu osobních údajů (ÚOOÚ)', url: 'https://uoou.gov.cz/', law: 'eu' },
  { country: 'DK', countryName: 'Denmark', name: 'Datatilsynet', url: 'https://www.datatilsynet.dk/', law: 'eu' },
  { country: 'FI', countryName: 'Finland', name: 'Office of the Data Protection Ombudsman', url: 'https://tietosuoja.fi/', law: 'eu' },
  { country: 'FR', countryName: 'France', name: "Commission nationale de l'informatique et des libertés (CNIL)", url: 'https://www.cnil.fr/fr/plaintes', law: 'eu' },
  { country: 'DE', countryName: 'Germany', name: 'the data protection authority of your federal state', addressee: 'the data protection authority of my federal state', url: 'https://www.datenschutzkonferenz-online.de/datenschutzaufsichtsbehoerden.html', law: 'eu' },
  { country: 'GR', countryName: 'Greece', name: 'Hellenic Data Protection Authority', url: 'https://www.dpa.gr/', law: 'eu' },
  { country: 'IE', countryName: 'Ireland', name: 'Data Protection Commission', url: 'https://www.dataprotection.ie/', law: 'eu' },
  { country: 'IT', countryName: 'Italy', name: 'Garante per la protezione dei dati personali', url: 'https://www.garanteprivacy.it/', law: 'eu' },
  { country: 'LU', countryName: 'Luxembourg', name: 'Commission nationale pour la protection des données (CNPD)', url: 'https://cnpd.public.lu/', law: 'eu' },
  { country: 'NL', countryName: 'Netherlands', name: 'Autoriteit Persoonsgegevens', url: 'https://www.autoriteitpersoonsgegevens.nl/', law: 'eu' },
  { country: 'NO', countryName: 'Norway', name: 'Datatilsynet', url: 'https://www.datatilsynet.no/', law: 'eu' },
  { country: 'PL', countryName: 'Poland', name: 'Urząd Ochrony Danych Osobowych (UODO)', url: 'https://uodo.gov.pl/', law: 'eu' },
  { country: 'PT', countryName: 'Portugal', name: 'Comissão Nacional de Proteção de Dados (CNPD)', url: 'https://www.cnpd.pt/', law: 'eu' },
  { country: 'ES', countryName: 'Spain', name: 'Agencia Española de Protección de Datos (AEPD)', url: 'https://www.aepd.es/', law: 'eu' },
  { country: 'SE', countryName: 'Sweden', name: 'Integritetsskyddsmyndigheten (IMY)', url: 'https://www.imy.se/', law: 'eu' },
  { country: 'GB', countryName: 'United Kingdom', name: "Information Commissioner's Office (ICO)", url: 'https://ico.org.uk/make-a-complaint/', law: 'uk' },
];

export function authorityFor(country: string | null | undefined): Authority | null {
  const code = country?.toUpperCase();
  return AUTHORITIES.find((a) => a.country === code) ?? null;
}

/** First browser language with a region we have an authority for, e.g. "es-ES" → "ES". */
export function guessCountry(languages: readonly string[]): string | null {
  for (const lang of languages) {
    const region = lang.split('-')[1];
    if (region && authorityFor(region)) return region.toUpperCase();
  }
  return null;
}
