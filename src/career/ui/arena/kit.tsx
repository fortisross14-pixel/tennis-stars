import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/** Light haptic tick on devices that support it. */
export function haptic(ms = 8) { try { (navigator as any).vibrate?.(ms); } catch { /* not supported */ } }

/** Tap ripple on every Arena button, installed once. */
let rippleInstalled = false;
export function installRipple() {
  if (rippleInstalled || typeof document === 'undefined') return;
  rippleInstalled = true;
  document.addEventListener('pointerdown', (e) => {
    const t = (e.target as HTMLElement)?.closest?.('.ar button, .ar .ar-tap') as HTMLElement | null;
    if (!t || (t as HTMLButtonElement).disabled) return;
    const r = t.getBoundingClientRect();
    const s = document.createElement('span');
    const size = Math.max(r.width, r.height) * 1.4;
    s.className = 'ar-ripple';
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
    t.style.overflow = 'hidden';
    t.appendChild(s);
    setTimeout(() => s.remove(), 650);
  }, { passive: true });
}

/** Animate a number from its previous value to the new one. */
export function useCountUp(value: number, ms = 700) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current, to = value; prev.current = value;
    if (from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(to); return; }
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => { const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3); setShown(from + (to - from) * e); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}
export function CountUp({ value, format = (n: number) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) {
  const v = useCountUp(value);
  return <>{format(v)}</>;
}

/** Horizontal swipe on an element: calls onLeft / onRight. Ignores swipes that start in scrollable areas or inputs. */
export function useSwipe(ref: React.RefObject<HTMLElement>, onLeft: () => void, onRight: () => void) {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let x0 = 0, y0 = 0, t0 = 0, active = false;
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      const t = e.target as HTMLElement;
      if (t.closest('input,select,textarea,.table-wrap,.ar-noswipe,.ar-hscroll')) return;
      active = true; x0 = e.clientX; y0 = e.clientY; t0 = Date.now();
    };
    const up = (e: PointerEvent) => {
      if (!active) return; active = false;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (Date.now() - t0 < 600 && Math.abs(dx) > 70 && Math.abs(dy) < 50) { haptic(); if (dx < 0) onLeft(); else onRight(); }
    };
    el.addEventListener('pointerdown', down, { passive: true }); el.addEventListener('pointerup', up, { passive: true });
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointerup', up); };
  }, [ref, onLeft, onRight]);
}

/** Pill tab bar with a sliding indicator. */
export function ArTabs<T extends string>({ tabs, value, onChange, keys, small, badge }: { tabs: [T, string][]; value: T; onChange: (v: T) => void; keys?: [string, string]; small?: boolean; badge?: Partial<Record<T, number>> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ x: number; w: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-tab="${value}"]`);
    if (el && ref.current) { setInd({ x: el.offsetLeft, w: el.offsetWidth }); el.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }
  }, [value, tabs.length]);
  useEffect(() => {
    // re-measure when the layout or the web font changes the tab widths
    const onR = () => { const el = ref.current?.querySelector<HTMLElement>(`[data-tab="${value}"]`); if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth }); };
    window.addEventListener('resize', onR);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onR) : null;
    if (ro && ref.current) { ro.observe(ref.current); ref.current.querySelectorAll('button').forEach((b) => ro.observe(b)); }
    (document as any).fonts?.ready?.then(onR);
    const t = setTimeout(onR, 400);
    return () => { window.removeEventListener('resize', onR); ro?.disconnect(); clearTimeout(t); };
  }, [value, tabs.length]);
  return <nav className={`ar-tabs ${small ? 'small' : ''}`} aria-label="Tabs">
    {keys && <span className="ar-key kb">{keys[0]}</span>}
    <div className="ar-tabs-track ar-hscroll" ref={ref}>
      {ind && <i className="ar-tabs-ind" style={{ transform: `translateX(${ind.x}px)`, width: ind.w }} />}
      {tabs.map(([k, l]) => <button key={k} data-tab={k} className={value === k ? 'on' : ''} onClick={() => { haptic(); onChange(k); }}>{l}{badge?.[k] ? <em className="ar-tab-badge">{badge[k]}</em> : null}</button>)}
    </div>
    {keys && <span className="ar-key kb">{keys[1]}</span>}
  </nav>;
}

/** Confetti burst (pure CSS particles). */
export function Confetti({ count = 70, colors = ['#ff7a3d', '#ffd84a', '#3ee0cf', '#ffffff', '#ffb36b'] }: { count?: number; colors?: string[] }) {
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.6, dur: 1.8 + Math.random() * 1.6, rot: Math.random() * 720 - 360,
    drift: Math.random() * 160 - 80, size: 6 + Math.random() * 8, color: colors[i % colors.length], round: Math.random() < 0.3,
  })), [count]);
  return <div className="ar-confetti" aria-hidden="true">{bits.map((b, i) => <i key={i} style={{ left: `${b.left}%`, width: b.size, height: b.size * (b.round ? 1 : 0.45), background: b.color, borderRadius: b.round ? '50%' : 2, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, ['--rot' as any]: `${b.rot}deg`, ['--drift' as any]: `${b.drift}px` }} />)}</div>;
}

export function ArModal({ title, kicker, onClose, children, actions, wide }: { title: React.ReactNode; kicker?: string; onClose?: () => void; children: React.ReactNode; actions?: React.ReactNode; wide?: boolean }) {
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return <div className="ar-modal" role="dialog" aria-modal="true" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
    <div className={`ar-modal-card ${wide ? 'wide' : ''}`}>
      <header>{kicker && <small>{kicker}</small>}<h3>{title}</h3>{onClose && <button className="ar-x" onClick={onClose} aria-label="Close">✕</button>}</header>
      <div className="ar-modal-body">{children}</div>
      {actions && <footer>{actions}</footer>}
    </div>
  </div>;
}

/** Toast for short notices. */
export function Toast({ text }: { text: string }) {
  if (!text) return null;
  return <div className="ar-toast" key={text} role="status">{text}</div>;
}

/** Tilt an element toward the pointer (cards, hero court). */
export function useTilt(ref: React.RefObject<HTMLElement>, max = 6) {
  useEffect(() => {
    const el = ref.current; if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.setProperty('--tx', `${(-y * max).toFixed(2)}deg`); el.style.setProperty('--ty', `${(x * max).toFixed(2)}deg`); };
    const leave = () => { el.style.setProperty('--tx', '0deg'); el.style.setProperty('--ty', '0deg'); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [ref, max]);
}
