import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderPlus,
  Folder as FolderIcon,
  Inbox,
  Layers,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  VideoOff,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TaskState, type TaskStateValue } from "@mpt/shared";
import type { MptClient } from "@mpt/api-client";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;
const UNSORTED = "__unsorted__";
const FOLDER_FETCH_CAP = 1000;

type StatusFilter = "all" | "complete" | "processing" | "failed";
type Sort = "newest" | "oldest";
type View = "grid" | "list";
/** "all" | "__unsorted__" | <folder name> */
type FolderView = string;

function StatusBadge({ state }: { state?: TaskStateValue }) {
  const { t } = useTranslation();
  if (state === TaskState.COMPLETE) return <Badge variant="success">{t("Complete")}</Badge>;
  if (state === TaskState.FAILED) return <Badge variant="destructive">{t("Failed")}</Badge>;
  return <Badge variant="secondary">{t("Processing")}</Badge>;
}

/** Move every task currently filed under `from` to `to` (rename) or null (delete). */
async function remapFolder(api: MptClient, from: string, to: string | null) {
  const res = await api.listTasks(1, FOLDER_FETCH_CAP, { folder: from });
  await Promise.all(
    res.tasks.map((tk) => (tk.task_id ? api.setTaskFolder(tk.task_id, to) : null)),
  );
}

export function LibraryPage() {
  const { t } = useTranslation();
  const api = useApi();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [folderView, setFolderView] = useState<FolderView>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [view, setView] = useState<View>("grid");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);

  // Debounce the search box so we don't hit the backend on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Any filter change resets to page 1 and clears the (page-scoped) selection.
  useEffect(() => {
    setPage(1);
    setPicked(new Set());
  }, [search, status, sort, folderView]);

  const folderParam = folderView === "all" ? undefined : folderView;

  const list = useQuery({
    queryKey: ["tasks", page, search, status, sort, folderView],
    queryFn: () =>
      api.listTasks(page, PAGE_SIZE, {
        q: search,
        status: status === "all" ? undefined : status,
        sort,
        folder: folderParam,
      }),
    refetchInterval: (q) =>
      q.state.data?.tasks.some((x) => x.state === TaskState.PROCESSING) ? 2500 : false,
  });

  const foldersQ = useQuery({ queryKey: ["folders"], queryFn: () => api.listFolders() });
  const allCountQ = useQuery({
    queryKey: ["tasks-count"],
    queryFn: () => api.listTasks(1, 1).then((d) => d.total),
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["folders"] });
    qc.invalidateQueries({ queryKey: ["tasks-count"] });
  };

  const del = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api.deleteTask(id))),
    onSuccess: (_r, ids) => {
      toast.success(t("Deleted {{n}} videos", { n: ids.length }));
      setPicked(new Set());
      refreshAll();
    },
    onError: () => toast.error(t("Delete failed")),
  });

  const move = useMutation({
    mutationFn: ({ ids, folder }: { ids: string[]; folder: string | null }) =>
      Promise.all(ids.map((id) => api.setTaskFolder(id, folder))),
    onSuccess: (_r, { folder }) => {
      toast.success(folder ? t("Moved to {{name}}", { name: folder }) : t("Removed from folder"));
      setPicked(new Set());
      refreshAll();
    },
    onError: () => toast.error(t("Move failed")),
  });

  const renameFolder = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) => remapFolder(api, from, to),
    onSuccess: (_r, { from, to }) => {
      if (folderView === from) setFolderView(to);
      refreshAll();
    },
    onError: () => toast.error(t("Rename failed")),
  });

  const deleteFolder = useMutation({
    mutationFn: (name: string) => remapFolder(api, name, null),
    onSuccess: (_r, name) => {
      if (folderView === name) setFolderView("all");
      refreshAll();
    },
    onError: () => toast.error(t("Delete failed")),
  });

  const folders = foldersQ.data?.folders ?? [];
  const folderCountSum = folders.reduce((a, f) => a + f.count, 0);
  const allCount = allCountQ.data ?? 0;
  const unsortedCount = Math.max(0, allCount - folderCountSum);

  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tasks = useMemo(() => list.data?.tasks ?? [], [list.data]);

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const pickedIds = useMemo(() => [...picked], [picked]);
  const allPagePicked = tasks.length > 0 && tasks.every((tk) => picked.has(tk.task_id ?? ""));
  const togglePage = () =>
    setPicked(allPagePicked ? new Set() : new Set(tasks.map((tk) => tk.task_id ?? "")));

  const onDeletePicked = () => {
    if (!pickedIds.length) return;
    if (!window.confirm(t("Delete {{n}} videos? This can't be undone.", { n: pickedIds.length })))
      return;
    del.mutate(pickedIds);
  };

  const busy = move.isPending || renameFolder.isPending || deleteFolder.isPending;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={t("Library")}
        subtitle={`${allCount} ${t("videos")}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={refreshAll} disabled={list.isFetching}>
              <RefreshCw className={list.isFetching ? "animate-spin" : ""} />
              {t("Refresh")}
            </Button>
            <Button size="sm" onClick={() => navigate("/create")}>
              <Plus /> {t("New video")}
            </Button>
          </>
        }
      />

      <div className="flex flex-1">
        {/* Folder rail */}
        <aside className="bg-sidebar/40 sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col overflow-y-auto border-r border-border p-3 sm:flex">
          <RailItem icon={<Layers className="size-4" />} label={t("All videos")} count={allCount} active={folderView === "all"} onClick={() => setFolderView("all")} />
          <RailItem icon={<Inbox className="size-4" />} label={t("Unsorted")} count={unsortedCount} active={folderView === UNSORTED} onClick={() => setFolderView(UNSORTED)} />

          <div className="text-muted-foreground/70 mt-4 flex items-center justify-between px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
            {t("Folders")}
            <button onClick={() => { setNewFolderOpen(true); setNewFolderName(""); }} className="hover:text-foreground" aria-label={t("New folder")}>
              <FolderPlus className="size-3.5" />
            </button>
          </div>

          {newFolderOpen && (
            <form
              className="mb-1 px-1"
              onSubmit={(e) => {
                e.preventDefault();
                const name = newFolderName.trim();
                if (name) {
                  setFolderView(name); // folder exists once a video is filed here
                  toast.message(t("Folder ready — move videos into it"), { description: name });
                }
                setNewFolderOpen(false);
              }}
            >
              <Input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onBlur={() => setNewFolderOpen(false)} placeholder={t("Folder name")} className="h-8 text-sm" />
            </form>
          )}

          {folders.map((f) => (
            <div key={f.name}>
              {renaming === f.name ? (
                <form
                  className="px-1 py-0.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setRenaming(null);
                  }}
                >
                  <Input
                    autoFocus
                    defaultValue={f.name}
                    onBlur={(e) => {
                      const to = e.target.value.trim();
                      if (to && to !== f.name) renameFolder.mutate({ from: f.name, to });
                      setRenaming(null);
                    }}
                    className="h-8 text-sm"
                  />
                </form>
              ) : (
                <RailItem
                  icon={<FolderIcon className="size-4" />}
                  label={f.name}
                  count={f.count}
                  active={folderView === f.name}
                  onClick={() => setFolderView(f.name)}
                  actions={
                    <>
                      <button className="hover:text-foreground p-0.5" onClick={(e) => { e.stopPropagation(); setRenaming(f.name); }} aria-label={t("Rename")}>
                        <Pencil className="size-3" />
                      </button>
                      <button
                        className="hover:text-destructive p-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(t("Delete folder “{{name}}”? Videos stay in the library.", { name: f.name })))
                            deleteFolder.mutate(f.name);
                        }}
                        aria-label={t("Delete")}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </>
                  }
                />
              )}
            </div>
          ))}
          {folders.length === 0 && !newFolderOpen && (
            <p className="text-muted-foreground/60 px-2 py-1 text-xs">{t("No folders yet")}</p>
          )}
        </aside>

        {/* Content */}
        <section className="min-w-0 flex-1 px-6 py-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t("Search videos…")} className="h-9 w-56 pl-8" />
            </div>
            <Segmented value={status} onChange={(v) => setStatus(v as StatusFilter)} options={[
              { value: "all", label: t("All") },
              { value: "complete", label: t("Done") },
              { value: "processing", label: t("Processing") },
              { value: "failed", label: t("Failed") },
            ]} />
            <Segmented value={sort} onChange={(v) => setSort(v as Sort)} options={[
              { value: "newest", label: t("Newest") },
              { value: "oldest", label: t("Oldest") },
            ]} />
            <div className="bg-muted ml-auto flex items-center rounded-md p-0.5">
              <IconToggle active={view === "grid"} onClick={() => setView("grid")} label={t("Grid")}><LayoutGrid className="size-4" /></IconToggle>
              <IconToggle active={view === "list"} onClick={() => setView("list")} label={t("List")}><ListIcon className="size-4" /></IconToggle>
            </div>
          </div>

          {picked.size > 0 && (
            <div className="bg-card sticky top-14 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 shadow-xs">
              <span className="text-sm font-medium text-foreground">{picked.size} {t("selected")}</span>
              <Button variant="ghost" size="sm" onClick={togglePage}>{allPagePicked ? t("Clear") : t("Select all")}</Button>
              <div className="ml-auto flex items-center gap-2">
                <MovePopover
                  folders={folders.map((f) => f.name)}
                  disabled={busy}
                  onMove={(name) => move.mutate({ ids: pickedIds, folder: name })}
                />
                <Button variant="outline" size="sm" onClick={onDeletePicked} disabled={del.isPending} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 /> {t("Delete")}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setPicked(new Set())} aria-label={t("Cancel")}><X /></Button>
              </div>
            </div>
          )}

          {list.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card overflow-hidden rounded-xl border border-border">
                  <div className="bg-muted aspect-[9/16] w-full animate-pulse" />
                  <div className="flex flex-col gap-2 p-4">
                    <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                    <div className="bg-muted h-3 w-full animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState filtered={allCount > 0} onCreate={() => navigate("/create")} />
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {tasks.map((task) => (
                <VideoCard key={task.task_id} task={task} url={task.videos?.[0] ? api.fileUrl(task.videos[0]) : null} picked={picked.has(task.task_id ?? "")} onToggle={() => toggle(task.task_id ?? "")} />
              ))}
            </div>
          ) : (
            <div className="bg-card overflow-hidden rounded-xl border border-border shadow-xs">
              {tasks.map((task) => (
                <VideoRow key={task.task_id} task={task} url={task.videos?.[0] ? api.fileUrl(task.videos[0]) : null} picked={picked.has(task.task_id ?? "")} onToggle={() => toggle(task.task_id ?? "")} />
              ))}
            </div>
          )}

          {total > PAGE_SIZE && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft /> {t("Previous")}
              </Button>
              <span className="text-muted-foreground text-sm tabular-nums">
                {t("Page")} {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                {t("Next")} <ChevronRight />
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function RailItem({ icon, label, count, active, onClick, actions }: {
  icon: ReactNode; label: string; count: number; active: boolean; onClick: () => void; actions?: ReactNode;
}) {
  return (
    <button onClick={onClick} className={cn(
      "group/folder flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors",
      active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
    )}>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {actions ? <span className="hidden items-center gap-0.5 group-hover/folder:flex">{actions}</span> : null}
      <span className="text-muted-foreground/70 text-xs tabular-nums group-hover/folder:hidden">{count}</span>
    </button>
  );
}

function Segmented({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="bg-muted flex items-center rounded-md p-0.5">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn(
          "rounded px-2.5 py-1 text-xs font-medium transition-colors",
          value === o.value ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
        )}>{o.label}</button>
      ))}
    </div>
  );
}

function IconToggle({ active, onClick, label, children }: {
  active: boolean; onClick: () => void; label: string; children: ReactNode;
}) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={active} className={cn(
      "grid size-7 place-items-center rounded transition-colors",
      active ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
    )}>{children}</button>
  );
}

function Checkbox({ on }: { on: boolean }) {
  return (
    <span className={cn(
      "grid size-5 shrink-0 place-items-center rounded border transition-colors",
      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/80 text-transparent",
    )}><Check className="size-3.5" /></span>
  );
}

type LibTask = { task_id?: string; state?: TaskStateValue; progress?: number; script?: string; folder?: string | null };

function VideoCard({ task, url, picked, onToggle }: { task: LibTask; url: string | null; picked: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  const id = task.task_id ?? "";
  return (
    <div className={cn("group bg-card relative flex flex-col overflow-hidden rounded-xl border shadow-xs transition-colors", picked ? "border-primary/60" : "border-border hover:border-foreground/20")}>
      <div className="bg-muted relative aspect-[9/16] w-full overflow-hidden">
        {url ? (
          <video src={url} controls preload="metadata" className="size-full object-contain" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-4">
            {task.state === TaskState.FAILED ? <VideoOff className="text-muted-foreground size-6" /> : <Loader2 className="text-primary size-6 animate-spin" />}
            <Progress value={task.progress ?? 0} className="w-3/4" />
          </div>
        )}
        <button onClick={onToggle} aria-label={t("Select")} aria-pressed={picked} className={cn("absolute left-2 top-2 transition-opacity", picked ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
          <Checkbox on={picked} />
        </button>
      </div>
      <div className="flex flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge state={task.state} />
          {task.folder ? (
            <span className="text-muted-foreground inline-flex max-w-[55%] items-center gap-1 truncate text-[11px]"><FolderIcon className="size-3 shrink-0" /> {task.folder}</span>
          ) : (
            <span className="text-muted-foreground/60 font-mono text-[11px]">{id.slice(0, 8)}</span>
          )}
        </div>
        {task.script ? (
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{task.script}</p>
        ) : (
          <p className="text-muted-foreground/50 text-xs italic">{t("No script")}</p>
        )}
        {url ? (
          <Button asChild variant="outline" size="sm" className="mt-1 w-full"><a href={url} download><Download /> {t("Download")}</a></Button>
        ) : null}
      </div>
    </div>
  );
}

function VideoRow({ task, url, picked, onToggle }: { task: LibTask; url: string | null; picked: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  const id = task.task_id ?? "";
  return (
    <div className={cn("flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0", picked && "bg-primary/5")}>
      <button onClick={onToggle} aria-label={t("Select")} aria-pressed={picked}><Checkbox on={picked} /></button>
      <div className="bg-muted aspect-[9/16] h-12 shrink-0 overflow-hidden rounded">
        {url ? <video src={url} preload="metadata" className="size-full object-cover" /> : (
          <div className="grid size-full place-items-center">
            {task.state === TaskState.FAILED ? <VideoOff className="text-muted-foreground size-3.5" /> : <Loader2 className="text-primary size-3.5 animate-spin" />}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{task.script || <span className="text-muted-foreground/60 italic">{t("No script")}</span>}</p>
        <span className="text-muted-foreground/60 font-mono text-[11px]">{id.slice(0, 8)}</span>
      </div>
      {task.folder ? <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:inline-flex"><FolderIcon className="size-3" /> {task.folder}</span> : null}
      <StatusBadge state={task.state} />
      {url ? <Button asChild variant="ghost" size="icon-sm" aria-label={t("Download")}><a href={url} download><Download /></a></Button> : null}
    </div>
  );
}

function MovePopover({ folders, onMove, disabled }: { folders: string[]; onMove: (name: string | null) => void; disabled?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <FolderIcon /> {t("Move to")} <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        <div className="flex max-h-56 flex-col overflow-y-auto">
          {folders.map((f) => (
            <button key={f} onClick={() => { onMove(f); setOpen(false); }} className="hover:bg-secondary flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm">
              <FolderIcon className="text-muted-foreground size-3.5" /> <span className="truncate">{f}</span>
            </button>
          ))}
          {folders.length > 0 && <div className="my-1 border-t border-border" />}
          <button onClick={() => { onMove(null); setOpen(false); }} className="hover:bg-secondary text-muted-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm">
            <Inbox className="size-3.5" /> {t("Remove from folder")}
          </button>
        </div>
        <form
          className="mt-1.5 flex gap-1 border-t border-border pt-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const n = name.trim();
            if (!n) return;
            onMove(n);
            setName("");
            setOpen(false);
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("New folder…")} className="h-8 text-sm" />
          <Button type="submit" size="icon-sm" variant="outline" aria-label={t("New folder")}><Plus /></Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function EmptyState({ filtered, onCreate }: { filtered: boolean; onCreate: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="bg-muted text-muted-foreground grid size-14 place-items-center rounded-xl"><VideoOff className="size-6" /></div>
      <div>
        <p className="font-medium text-foreground">{filtered ? t("No matches") : t("No videos yet")}</p>
        <p className="text-muted-foreground text-sm">{filtered ? t("Try a different folder, status or search.") : t("Create your first video to see it here.")}</p>
      </div>
      {!filtered && <Button onClick={onCreate}><Plus /> {t("Create a video")}</Button>}
    </div>
  );
}
