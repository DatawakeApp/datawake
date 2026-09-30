import { describe, it, expect } from 'vitest';
import { buildLetter } from '../lib/gdpr/templates';
import { guessPrivacyContact } from '../lib/gdpr/contacts';

const p = { company: 'Acme Corp', name: 'Jane Doe', email: 'jane@example.com' };

describe('GDPR letters', () => {
  it('access letter cites Article 15 and includes identity + company', () => {
    const l = buildLetter('access', p);
    expect(l.subject).toMatch(/15/);
    expect(l.body).toContain('Article 15');
    expect(l.body).toContain('Jane Doe');
    expect(l.body).toContain('jane@example.com');
    expect(l.body).toContain('Acme Corp');
  });

  it('erasure letter cites Article 17', () => {
    const l = buildLetter('erasure', p);
    expect(l.subject).toMatch(/17/);
    expect(l.body).toContain('Article 17');
  });
});

describe('guessPrivacyContact', () => {
  it('builds privacy@domain, stripping scheme/www/path', () => {
    expect(guessPrivacyContact('https://www.spotify.com/account')).toBe('privacy@spotify.com');
    expect(guessPrivacyContact('example.com')).toBe('privacy@example.com');
    expect(guessPrivacyContact('')).toBe('');
  });
});
