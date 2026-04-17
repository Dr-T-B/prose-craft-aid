// Content provider — loads bundle from Supabase (with local-seed fallback)
// once on mount and exposes it via React context. Pages can read content
// arrays from here; logic helpers in planLogic.ts continue to work off the
// local seed as a deterministic fallback if remote arrays are missing.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadContent, localContentBundle, type ContentBundle } from "@/lib/contentRepo";

const ContentCtx = createContext<ContentBundle>(localContentBundle);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<ContentBundle>(localContentBundle);

  useEffect(() => {
    let cancelled = false;
    loadContent().then((b) => { if (!cancelled) setBundle(b); });
    return () => { cancelled = true; };
  }, []);

  return <ContentCtx.Provider value={bundle}>{children}</ContentCtx.Provider>;
}

export function useContent(): ContentBundle {
  return useContext(ContentCtx);
}
