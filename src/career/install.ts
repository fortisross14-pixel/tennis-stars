// "Install app" support. Chrome/Edge/Android fire `beforeinstallprompt` when
// the game can be installed; we keep the event and fire it from our button.
// iOS Safari has no prompt: the button shows Add to Home Screen steps instead.

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function initInstall() {
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; notify(); });
  addEventListener('appinstalled', () => { deferred = null; notify(); });
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch((e) => console.warn('Service worker failed', e));
  }
}

export function onInstallChange(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export type InstallState = 'standalone' | 'ready' | 'ios' | 'manual';
export function installState(): InstallState {
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (standalone) return 'standalone';
  if (deferred) return 'ready';
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  return 'manual';
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const e = deferred;
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  notify();
  return outcome === 'accepted';
}
