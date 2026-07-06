"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Imperatively kick off the navigation bar. Use for programmatic navigations
 * (router.push / router.replace) so the bar shows the instant the user clicks,
 * not when the App Router finally commits the new URL.
 *
 *   onClick={() => { startNavProgress(); router.push("/somewhere"); }}
 *
 * Anchor (<Link>) clicks are detected automatically and don't need this.
 */
export function startNavProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("nav-progress:start"));
  }
}

/**
 * Global top navigation progress bar (YouTube / GitHub style).
 *
 * The App Router keeps the *current* page on screen while the next route's
 * JS chunk and data resolve — with no built-in signal — so a click reads as a
 * frozen, dead click until the new page suddenly pops in. This bar gives the
 * missing feedback: it starts the moment a navigation begins and finishes when
 * the route settles.
 *
 * Start is detected three ways so nothing slips through:
 *   1. capture-phase clicks on same-origin <a> elements (all <Link>s),
 *   2. the imperative {@link startNavProgress} event (programmatic router.push),
 *   3. a patched history.pushState/replaceState (belt-and-braces fallback).
 * Finish is detected when the committed pathname + search params change.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const activeRef = useRef(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest start/finish in refs so the one-time effect listeners
  // below always call the current version without re-subscribing.
  const startRef = useRef<() => void>(() => {});
  const finishRef = useRef<() => void>(() => {});

  const clearTimers = () => {
    if (trickleRef.current) clearInterval(trickleRef.current);
    if (fadeRef.current) clearTimeout(fadeRef.current);
    if (safetyRef.current) clearTimeout(safetyRef.current);
    trickleRef.current = null;
    fadeRef.current = null;
    safetyRef.current = null;
  };

  startRef.current = () => {
    if (activeRef.current) return; // a navigation is already in flight
    activeRef.current = true;
    clearTimers();
    setVisible(true);
    setProgress(8);
    // Ease toward 90% and hold there until the route commits.
    trickleRef.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.max(0.4, (90 - p) * 0.06)));
    }, 180);
    // Never let the bar get stuck if a navigation is aborted or never commits.
    safetyRef.current = setTimeout(() => finishRef.current(), 12_000);
  };

  finishRef.current = () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearTimers();
    setProgress(100);
    fadeRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 320);
  };

  // Finish whenever the committed route (path or query) actually changes.
  useEffect(() => {
    finishRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Detect the start of a navigation.
  useEffect(() => {
    const onStartEvent = () => startRef.current();

    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.hasAttribute("download") || anchor.hasAttribute("target"))
        return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same page (or a pure #hash change) — no route transition happens.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;
      startRef.current();
    };

    // Belt-and-braces: catch any programmatic navigation we didn't wrap.
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    window.history.pushState = function (...args) {
      startRef.current();
      return origPush.apply(this, args as Parameters<typeof origPush>);
    };
    window.history.replaceState = function (...args) {
      return origReplace.apply(this, args as Parameters<typeof origReplace>);
    };

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("nav-progress:start", onStartEvent);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("nav-progress:start", onStartEvent);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5"
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-brand via-teal to-copper-soft shadow-[0_0_10px_hsl(var(--teal)/0.6),0_0_5px_hsl(var(--teal)/0.4)]"
        style={{
          width: `${progress}%`,
          transition:
            progress === 100
              ? "width 180ms ease-out, opacity 260ms ease-in 200ms"
              : "width 220ms ease-out",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
