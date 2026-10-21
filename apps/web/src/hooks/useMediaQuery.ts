import { useEffect, useState } from "react";

/**
 * useMediaQuery — observe a CSS media query from React.
 * Returns true when the query matches. SSR-safe (returns false during render
 * on the server, then re-reads on mount).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Compact panels on phones and tablets; three rails need more than 1100px. */
export const useIsMobile = () => useMediaQuery("(max-width: 1100px)");
