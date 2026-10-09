import { describe, it, expect } from 'vitest';
import { parseBreaches, readableName, lookupUrl } from '../lib/breach/lookup';

const sample = {
  ExposedBreaches: {
    breaches_details: [
      { breach: 'Adobe', xposed_date: '2013', xposed_records: 152445165, xposed_data: 'Email addresses;Password hints;Passwords;Usernames', password_risk: 'easytocrack' },
      { breach: 'ManchesterAirportsGroup', xposed_date: '2026', xposed_records: 8400000, xposed_data: 'Email addresses;Names', password_risk: 'plaintext' },
    ],
  },
};

describe('parseBreaches', () => {
  it('turns the database response into readable breaches, newest first', () => {
    const b = parseBreaches(sample);
    expect(b.map((x) => x.name)).toEqual(['Manchester Airports Group', 'Adobe']);
    expect(b[0]).toMatchObject({ year: '2026', records: 8400000, plaintextPasswords: true });
    expect(b[1].exposed).toEqual(['Email addresses', 'Password hints', 'Passwords', 'Usernames']);
  });

  it('is empty when the email is not in any breach', () => {
    expect(parseBreaches({ ExposedBreaches: null })).toEqual([]);
    expect(parseBreaches({})).toEqual([]);
    expect(parseBreaches(null)).toEqual([]);
  });

  it('ignores malformed entries from the outside service', () => {
    expect(parseBreaches({ ExposedBreaches: { breaches_details: [{ nope: 1 }, 'x', { breach: 42 }] } })).toEqual([]);
  });
});

describe('readableName', () => {
  it('splits run-together names but leaves short brand names alone', () => {
    expect(readableName('ManchesterAirportsGroup')).toBe('Manchester Airports Group');
    expect(readableName('LinkedIn')).toBe('LinkedIn');
    expect(readableName('Adobe')).toBe('Adobe');
  });
});

describe('lookupUrl', () => {
  it('encodes the email', () => {
    expect(lookupUrl('a+b@example.com')).toBe('https://api.xposedornot.com/v1/breach-analytics?email=a%2Bb%40example.com');
  });
});
