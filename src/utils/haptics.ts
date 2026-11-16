export function triggerHaptic(enabled: boolean): void {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(18);
    }
  } catch {
    // Non-fatal
  }
}
