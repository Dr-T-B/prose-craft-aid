import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY_GRADE_B_MODE = "pca.gradeBMode.v1";

interface GradeBModeContextValue {
  gradeBMode: boolean;
  setGradeBMode: (enabled: boolean) => void;
  toggleGradeBMode: () => void;
}

const GradeBModeContext = createContext<GradeBModeContextValue | undefined>(undefined);

export function readStoredGradeBMode(storage: Pick<Storage, "getItem"> = localStorage): boolean {
  try {
    return storage.getItem(KEY_GRADE_B_MODE) === "1";
  } catch {
    return false;
  }
}

export function writeStoredGradeBMode(enabled: boolean, storage: Pick<Storage, "setItem"> = localStorage) {
  try {
    storage.setItem(KEY_GRADE_B_MODE, enabled ? "1" : "0");
  } catch {
    /* noop */
  }
}

export function GradeBModeProvider({ children }: { children: ReactNode }) {
  const [gradeBMode, setGradeBModeState] = useState(() => readStoredGradeBMode());

  useEffect(() => {
    writeStoredGradeBMode(gradeBMode);
  }, [gradeBMode]);

  const setGradeBMode = useCallback((enabled: boolean) => {
    setGradeBModeState(enabled);
  }, []);

  const toggleGradeBMode = useCallback(() => {
    setGradeBModeState((enabled) => !enabled);
  }, []);

  const value = useMemo(
    () => ({ gradeBMode, setGradeBMode, toggleGradeBMode }),
    [gradeBMode, setGradeBMode, toggleGradeBMode],
  );

  return <GradeBModeContext.Provider value={value}>{children}</GradeBModeContext.Provider>;
}

export function useGradeBMode() {
  const context = useContext(GradeBModeContext);
  if (!context) throw new Error("useGradeBMode must be used inside GradeBModeProvider");
  return context;
}
