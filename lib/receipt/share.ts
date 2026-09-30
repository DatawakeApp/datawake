import { toReceiptData, type ReceiptInput } from './model';
import { renderReceiptBlob } from './render';
import { receiptCaption, receiptTitle, receiptFileName } from './caption';

/** How the share resolved, so the caller can show the right confirmation. */
export type ShareOutcome =
  | { kind: 'shared' } // handed to the OS share sheet (mobile / supported desktop)
  | { kind: 'downloaded'; captionCopied: boolean } // PNG saved; caption on clipboard if possible
  | { kind: 'cancelled' } // user dismissed the native share sheet
  | { kind: 'error'; message: string };

/**
 * Turn a violation into a shareable receipt and get it out into the world in one tap.
 *
 * Prefers the native Web Share API with the PNG attached (ideal on mobile). Falls back
 * to downloading the PNG and copying the pre-written caption to the clipboard so the
 * user can paste it anywhere. Everything happens on-device, nothing is uploaded.
 */
export async function shareReceipt(input: ReceiptInput): Promise<ShareOutcome> {
  try {
    const data = toReceiptData(input);
    const blob = await renderReceiptBlob(data);
    const file = new File([blob], receiptFileName(data), { type: 'image/png' });
    const caption = receiptCaption(data);
    const title = receiptTitle(data);

    const nav = navigator as Navigator & {
      canShare?: (d?: ShareData) => boolean;
      share?: (d: ShareData) => Promise<void>;
    };

    // Native share with the image attached, the one-tap path.
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], text: caption, title });
        return { kind: 'shared' };
      } catch (err) {
        // AbortError = user closed the sheet; treat as a clean cancel, not a failure.
        if (err instanceof DOMException && err.name === 'AbortError') {
          return { kind: 'cancelled' };
        }
        // Any other share failure (e.g. NotAllowedError) → fall through to download.
      }
    }

    downloadBlob(blob, file.name);
    const captionCopied = await copyText(caption);
    return { kind: 'downloaded', captionCopied };
  } catch (err) {
    return { kind: 'error', message: err instanceof Error ? err.message : 'Could not create receipt' };
  }
}

/** Trigger a browser download of a blob via a transient object URL. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has grabbed the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Copy text to the clipboard; returns false if the API is blocked rather than throwing. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
