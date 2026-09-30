/**
 * Count the vendors in a TCF v2.2 TC string's DisclosedVendors segment, every vendor the CMP
 * disclosed to the user, i.e. every company claiming the right to process their data.
 *
 * Unlike the TCData vendor maps, this doesn't depend on the user's choice: it survives a reject,
 * and it's populated by CMPs (e.g. Didomi) that leave the maps empty before consent.
 *
 * Segment layout (IAB TCF v2.2): SegmentType(3)=1, MaxVendorId(16), IsRangeEncoding(1), then
 * either a MaxVendorId-bit bitfield, or NumEntries(12) × [IsARange(1), Start(16), End(16)?].
 */

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const SEGMENT_DISCLOSED_VENDORS = 1;

function toBits(segment: string): string | null {
  let bits = '';
  for (const ch of segment) {
    const v = B64URL.indexOf(ch);
    if (v < 0) return null;
    bits += v.toString(2).padStart(6, '0');
  }
  return bits;
}

/** Reads fixed-width unsigned ints from a bit string; throws on overrun. */
function reader(bits: string): (width: number) => number {
  let pos = 0;
  return (width) => {
    if (pos + width > bits.length) throw new RangeError('truncated TC segment');
    const v = parseInt(bits.slice(pos, pos + width), 2);
    pos += width;
    return v;
  };
}

function countSegment(bits: string): number {
  const read = reader(bits);
  read(3); // segment type
  const maxVendorId = read(16);
  if (read(1) === 0) {
    let n = 0;
    for (let i = 0; i < maxVendorId; i++) n += read(1);
    return n;
  }
  let n = 0;
  const entries = read(12);
  for (let i = 0; i < entries; i++) {
    const isRange = read(1) === 1;
    const start = read(16);
    n += isRange ? Math.max(0, read(16) - start + 1) : 1;
  }
  return n;
}

/** Number of disclosed vendors, or null if the string has no (valid) DisclosedVendors segment. */
export function countDisclosedVendors(tcString: string | null | undefined): number | null {
  if (!tcString) return null;
  for (const segment of tcString.split('.').slice(1)) {
    const bits = toBits(segment);
    if (!bits || bits.length < 3) continue;
    if (parseInt(bits.slice(0, 3), 2) !== SEGMENT_DISCLOSED_VENDORS) continue;
    try {
      return countSegment(bits);
    } catch {
      return null;
    }
  }
  return null;
}
