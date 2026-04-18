import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { DATASETS, DATASET_BY_KEY, type DatasetKey } from "@/lib/datasets";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, AlertTriangle, Download, Upload, Search, Link2, Check, X, CalendarIcon, Bookmark, BookmarkPlus, Trash2, Star, StarOff, Cloud, CloudOff, HardDrive, Loader2, ArrowUpFromLine } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface PersistedIssue {
  row: number;
  id?: string | null;
  field?: string | null;
  message: string;
  rawValue?: string | null;
}

interface ImportLogRow {
  id: string;
  dataset: string;
  filename: string | null;
  created_at: string;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  imported_by: string | null;
  errors: PersistedIssue[] | null;
}

const truncate = (s: string, n = 80) => (s.length > n ? `${s.slice(0, n - 3)}…` : s);

function formatTimestampForFilename(date: string | Date): string {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function exportIssuesToCsv(importLog: ImportLogRow) {
  if (!importLog.errors || importLog.errors.length === 0) return;

  const rows = importLog.errors.map((e) => ({
    dataset: importLog.dataset,
    mode: "live_import",
    imported_at: importLog.created_at,
    filename: importLog.filename ?? "",
    row_number: e.row,
    id: e.id ?? "",
    field_name: e.field ?? "",
    message: e.message,
    raw_value: e.rawValue ?? "",
  }));

  const header = ["dataset", "mode", "imported_at", "filename", "row_number", "id", "field_name", "message", "raw_value"];
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    if (/[\",\n\r]/.test(s)) return `"${s.replace(/"/g, "\"\"")}"`;
    return s;
  };
  const lines = [header.join(","), ...rows.map((r) => header.map((h) => escape(r[h as keyof typeof r])).join(","))];
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = formatTimestampForFilename(new Date());
  a.href = url;
  a.download = `${importLog.dataset}-issues-live_import-history-${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

interface ImportHistoryProps {
  onLoadedCountChange?: (count: number) => void;
}

export default function ImportHistory({ onLoadedCountChange }: ImportHistoryProps = {}) {
  const [logs, setLogs] = useState<ImportLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ImportLogRow | null>(null);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [searchParams, setSearchParams] = useSearchParams();

  const validKeys = new Set(DATASETS.map((d) => d.key));
  const rawDataset = searchParams.get("dataset");
  const datasetFilter: "all" | DatasetKey =
    rawDataset && validKeys.has(rawDataset as DatasetKey) ? (rawDataset as DatasetKey) : "all";
  const search = searchParams.get("q") ?? "";

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };
  const setDatasetFilter = (v: "all" | DatasetKey) => updateParam("dataset", v === "all" ? "" : v);
  const setSearch = (v: string) => updateParam("q", v);

  const parseISODate = (v: string | null): Date | undefined => {
    if (!v) return undefined;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!m) return undefined;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? undefined : d;
  };
  const fmtISODate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const fromDate = parseISODate(searchParams.get("from"));
  const toDate = parseISODate(searchParams.get("to"));
  const setFromDate = (d: Date | undefined) => updateParam("from", d ? fmtISODate(d) : "");
  const setToDate = (d: Date | undefined) => updateParam("to", d ? fmtISODate(d) : "");
  const applyDateRange = (from: Date | undefined, to: Date | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (from) next.set("from", fmtISODate(from)); else next.delete("from");
    if (to) next.set("to", fmtISODate(to)); else next.delete("to");
    setSearchParams(next, { replace: true });
  };
  const applyPreset = (preset: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (preset === "today") {
      applyDateRange(today, today);
    } else if (preset === "last7") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      applyDateRange(start, today);
    } else if (preset === "last30") {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      applyDateRange(start, today);
    } else if (preset === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      applyDateRange(start, today);
    } else if (preset === "clear") {
      applyDateRange(undefined, undefined);
    }
  };

  type SavedView = { id: string; name: string; dataset: string; q: string; from: string; to: string };
  const SAVED_VIEWS_KEY = "import_history_saved_views";
  const DEFAULT_VIEW_KEY = "import_history_default_view_id";
  const { user } = useAuth();
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [defaultViewId, setDefaultViewId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [migratePromptOpen, setMigratePromptOpen] = useState(false);
  const [pendingMigrationViews, setPendingMigrationViews] = useState<SavedView[]>([]);
  const [pendingMigrationDefault, setPendingMigrationDefault] = useState<string | null>(null);
  const backendReadyRef = useRef(false);
  type SyncStatus = "local-only" | "synced" | "syncing" | "error" | "migration-available";
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local-only");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const RETRY_DELAYS_MS = [2000, 5000, 15000];
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryScheduled, setRetryScheduled] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryInFlightRef = useRef(false);
  const syncStatusRef = useRef<SyncStatus>("local-only");

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setRetryScheduled(false);
  };

  const isUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  const ensureUuid = (s: string) => (isUuid(s) ? s : crypto.randomUUID());

  const writeLocalCache = (views: SavedView[], defId: string | null) => {
    try {
      localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
      if (defId) localStorage.setItem(DEFAULT_VIEW_KEY, defId);
      else localStorage.removeItem(DEFAULT_VIEW_KEY);
    } catch {
      // ignore
    }
  };

  const readLocalCache = (): { views: SavedView[]; defaultId: string | null } => {
    let views: SavedView[] = [];
    let defaultId: string | null = null;
    try {
      const raw = localStorage.getItem(SAVED_VIEWS_KEY);
      if (raw) views = JSON.parse(raw) as SavedView[];
    } catch {
      // ignore
    }
    try {
      defaultId = localStorage.getItem(DEFAULT_VIEW_KEY);
    } catch {
      // ignore
    }
    return { views, defaultId };
  };

  // Core push: replaces all backend rows for the current user. Returns true on success.
  const savedViewsRef = useRef<SavedView[]>([]);
  const defaultViewIdRef = useRef<string | null>(null);
  useEffect(() => {
    savedViewsRef.current = savedViews;
  }, [savedViews]);
  useEffect(() => {
    defaultViewIdRef.current = defaultViewId;
  }, [defaultViewId]);

  const pushToBackend = useCallback(
    async (views: SavedView[], defId: string | null): Promise<boolean> => {
      if (!user) return false;
      const client = supabase as any;
      const { error: delErr } = await client.from("saved_views").delete().eq("user_id", user.id);
      if (delErr) throw delErr;
      if (views.length > 0) {
        const rows = views.map((v) => ({
          id: v.id,
          user_id: user.id,
          name: v.name,
          dataset: v.dataset,
          q: v.q,
          from: v.from,
          to: v.to,
          is_default: v.id === defId,
        }));
        const { error: insErr } = await client.from("saved_views").insert(rows);
        if (insErr) throw insErr;
      }
      return true;
    },
    [user],
  );

  const scheduleAutoRetryRef = useRef<(() => void) | null>(null);

  // Replace all backend rows for the current user with the given list.
  const syncToBackend = useCallback(
    async (views: SavedView[], defId: string | null) => {
      if (!user) return;
      clearRetryTimer();
      setSyncStatus("syncing");
      try {
        await pushToBackend(views, defId);
        setSyncStatus("synced");
        setLastSyncedAt(new Date());
        setRetryAttempt(0);
      } catch {
        setSyncStatus("error");
        scheduleAutoRetryRef.current?.();
      }
    },
    [user, pushToBackend],
  );

  const runAutoRetry = useCallback(async () => {
    if (!user) return;
    if (retryInFlightRef.current) return;
    retryInFlightRef.current = true;
    setRetryScheduled(false);
    setSyncStatus("syncing");
    try {
      await pushToBackend(savedViewsRef.current, defaultViewIdRef.current);
      setSyncStatus("synced");
      setLastSyncedAt(new Date());
      setRetryAttempt(0);
    } catch {
      setSyncStatus("error");
      // Schedule next retry if budget remains
      scheduleAutoRetryRef.current?.();
    } finally {
      retryInFlightRef.current = false;
    }
  }, [user, pushToBackend]);

  const scheduleAutoRetry = useCallback(() => {
    if (!user) return;
    if (retryTimerRef.current || retryInFlightRef.current) return;
    setRetryAttempt((prev) => {
      const nextAttempt = prev + 1;
      if (nextAttempt > RETRY_DELAYS_MS.length) {
        // Exhausted: keep error state; user can use manual Retry.
        return prev;
      }
      const delay = RETRY_DELAYS_MS[nextAttempt - 1];
      setRetryScheduled(true);
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        void runAutoRetry();
      }, delay);
      return nextAttempt;
    });
  }, [user, runAutoRetry]);

  useEffect(() => {
    scheduleAutoRetryRef.current = scheduleAutoRetry;
  }, [scheduleAutoRetry]);

  // Cleanup any pending retry timer on unmount.
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  // Keep a ref of syncStatus for use inside event listeners without re-binding.
  useEffect(() => {
    syncStatusRef.current = syncStatus;
  }, [syncStatus]);

  // Retry sync immediately when the browser regains network connectivity,
  // but only if we're authenticated, currently in error, and no push is in flight.
  useEffect(() => {
    if (!user) return;
    const handleOnline = async () => {
      if (!user) return;
      if (syncStatusRef.current !== "error") return;
      if (retryInFlightRef.current) return;
      retryInFlightRef.current = true;
      clearRetryTimer();
      setRetryScheduled(false);
      setSyncStatus("syncing");
      try {
        await pushToBackend(savedViewsRef.current, defaultViewIdRef.current);
        setSyncStatus("synced");
        setLastSyncedAt(new Date());
        setRetryAttempt(0);
        toast.success("Reconnected — sync successful");
      } catch {
        setSyncStatus("error");
        scheduleAutoRetryRef.current?.();
      } finally {
        retryInFlightRef.current = false;
      }
    };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [user, pushToBackend]);

  const retrySync = useCallback(async () => {
    if (!user) return;
    clearRetryTimer();
    setRetryAttempt(0);
    setSyncStatus("syncing");
    try {
      await pushToBackend(savedViews, defaultViewId);
      setSyncStatus("synced");
      setLastSyncedAt(new Date());
      toast.success("Sync successful");
    } catch {
      setSyncStatus("error");
      toast.error("Sync failed — still using local cache");
      scheduleAutoRetry();
    }
  }, [user, pushToBackend, savedViews, defaultViewId, scheduleAutoRetry]);

  const applyDefaultViewIfNoUrlFilters = useCallback(
    (views: SavedView[], defId: string | null) => {
      const hasUrlFilters = ["dataset", "q", "from", "to"].some((k) => searchParams.has(k));
      if (!hasUrlFilters && defId) {
        const view = views.find((v) => v.id === defId);
        if (view) {
          const next = new URLSearchParams(searchParams);
          (["dataset", "q", "from", "to"] as const).forEach((k) => {
            const v = view[k];
            if (v) next.set(k, v);
            else next.delete(k);
          });
          setSearchParams(next, { replace: true });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Initial load: try backend first, fall back to localStorage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocalCache();

      if (!user) {
        if (cancelled) return;
        setSavedViews(local.views);
        setDefaultViewId(local.defaultId);
        applyDefaultViewIfNoUrlFilters(local.views, local.defaultId);
        setSyncStatus("local-only");
        return;
      }

      setSyncStatus("syncing");
      try {
        const { data, error } = await (supabase as any)
          .from("saved_views")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (cancelled) return;
        if (error) throw error;
        const rows = (data ?? []) as Array<{
          id: string;
          name: string;
          dataset: string;
          q: string;
          from: string;
          to: string;
          is_default: boolean;
        }>;
        if (rows.length > 0) {
          const views: SavedView[] = rows.map((r) => ({
            id: r.id,
            name: r.name,
            dataset: r.dataset,
            q: r.q,
            from: r.from,
            to: r.to,
          }));
          const defId = rows.find((r) => r.is_default)?.id ?? null;
          setSavedViews(views);
          setDefaultViewId(defId);
          writeLocalCache(views, defId);
          applyDefaultViewIfNoUrlFilters(views, defId);
          backendReadyRef.current = true;
          setSyncStatus("synced");
          setLastSyncedAt(new Date());
        } else if (local.views.length > 0) {
          // Backend empty, local has data: offer migration.
          const normalized = local.views.map((v) => ({ ...v, id: ensureUuid(v.id) }));
          // Keep mapping of old default id to new
          let newDefault: string | null = null;
          if (local.defaultId) {
            const idx = local.views.findIndex((v) => v.id === local.defaultId);
            if (idx >= 0) newDefault = normalized[idx].id;
          }
          setPendingMigrationViews(normalized);
          setPendingMigrationDefault(newDefault);
          setMigratePromptOpen(true);
          // Show local immediately so UI isn't empty.
          setSavedViews(local.views);
          setDefaultViewId(local.defaultId);
          applyDefaultViewIfNoUrlFilters(local.views, local.defaultId);
          setSyncStatus("migration-available");
        } else {
          // Backend empty, no local — start fresh with backend as source.
          setSavedViews([]);
          setDefaultViewId(null);
          backendReadyRef.current = true;
          setSyncStatus("synced");
          setLastSyncedAt(new Date());
        }
      } catch {
        if (cancelled) return;
        setSavedViews(local.views);
        setDefaultViewId(local.defaultId);
        applyDefaultViewIfNoUrlFilters(local.views, local.defaultId);
        setSyncStatus("error");
        scheduleAutoRetryRef.current?.();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, applyDefaultViewIfNoUrlFilters]);

  const persistViews = (views: SavedView[]) => {
    setSavedViews(views);
    writeLocalCache(views, defaultViewId);
    if (user && backendReadyRef.current) {
      void syncToBackend(views, defaultViewId);
    }
  };

  const persistDefault = (id: string | null) => {
    setDefaultViewId(id);
    writeLocalCache(savedViews, id);
    if (user && backendReadyRef.current) {
      void syncToBackend(savedViews, id);
    }
  };

  const confirmMigrateLocalToBackend = async () => {
    if (!user) return;
    const views = pendingMigrationViews;
    const defId = pendingMigrationDefault;
    try {
      const client = supabase as any;
      const rows = views.map((v) => ({
        id: v.id,
        user_id: user.id,
        name: v.name,
        dataset: v.dataset,
        q: v.q,
        from: v.from,
        to: v.to,
        is_default: v.id === defId,
      }));
      if (rows.length > 0) {
        const { error } = await client.from("saved_views").insert(rows);
        if (error) throw error;
      }
      setSavedViews(views);
      setDefaultViewId(defId);
      writeLocalCache(views, defId);
      backendReadyRef.current = true;
      setMigratePromptOpen(false);
      setPendingMigrationViews([]);
      setPendingMigrationDefault(null);
      setSyncStatus("synced");
      setLastSyncedAt(new Date());
      toast.success(`Migrated ${views.length} saved view${views.length === 1 ? "" : "s"} to your account`);
    } catch {
      setSyncStatus("error");
      toast.error("Couldn’t migrate saved views to your account");
      scheduleAutoRetryRef.current?.();
    }
  };

  const skipMigration = () => {
    backendReadyRef.current = true;
    setMigratePromptOpen(false);
    setPendingMigrationViews([]);
    setPendingMigrationDefault(null);
    setSyncStatus("synced");
  };

  const saveCurrentView = () => {
    const name = newViewName.trim();
    if (!name) return;
    const view: SavedView = {
      id: crypto.randomUUID(),
      name,
      dataset: datasetFilter === "all" ? "" : datasetFilter,
      q: search,
      from: fromDate ? fmtISODate(fromDate) : "",
      to: toDate ? fmtISODate(toDate) : "",
    };
    persistViews([view, ...savedViews]);
    setNewViewName("");
    setSaveDialogOpen(false);
    toast.success(`Saved view “${name}”`);
  };

  const applyView = (view: SavedView) => {
    const next = new URLSearchParams(searchParams);
    (["dataset", "q", "from", "to"] as const).forEach((k) => {
      const v = view[k];
      if (v) next.set(k, v);
      else next.delete(k);
    });
    setSearchParams(next, { replace: true });
    toast.success(`Applied “${view.name}”`);
  };

  const deleteView = (id: string) => {
    persistViews(savedViews.filter((v) => v.id !== id));
    if (defaultViewId === id) persistDefault(null);
  };

  const setAsDefault = (id: string) => {
    persistDefault(id);
    const v = savedViews.find((x) => x.id === id);
    toast.success(v ? `“${v.name}” set as default` : "Default updated");
  };

  const clearDefault = () => {
    persistDefault(null);
    toast.success("Default view cleared");
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportViews = () => {
    const payload = {
      savedViews,
      defaultViewId: defaultViewId ?? null,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = formatTimestampForFilename(new Date());
    a.href = url;
    a.download = `import-history-saved-views-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Saved views exported");
  };

  const isValidView = (v: unknown): v is SavedView => {
    if (!v || typeof v !== "object") return false;
    const o = v as Record<string, unknown>;
    return (
      typeof o.id === "string" &&
      typeof o.name === "string" &&
      typeof o.dataset === "string" &&
      typeof o.q === "string" &&
      typeof o.from === "string" &&
      typeof o.to === "string"
    );
  };

  type ImportPreviewItem = {
    key: string;
    incoming: SavedView;
    action: "add" | "rekey" | "duplicate";
    nextId: string;
  };
  type ImportPreview = {
    fileName: string;
    totalFound: number;
    validCount: number;
    invalidCount: number;
    items: ImportPreviewItem[];
    incomingDefaultId: string | null;
  };
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importSelected, setImportSelected] = useState<Set<string>>(new Set());
  const [importNameOverrides, setImportNameOverrides] = useState<Record<string, string>>({});
  const [autoResolveOverrides, setAutoResolveOverrides] = useState<Set<string>>(new Set());
  const [initialImportSelected, setInitialImportSelected] = useState<Set<string>>(new Set());
  const [resetAllConfirmOpen, setResetAllConfirmOpen] = useState(false);
  const RESET_ALL_CONFIRM_THRESHOLD = 5;

  const effectiveImportName = (key: string, original: string) => {
    const override = importNameOverrides[key];
    if (override === undefined) return original;
    const trimmed = override.trim();
    return trimmed.length > 0 ? trimmed : original;
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rawList: unknown = parsed?.savedViews;
      if (!Array.isArray(rawList)) {
        toast.error("Invalid saved views file");
        return;
      }
      const totalFound = rawList.length;
      const validList = rawList.filter(isValidView) as SavedView[];
      const invalidCount = totalFound - validList.length;
      const incomingDefaultId: string | null =
        typeof parsed?.defaultViewId === "string" ? parsed.defaultViewId : null;

      const existingIds = new Set(savedViews.map((v) => v.id));
      const items: ImportPreviewItem[] = [];
      const preselect = new Set<string>();
      let counter = 0;
      validList.forEach((v, idx) => {
        const key = `${idx}-${v.id}`;
        let nextId = v.id;
        let action: ImportPreviewItem["action"] = "add";
        if (existingIds.has(nextId)) {
          const dup = savedViews.find(
            (x) =>
              x.id === v.id &&
              x.name === v.name &&
              x.dataset === v.dataset &&
              x.q === v.q &&
              x.from === v.from &&
              x.to === v.to,
          );
          if (dup) {
            items.push({ key, incoming: v, action: "duplicate", nextId: v.id });
            return;
          }
          nextId = crypto.randomUUID();
          action = "rekey";
        }
        items.push({ key, incoming: v, action, nextId });
        preselect.add(key);
      });

      setImportPreview({
        fileName: file.name,
        totalFound,
        validCount: validList.length,
        invalidCount,
        items,
        incomingDefaultId,
      });
      setImportSelected(preselect);
      setInitialImportSelected(new Set(preselect));
      setImportNameOverrides({});
      setAutoResolveOverrides(new Set());
    } catch {
      toast.error("Couldn’t read views file");
    }
  };

  const toggleImportSelected = (key: string) => {
    setImportSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const importPlan = (() => {
    if (!importPreview) return null;
    const selectedItems = importPreview.items.filter((it) => importSelected.has(it.key));
    const selectedCount = selectedItems.length;
    const willAdd = selectedItems.filter((it) => it.action === "add").length;
    const willRekey = selectedItems.filter((it) => it.action === "rekey").length;
    const willSkip = importPreview.items.length - selectedCount;

    const existingIds = new Set(savedViews.map((v) => v.id));
    const merged = [...savedViews];
    const idRemap = new Map<string, string>();
    let counter = 0;
    for (const it of selectedItems) {
      let nextId = it.incoming.id;
      if (existingIds.has(nextId) || !isUuid(nextId)) {
        nextId = crypto.randomUUID();
        idRemap.set(it.incoming.id, nextId);
      }
      existingIds.add(nextId);
      const name = effectiveImportName(it.key, it.incoming.name);
      merged.push({ ...it.incoming, id: nextId, name });
    }

    let defaultStatus: "apply" | "ignore" | "unresolved" | "none" = "none";
    let resolvedDefaultId: string | null = null;
    const incomingDefaultId = importPreview.incomingDefaultId;
    if (incomingDefaultId) {
      const candidate = idRemap.get(incomingDefaultId) ?? incomingDefaultId;
      const exists = merged.some((v) => v.id === candidate);
      if (!exists) {
        defaultStatus = "unresolved";
      } else if (defaultViewId) {
        defaultStatus = "ignore";
        resolvedDefaultId = candidate;
      } else {
        defaultStatus = "apply";
        resolvedDefaultId = candidate;
      }
    }

    // Name-collision detection (case-insensitive, trimmed) — against existing saved views
    // and among other selected incoming items.
    const norm = (s: string) => s.trim().toLowerCase();
    const existingNames = new Set(savedViews.map((v) => norm(v.name)));
    const selectedNameCounts = new Map<string, number>();
    for (const it of selectedItems) {
      const n = norm(effectiveImportName(it.key, it.incoming.name));
      selectedNameCounts.set(n, (selectedNameCounts.get(n) ?? 0) + 1);
    }
    const nameCollisionKeys = new Set<string>();
    for (const it of selectedItems) {
      const n = norm(effectiveImportName(it.key, it.incoming.name));
      if (n.length === 0) continue;
      if (existingNames.has(n) || (selectedNameCounts.get(n) ?? 0) > 1) {
        nameCollisionKeys.add(it.key);
      }
    }
    const nameCollisionCount = nameCollisionKeys.size;

    return {
      selectedCount,
      willAdd,
      willRekey,
      willSkip,
      merged,
      defaultStatus,
      resolvedDefaultId,
      nameCollisionKeys,
      nameCollisionCount,
    };
  })();

  const autoResolveNameCollisions = () => {
    if (!importPreview || !importPlan || importPlan.nameCollisionCount === 0) return;
    const norm = (s: string) => s.trim().toLowerCase();
    const stripSuffix = (s: string) => s.replace(/\s*\(\d+\)\s*$/u, "").trim();

    const taken = new Set<string>(savedViews.map((v) => norm(v.name)));
    const selectedItems = importPreview.items.filter((it) => importSelected.has(it.key));
    const currentEffective = new Map<string, string>();
    for (const it of selectedItems) {
      currentEffective.set(it.key, effectiveImportName(it.key, it.incoming.name));
    }
    const colliding = importPlan.nameCollisionKeys;
    for (const it of selectedItems) {
      if (colliding.has(it.key)) continue;
      taken.add(norm(currentEffective.get(it.key) ?? it.incoming.name));
    }

    const updates: Record<string, string> = {};
    for (const it of selectedItems) {
      if (!colliding.has(it.key)) continue;
      const base = stripSuffix(currentEffective.get(it.key) ?? it.incoming.name) || it.incoming.name;
      let n = 2;
      let candidate = `${base} (${n})`;
      while (taken.has(norm(candidate))) {
        n += 1;
        candidate = `${base} (${n})`;
      }
      taken.add(norm(candidate));
      updates[it.key] = candidate;
    }

    if (Object.keys(updates).length > 0) {
      setImportNameOverrides((prev) => ({ ...prev, ...updates }));
      setAutoResolveOverrides(new Set(Object.keys(updates)));
    }
  };

  const undoAutoResolveNameCollisions = () => {
    if (autoResolveOverrides.size === 0) return;
    setImportNameOverrides((prev) => {
      const next: Record<string, string> = { ...prev };
      for (const key of autoResolveOverrides) {
        delete next[key];
      }
      return next;
    });
    setAutoResolveOverrides(new Set());
    toast.success(`Reverted ${autoResolveOverrides.size} auto-resolve rename${autoResolveOverrides.size === 1 ? "" : "s"}. Manual edits were preserved.`);
  };

  const exportModifiedViews = () => {
    if (!importPreview) return;
    const selectedItems = importPreview.items.filter((it) => importSelected.has(it.key));
    if (selectedItems.length === 0) {
      toast.error("No views selected to export");
      return;
    }
    const selectedKeys = new Set(selectedItems.map((it) => it.key));
    const exportedViews: SavedView[] = selectedItems.map((it) => ({
      ...it.incoming,
      name: effectiveImportName(it.key, it.incoming.name),
    }));

    let exportedDefaultId: string | null = null;
    const incomingDefaultId = importPreview.incomingDefaultId;
    if (incomingDefaultId) {
      const defaultItem = importPreview.items.find(
        (it) => it.incoming.id === incomingDefaultId && selectedKeys.has(it.key),
      );
      if (defaultItem) exportedDefaultId = defaultItem.incoming.id;
    }

    const payload = {
      savedViews: exportedViews,
      defaultViewId: exportedDefaultId,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = formatTimestampForFilename(new Date());
    a.href = url;
    a.download = `import-history-saved-views-preview-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${exportedViews.length} modified view${exportedViews.length === 1 ? "" : "s"}`);
  };

  const confirmImport = (opts?: { viaShortcut?: boolean }) => {
    if (!importPreview || !importPlan) return;
    const { merged, willAdd, willRekey, defaultStatus, resolvedDefaultId } = importPlan;
    persistViews(merged);
    if (defaultStatus === "apply" && resolvedDefaultId) {
      persistDefault(resolvedDefaultId);
    }
    toast.success(
      willAdd === 0
        ? "No new views to import"
        : `Imported ${willAdd} view${willAdd === 1 ? "" : "s"}${willRekey ? ` (${willRekey} re-keyed)` : ""}`,
    );
    if (opts?.viaShortcut) {
      toast("Imported using keyboard shortcut");
    }
    setImportPreview(null);
    setImportSelected(new Set());
    setImportNameOverrides({});
    setAutoResolveOverrides(new Set());
    setInitialImportSelected(new Set());
  };


  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
      toast.success("Link copied");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      toast.error("Couldn’t copy link");
      setTimeout(() => setCopyState("idle"), 1800);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("import_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!cancelled) {
        if (error) {
          setLogs([]);
        } else {
          const rows = (data ?? []) as unknown as ImportLogRow[];
          setLogs(rows);

          const ids = Array.from(
            new Set(rows.map((r) => r.imported_by).filter((v): v is string => !!v))
          );
          if (ids.length > 0) {
            const { data: emails } = await (supabase.rpc as any)("get_user_emails", {
              _user_ids: ids,
            });
            if (!cancelled && Array.isArray(emails)) {
              const map: Record<string, string> = {};
              for (const row of emails as { user_id: string; email: string | null }[]) {
                if (row.email) map[row.user_id] = row.email;
              }
              setEmailMap(map);
            }
          }
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onLoadedCountChange?.(logs.length);
  }, [logs.length, onLoadedCountChange]);

  const importerLabel = (uid: string | null): string => {
    if (!uid) return "—";
    return emailMap[uid] ?? uid;
  };

  const fromMs = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime() : null;
  const toMs = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999).getTime() : null;
  const byDataset = datasetFilter === "all" ? logs : logs.filter((l) => l.dataset === datasetFilter);
  const byDate = byDataset.filter((l) => {
    const t = new Date(l.created_at).getTime();
    if (fromMs !== null && t < fromMs) return false;
    if (toMs !== null && t > toMs) return false;
    return true;
  });
  const q = search.trim().toLowerCase();
  const filtered = q
    ? byDate.filter((l) => {
        const meta = DATASET_BY_KEY[l.dataset as DatasetKey];
        const email = l.imported_by ? emailMap[l.imported_by] ?? "" : "";
        const haystack = [
          email,
          l.imported_by ?? "",
          l.filename ?? "",
          l.dataset,
          meta?.label ?? "",
        ]
          .join(" \u0001 ")
          .toLowerCase();
        return haystack.includes(q);
      })
    : byDate;
  const hasDateFilter = !!(fromDate || toDate);
  const hasAnyFilter = datasetFilter !== "all" || !!q || hasDateFilter;
  const clearAllFilters = () => {
    const next = new URLSearchParams(searchParams);
    ["dataset", "q", "from", "to"].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  };
  const datasetLabel =
    datasetFilter !== "all" ? DATASET_BY_KEY[datasetFilter as DatasetKey]?.label ?? datasetFilter : "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg">Import history</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Live imports only — dry runs are not logged. Newest first.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email, file, dataset…"
                className="pl-8 w-[260px]"
              />
            </div>
            <Select value={datasetFilter} onValueChange={(v) => setDatasetFilter(v as typeof datasetFilter)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by dataset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All datasets</SelectItem>
                {DATASETS.map((d) => (
                  <SelectItem key={d.key} value={d.key}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value="" onValueChange={applyPreset}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="clear">Clear</SelectItem>
              </SelectContent>
            </Select>
            {(() => {
              const cfg: Record<SyncStatus, { label: string; tip: string; icon: JSX.Element; className: string }> = {
                "local-only": {
                  label: "Local only",
                  tip: "Saved views are stored only in this browser. Sign in to sync across devices.",
                  icon: <HardDrive className="h-3 w-3" />,
                  className: "border-muted-foreground/30 text-muted-foreground",
                },
                synced: {
                  label: "Synced",
                  tip: lastSyncedAt
                    ? `Saved views synced to your account · ${format(lastSyncedAt, "HH:mm:ss")}`
                    : "Saved views synced to your account",
                  icon: <Cloud className="h-3 w-3" />,
                  className: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
                },
                syncing: {
                  label: "Syncing…",
                  tip: "Saving changes to your account",
                  icon: <Loader2 className="h-3 w-3 animate-spin" />,
                  className: "border-muted-foreground/30 text-muted-foreground",
                },
                error: {
                  label: retryScheduled
                    ? `Retrying soon… (${retryAttempt}/${RETRY_DELAYS_MS.length})`
                    : retryAttempt >= RETRY_DELAYS_MS.length
                      ? "Offline"
                      : "Offline",
                  tip: retryScheduled
                    ? `Auto-retry attempt ${retryAttempt} of ${RETRY_DELAYS_MS.length} scheduled. Click to retry now.`
                    : retryAttempt >= RETRY_DELAYS_MS.length
                      ? "Backend unavailable — auto-retries exhausted. Click to retry."
                      : "Backend unavailable — using local cache. Click to retry.",
                  icon: <CloudOff className="h-3 w-3" />,
                  className: "border-destructive/40 text-destructive",
                },
                "migration-available": {
                  label: "Migrate",
                  tip: "Local saved views detected. Migrate them to your account to sync across devices.",
                  icon: <ArrowUpFromLine className="h-3 w-3" />,
                  className: "border-amber-500/40 text-amber-600 dark:text-amber-400",
                },
              };
              const c = cfg[syncStatus];
              const isError = syncStatus === "error";
              const badge = (
                <Badge
                  variant="outline"
                  className={cn("gap-1 px-1.5 py-0.5 text-[10px] font-medium", c.className)}
                  aria-live="polite"
                  aria-label={`Saved views: ${c.label}`}
                >
                  {c.icon}
                  <span>{c.label}</span>
                  {isError && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        retrySync();
                      }}
                      className="ml-1 rounded hover:bg-destructive/10 px-1 py-0.5 text-[10px] font-medium"
                      aria-label="Retry sync now"
                    >
                      Retry
                    </button>
                  )}
                </Badge>
              );
              return (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {syncStatus === "migration-available" ? (
                        <button
                          type="button"
                          onClick={() => setMigratePromptOpen(true)}
                          className="cursor-pointer"
                        >
                          {badge}
                        </button>
                      ) : isError ? (
                        <button
                          type="button"
                          onClick={() => retrySync()}
                          className="cursor-pointer"
                        >
                          {badge}
                        </button>
                      ) : (
                        <span>{badge}</span>
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{c.tip}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  Saved views
                  {savedViews.length > 0 && (
                    <Badge variant="secondary" className="ml-1 tabular-nums">{savedViews.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Apply a saved view</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {savedViews.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    No saved views yet. Use “Save view” to add one.
                  </div>
                ) : (
                  <>
                    {savedViews.map((v) => {
                      const isDefault = v.id === defaultViewId;
                      return (
                        <DropdownMenuItem
                          key={v.id}
                          onSelect={(e) => {
                            e.preventDefault();
                            applyView(v);
                          }}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            {isDefault && (
                              <Star className="h-3.5 w-3.5 fill-current text-[hsl(var(--primary))]" />
                            )}
                            <span className="truncate">{v.name}</span>
                            {isDefault && (
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                default
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isDefault) clearDefault();
                                else setAsDefault(v.id);
                              }}
                              className="rounded-sm hover:bg-muted p-1 text-muted-foreground hover:text-foreground"
                              aria-label={isDefault ? `Clear default` : `Set ${v.name} as default`}
                              title={isDefault ? "Clear default" : "Set as default"}
                            >
                              {isDefault ? (
                                <StarOff className="h-3.5 w-3.5" />
                              ) : (
                                <Star className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteView(v.id);
                              }}
                              className="rounded-sm hover:bg-muted p-1 text-muted-foreground hover:text-destructive"
                              aria-label={`Delete saved view ${v.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </DropdownMenuItem>
                      );
                    })}
                    {defaultViewId && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            clearDefault();
                          }}
                          className="text-xs text-muted-foreground"
                        >
                          <StarOff className="h-3.5 w-3.5 mr-2" />
                          Clear default view
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    exportViews();
                  }}
                  disabled={savedViews.length === 0}
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export views
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  Import views
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportFile(f);
                e.target.value = "";
              }}
            />
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <BookmarkPlus className="h-4 w-4" />
                  Save view
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Save current filters as a view</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    autoFocus
                    placeholder="View name (e.g. Questions errors this week)"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveCurrentView();
                    }}
                  />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Dataset: <code>{datasetFilter}</code></div>
                    <div>Search: <code>{search || "—"}</code></div>
                    <div>From: <code>{fromDate ? fmtISODate(fromDate) : "—"}</code></div>
                    <div>To: <code>{toDate ? fmtISODate(toDate) : "—"}</code></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={saveCurrentView} disabled={!newViewName.trim()}>
                    Save view
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("gap-2 justify-start font-normal w-[150px]", !fromDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {fromDate ? format(fromDate, "PP") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  disabled={(d) => (toDate ? d > toDate : false)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("gap-2 justify-start font-normal w-[150px]", !toDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {toDate ? format(toDate, "PP") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  disabled={(d) => (fromDate ? d < fromDate : false)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {hasDateFilter && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFromDate(undefined);
                  setToDate(undefined);
                }}
                className="gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Clear dates
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2"
              aria-label="Copy link to filtered view"
            >
              {copyState === "copied" ? (
                <>
                  <Check className="h-4 w-4 text-[hsl(var(--success))]" />
                  Copied
                </>
              ) : copyState === "error" ? (
                <>
                  <X className="h-4 w-4 text-destructive" />
                  Failed
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Copy link
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasAnyFilter && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {datasetFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <span>Dataset: {datasetLabel}</span>
                <button
                  type="button"
                  onClick={() => setDatasetFilter("all")}
                  className="ml-1 rounded-sm hover:bg-muted-foreground/20 p-0.5"
                  aria-label="Clear dataset filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {q && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <span>Search: {search}</span>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="ml-1 rounded-sm hover:bg-muted-foreground/20 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {fromDate && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <span>From: {fmtISODate(fromDate)}</span>
                <button
                  type="button"
                  onClick={() => setFromDate(undefined)}
                  className="ml-1 rounded-sm hover:bg-muted-foreground/20 p-0.5"
                  aria-label="Clear from date"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {toDate && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <span>To: {fmtISODate(toDate)}</span>
                <button
                  type="button"
                  onClick={() => setToDate(undefined)}
                  className="ml-1 rounded-sm hover:bg-muted-foreground/20 p-0.5"
                  aria-label="Clear to date"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 px-2 text-xs">
              Clear all
            </Button>
          </div>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading import history…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {q || hasDateFilter
              ? `No imports match the current filters${datasetFilter !== "all" ? " in this dataset" : ""}.`
              : `No imports recorded${datasetFilter !== "all" ? " for this dataset" : ""} yet.`}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imported at</TableHead>
                <TableHead>Dataset</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Inserted</TableHead>
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="text-right">Skipped</TableHead>
                <TableHead className="text-right">Errors</TableHead>
                <TableHead>By</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => {
                const meta = DATASET_BY_KEY[l.dataset as DatasetKey];
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {meta?.label ?? l.dataset}
                      <div className="text-xs text-muted-foreground font-normal">
                        <code>{l.dataset}</code>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                      {l.filename ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{l.inserted_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.updated_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.skipped_count}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.error_count > 0 ? (
                        <Badge variant="destructive">{l.error_count}</Badge>
                      ) : (
                        <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))]">
                          0
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                      <span className={l.imported_by && !emailMap[l.imported_by] ? "font-mono" : ""}>
                        {importerLabel(l.imported_by)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setSelected(l)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[480px] sm:max-w-[560px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {DATASET_BY_KEY[selected.dataset as DatasetKey]?.label ?? selected.dataset}
                </SheetTitle>
                <SheetDescription>
                  {new Date(selected.created_at).toLocaleString()} · {selected.filename ?? "—"}
                  <div className="mt-1 text-xs">
                    Imported by:{" "}
                    <span className={selected.imported_by && !emailMap[selected.imported_by] ? "font-mono" : ""}>
                      {importerLabel(selected.imported_by)}
                    </span>
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-4 gap-2 mt-4">
                <Stat label="Inserted" value={selected.inserted_count} />
                <Stat label="Updated" value={selected.updated_count} />
                <Stat label="Skipped" value={selected.skipped_count} />
                <Stat label="Errors" value={selected.error_count} danger={selected.error_count > 0} />
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Issues</h3>
                {!selected.errors || selected.errors.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                    No issues logged for this import.
                  </div>
                ) : (
                  <div className="border rounded-md divide-y">
                    {selected.errors.slice(0, 20).map((e, i) => (
                      <div key={i} className="p-3 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          <span className="font-medium">Row {e.row}</span>
                          {e.id ? (
                            <span className="text-muted-foreground">
                              · id <code className="text-foreground">{e.id}</code>
                            </span>
                          ) : null}
                          {e.field ? (
                            <span className="text-muted-foreground">
                              · field <code className="text-foreground">{e.field}</code>
                            </span>
                          ) : null}
                        </div>
                        <div>{e.message}</div>
                        {e.rawValue ? (
                          <div className="text-muted-foreground">
                            got <code className="text-foreground break-all">{truncate(e.rawValue)}</code>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {selected.errors.length > 20 && (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        Showing first 20 of {selected.errors.length} stored issues.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <SheetFooter className="mt-6 flex flex-row justify-end gap-2">
                {selected.errors && selected.errors.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportIssuesToCsv(selected)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export issues to CSV
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={!!importPreview} onOpenChange={(open) => { if (!open) setImportPreview(null); }}>
        <DialogContent
          className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey || e.altKey) return;
            const isForce = e.metaKey || e.ctrlKey;
            if (!isForce) {
              const target = e.target as HTMLElement | null;
              const tag = target?.tagName;
              if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
            }
            if (!importPlan || importPlan.selectedCount === 0) return;
            e.preventDefault();
            confirmImport({ viaShortcut: isForce });
          }}
        >
          <DialogHeader>
            <DialogTitle>Import saved views</DialogTitle>
          </DialogHeader>
          {importPreview && importPlan && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground truncate">
                File: <code>{importPreview.fileName}</code>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Total" value={importPreview.totalFound} />
                <Stat label="Valid" value={importPreview.validCount} />
                <Stat label="Invalid" value={importPreview.invalidCount} danger={importPreview.invalidCount > 0} />
                <Stat label="Selected" value={importPlan.selectedCount} />
                <Stat label="Will add" value={importPlan.willAdd} />
                <Stat label="Will re-key" value={importPlan.willRekey} />
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                <span>
                  Will skip: <span className="font-medium text-foreground tabular-nums">{importPlan.willSkip}</span>
                </span>
                <span>
                  Name collisions:{" "}
                  <span className={cn("font-medium tabular-nums", importPlan.nameCollisionCount > 0 ? "text-destructive" : "text-foreground")}>
                    {importPlan.nameCollisionCount}
                  </span>
                </span>
                {(() => {
                  const changedCount = importPreview.items.reduce((acc, it) => {
                    const currentName = importNameOverrides[it.key] ?? it.incoming.name;
                    const nameChanged = currentName.trim() !== it.incoming.name && currentName.trim().length > 0;
                    const selChanged = importSelected.has(it.key) !== initialImportSelected.has(it.key);
                    return acc + (nameChanged || selChanged ? 1 : 0);
                  }, 0);
                  return (
                    <span>
                      Changed: <span className={cn("font-medium tabular-nums", changedCount > 0 ? "text-foreground" : "text-foreground")}>{changedCount}</span>
                    </span>
                  );
                })()}
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Default view: </span>
                {importPlan.defaultStatus === "none" && <span>None in file</span>}
                {importPlan.defaultStatus === "apply" && (
                  <Badge variant="secondary">Will be applied</Badge>
                )}
                {importPlan.defaultStatus === "ignore" && (
                  <Badge variant="secondary">Ignored (default already set)</Badge>
                )}
                {importPlan.defaultStatus === "unresolved" && (
                  <Badge variant="secondary">Not applied (target not selected or missing)</Badge>
                )}
              </div>
              {importPreview.items.length > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{importPreview.items.length} view{importPreview.items.length === 1 ? "" : "s"}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => setImportSelected(new Set(importPreview.items.map((it) => it.key)))}
                      >
                        Select all
                      </button>
                      <span className="text-muted-foreground">·</span>
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => setImportSelected(new Set())}
                      >
                        Clear
                      </button>
                      <span className="text-muted-foreground">·</span>
                      <button
                        type="button"
                        className="text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                        onClick={autoResolveNameCollisions}
                        disabled={importPlan.nameCollisionCount === 0}
                      >
                        Auto-resolve names
                      </button>
                      <span className="text-muted-foreground">·</span>
                      <button
                        type="button"
                        className="text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                        onClick={exportModifiedViews}
                        disabled={importPlan.selectedCount === 0}
                      >
                        Export modified
                      </button>
                      {autoResolveOverrides.size > 0 && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={undoAutoResolveNameCollisions}
                          >
                            Undo auto-resolve
                          </button>
                        </>
                      )}
                      {(() => {
                        const changedCount = importPreview.items.reduce((acc, it) => {
                          const currentName = importNameOverrides[it.key] ?? it.incoming.name;
                          const nameChanged = currentName.trim() !== it.incoming.name && currentName.trim().length > 0;
                          const selChanged = importSelected.has(it.key) !== initialImportSelected.has(it.key);
                          return acc + (nameChanged || selChanged ? 1 : 0);
                        }, 0);
                        if (changedCount === 0) return null;
                        const performReset = () => {
                          setImportNameOverrides({});
                          setAutoResolveOverrides(new Set());
                          setImportSelected(new Set(initialImportSelected));
                        };
                        return (
                          <>
                            <span className="text-muted-foreground">·</span>
                            <button
                              type="button"
                              className="text-primary hover:underline"
                              onClick={() => {
                                if (changedCount >= RESET_ALL_CONFIRM_THRESHOLD) {
                                  setResetAllConfirmOpen(true);
                                } else {
                                  performReset();
                                }
                              }}
                            >
                              Reset all changes
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                    {importPreview.items.map((it) => {
                      const checked = importSelected.has(it.key);
                      const currentName = importNameOverrides[it.key] ?? it.incoming.name;
                      const renamed = currentName.trim() !== it.incoming.name && currentName.trim().length > 0;
                      const hasNameCollision = checked && importPlan.nameCollisionKeys.has(it.key);
                      const wasInitiallySelected = initialImportSelected.has(it.key);
                      const selectionChanged = checked !== wasInitiallySelected;
                      return (
                        <div
                          key={it.key}
                          className={cn(
                            "p-2 text-xs flex items-start gap-2 hover:bg-muted/40",
                            hasNameCollision && "bg-destructive/5",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleImportSelected(it.key)}
                            className="mt-2"
                            aria-label={`Include ${it.incoming.name}`}
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Input
                                value={currentName}
                                onChange={(e) =>
                                  setImportNameOverrides((prev) => ({ ...prev, [it.key]: e.target.value }))
                                }
                                disabled={!checked}
                                className={cn(
                                  "h-7 text-xs",
                                  hasNameCollision && "border-destructive focus-visible:ring-destructive",
                                )}
                                aria-label={`Rename ${it.incoming.name}`}
                                aria-invalid={hasNameCollision || undefined}
                              />
                              {renamed && (
                                <Badge variant="outline" className="shrink-0 text-[10px]">Renamed</Badge>
                              )}
                              {hasNameCollision && (
                                <Badge variant="destructive" className="shrink-0 text-[10px] gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Name collision
                                </Badge>
                              )}
                            </div>
                            <div className="text-muted-foreground truncate">
                              dataset: <code>{it.incoming.dataset || "all"}</code>
                              {" · "}q: <code>{it.incoming.q || "—"}</code>
                              {" · "}from: <code>{it.incoming.from || "—"}</code>
                              {" · "}to: <code>{it.incoming.to || "—"}</code>
                            </div>
                            {(renamed || selectionChanged) && (
                              <div className="text-[11px] space-y-0.5 border-l-2 border-primary/40 pl-2 mt-1">
                                {renamed && (
                                  <div>
                                    <span className="text-muted-foreground">Original: </span>
                                    <code className="line-through opacity-70">{it.incoming.name}</code>
                                    <span className="text-muted-foreground"> → Current: </span>
                                    <code className="text-foreground">{currentName.trim()}</code>
                                  </div>
                                )}
                                {selectionChanged && (
                                  <div className="text-muted-foreground">
                                    Selection: {wasInitiallySelected ? "selected → not selected" : "not selected → selected"}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className="text-primary hover:underline"
                                  onClick={() => {
                                    setImportNameOverrides((prev) => {
                                      if (!(it.key in prev)) return prev;
                                      const next = { ...prev };
                                      delete next[it.key];
                                      return next;
                                    });
                                    setAutoResolveOverrides((prev) => {
                                      if (!prev.has(it.key)) return prev;
                                      const next = new Set(prev);
                                      next.delete(it.key);
                                      return next;
                                    });
                                    setImportSelected((prev) => {
                                      const next = new Set(prev);
                                      if (wasInitiallySelected) next.add(it.key);
                                      else next.delete(it.key);
                                      return next;
                                    });
                                  }}
                                >
                                  Reset
                                </button>
                              </div>
                            )}
                          </div>
                          <Badge
                            variant={it.action === "duplicate" ? "outline" : "secondary"}
                            className="shrink-0 mt-1"
                          >
                            {it.action === "add" ? "Add" : it.action === "rekey" ? "Re-key" : "Duplicate"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter className="sm:items-center">
            <span className="text-[11px] text-muted-foreground sm:mr-auto">
              <kbd className="px-1 rounded border bg-muted text-foreground">Enter</kbd> confirms ·{" "}
              <kbd className="px-1 rounded border bg-muted text-foreground">⌘/Ctrl</kbd>+<kbd className="px-1 rounded border bg-muted text-foreground">Enter</kbd> from a field ·{" "}
              <kbd className="px-1 rounded border bg-muted text-foreground">Esc</kbd> cancels
            </span>
            <Button type="button" variant="ghost" onClick={() => { setImportPreview(null); setImportSelected(new Set()); setImportNameOverrides({}); setAutoResolveOverrides(new Set()); setInitialImportSelected(new Set()); }}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => confirmImport()}
              disabled={!importPlan || importPlan.selectedCount === 0}
            >
              Confirm import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={resetAllConfirmOpen} onOpenChange={setResetAllConfirmOpen}>
        <DialogContent
          className="sm:max-w-md"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
              e.preventDefault();
              setImportNameOverrides({});
              setAutoResolveOverrides(new Set());
              setImportSelected(new Set(initialImportSelected));
              setResetAllConfirmOpen(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Reset all changes?</DialogTitle>
          </DialogHeader>
          {(() => {
            if (!importPreview) return null;
            const changedCount = importPreview.items.reduce((acc, it) => {
              const currentName = importNameOverrides[it.key] ?? it.incoming.name;
              const nameChanged = currentName.trim() !== it.incoming.name && currentName.trim().length > 0;
              const selChanged = importSelected.has(it.key) !== initialImportSelected.has(it.key);
              return acc + (nameChanged || selChanged ? 1 : 0);
            }, 0);
            return (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  This will reset <span className="font-medium text-foreground tabular-nums">{changedCount}</span> changed row{changedCount === 1 ? "" : "s"} to their original preview state.
                </p>
                <p>All name edits and selection changes will be reverted. The preview will remain open.</p>
                <p className="text-xs">Press <kbd className="px-1 rounded border bg-muted text-foreground">Enter</kbd> to confirm, <kbd className="px-1 rounded border bg-muted text-foreground">Esc</kbd> to cancel.</p>
              </div>
            );
          })()}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              autoFocus
              onClick={() => setResetAllConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setImportNameOverrides({});
                setAutoResolveOverrides(new Set());
                setImportSelected(new Set(initialImportSelected));
                setResetAllConfirmOpen(false);
              }}
            >
              Confirm reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={migratePromptOpen} onOpenChange={(o) => { if (!o) skipMigration(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sync saved views to your account?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Found <span className="font-medium text-foreground tabular-nums">{pendingMigrationViews.length}</span> saved view{pendingMigrationViews.length === 1 ? "" : "s"} stored on this device.
            </p>
            <p>
              Migrate them to your account so they follow you across devices? Your local copy will remain as a cache.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={skipMigration}>
              Not now
            </Button>
            <Button type="button" onClick={confirmMigrateLocalToBackend}>
              Migrate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Stat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="border rounded-md p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={`text-lg font-semibold tabular-nums ${danger ? "text-destructive" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
