import { useEffect, useState, useCallback, useRef } from "react";

/** True when user prefers reduced motion (accessibility + perf on low-end devices). */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

/** Coarse pointer / touch-primary devices (phones, tablets). */
export function useIsMobile() {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return mobile;
}

/** Returns true when document tab is hidden — pause RAF loops. */
export function usePageVisible() {
  const [visible, setVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible"
  );

  useEffect(() => {
    const handler = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return visible;
}

/** Throttle a callback to one call per animation frame. */
export function useRafThrottle(callback) {
  const cbRef = useRef(callback);
  const rafRef = useRef(null);
  const argsRef = useRef(null);

  cbRef.current = callback;

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return useCallback((...args) => {
    argsRef.current = args;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      cbRef.current(...(argsRef.current || []));
    });
  }, []);
}

/** Debounce for resize / search handlers. */
export function useDebouncedCallback(fn, delay = 150) {
  const fnRef = useRef(fn);
  const timerRef = useRef(null);

  fnRef.current = fn;

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]);
}
