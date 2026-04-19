import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImportPanel from "@/components/admin/ImportPanel";
import ImportHistory from "@/components/admin/ImportHistory";
import DataDashboard from "@/components/admin/DataDashboard";
import ContentInspector from "@/components/admin/ContentInspector";
import ContentAudit from "@/components/admin/ContentAudit";
import VocabularyAudit from "@/components/admin/VocabularyAudit";
import { DATASETS, type DatasetKey } from "@/lib/datasets";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface LastImport {
  dataset: string;
  created_at: string;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  filename: string | null;
}

export default function DataManager() {
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [countErrors, setCountErrors] = useState<Record<string, string | null>>({});
  const [lastImports, setLastImports] = useState<Record<string, LastImport | null>>({});
  const [filter, setFilter] = useState("");
  const [historyCount, setHistoryCount] = useState<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [inspectorSeed, setInspectorSeed] = useState<{ table?: string; search?: string; nonce: number }>({ nonce: 0 });

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    const nextCounts: Record<string, number | null> = {};
    const nextErrors: Record<string, string | null> = {};
    const nextImports: Record<string, LastImport | null> = {};
    await Promise.all(
      DATASETS.map(async (d) => {
        const { count, error } = await supabase
          .from(d.key as never)
          .select("*", { count: "exact", head: true });
        if (error) {
          nextCounts[d.key] = null;
          nextErrors[d.key] = error.message || "Count query failed";
        } else {
          nextCounts[d.key] = count ?? 0;
          nextErrors[d.key] = null;
        }
        const { data: log } = await supabase
          .from("import_logs")
          .select("*")
          .eq("dataset", d.key)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        nextImports[d.key] = (log as LastImport | null) ?? null;
      }),
    );
    setCounts(nextCounts);
    setCountErrors(nextErrors);
    setLastImports(nextImports);
    setLastRefreshed(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = DATASETS.filter(
    (d) =>
      !filter.trim() ||
      d.label.toLowerCase().includes(filter.toLowerCase()) ||
      d.key.toLowerCase().includes(filter.toLowerCase()),
  );

  const totalRows = Object.values(counts).reduce<number>((a, b) => a + (b ?? 0), 0);
  const totalErrors = Object.values(lastImports).reduce<number>(
    (a, l) => a + (l?.error_count ?? 0),
    0,
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Data Manager</h1>
        <p className="text-muted-foreground mt-1">
          Admin-only CSV imports. Upserts by <code>id</code>; rows with the same id are updated, never silently overwritten.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total rows</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold tabular-nums">{totalRows}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Datasets</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold tabular-nums">{DATASETS.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Last-import errors</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums flex items-center gap-2">
              {totalErrors}
              {totalErrors === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inspector">Inspector</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          <TabsTrigger value="imports">Imports</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            History
            {historyCount !== null && (
              <Badge variant="secondary" className="tabular-nums">{historyCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DataDashboard
            counts={counts}
            countErrors={countErrors}
            lastRefreshed={lastRefreshed}
            refreshing={refreshing}
            onRefresh={loadAll}
          />
        </TabsContent>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="text-lg">Tables</CardTitle>
                <Input
                  placeholder="Filter datasets…"
                  className="max-w-xs"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Dataset</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>id type</TableHead>
                    <TableHead className="text-right">Rows</TableHead>
                    <TableHead>Last import</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => {
                    const li = lastImports[d.key];
                    const priority = DATASETS.findIndex((x) => x.key === d.key) + 1;
                    return (
                      <TableRow key={d.key}>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">{priority}</TableCell>
                        <TableCell className="font-medium">
                          {d.label}
                          <div className="text-xs text-muted-foreground font-normal">
                            <code>{d.key}</code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {d.tier === "content" ? "Content" : "User-state"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{d.idType}</code>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{counts[d.key] ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {li ? new Date(li.created_at).toLocaleString() : "Never"}
                        </TableCell>
                        <TableCell>
                          {!li ? (
                            (counts[d.key] ?? 0) > 0 ? (
                              <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))]">
                                Seeded · {counts[d.key]} rows
                              </Badge>
                            ) : (
                              <Badge variant="outline">Awaiting import</Badge>
                            )
                          ) : li.error_count > 0 ? (
                            <Badge variant="destructive">{li.error_count} errors</Badge>
                          ) : (
                            <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))]">
                              Up to date
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspector" className="mt-6">
          <ContentInspector
            initialTable={inspectorSeed.table as never}
            initialSearch={inspectorSeed.search}
            seedNonce={inspectorSeed.nonce}
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <ContentAudit />
        </TabsContent>

        <TabsContent value="vocabulary" className="mt-6">
          <VocabularyAudit
            onJumpToInspector={(table, search) => {
              setInspectorSeed((prev) => ({ table, search, nonce: prev.nonce + 1 }));
              setActiveTab("inspector");
            }}
          />
        </TabsContent>

        <TabsContent value="imports" className="mt-6">
          <div className="mb-4 max-w-sm">
            <Input
              placeholder="Filter datasets…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((d) => (
              <ImportPanel
                key={d.key}
                meta={d}
                rowCount={counts[d.key] ?? null}
                lastImport={lastImports[d.key]}
                onImported={loadAll}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="validation" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Validation summary</CardTitle></CardHeader>
            <CardContent>
              {Object.values(lastImports).every((l) => !l) ? (
                <p className="text-sm text-muted-foreground">
                  No imports have been run yet. Validation results will appear here after the first import per dataset.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dataset</TableHead>
                      <TableHead className="text-right">Inserted</TableHead>
                      <TableHead className="text-right">Updated</TableHead>
                      <TableHead className="text-right">Skipped</TableHead>
                      <TableHead className="text-right">Errors</TableHead>
                      <TableHead>File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DATASETS.map((d) => {
                      const li = lastImports[d.key];
                      if (!li) return null;
                      return (
                        <TableRow key={d.key}>
                          <TableCell className="font-medium">{d.label}</TableCell>
                          <TableCell className="text-right tabular-nums">{li.inserted_count}</TableCell>
                          <TableCell className="text-right tabular-nums">{li.updated_count}</TableCell>
                          <TableCell className="text-right tabular-nums">{li.skipped_count}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {li.error_count > 0 ? (
                              <span className="text-destructive">{li.error_count}</span>
                            ) : (
                              li.error_count
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-xs">
                            {li.filename ?? "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ImportHistory onLoadedCountChange={setHistoryCount} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
