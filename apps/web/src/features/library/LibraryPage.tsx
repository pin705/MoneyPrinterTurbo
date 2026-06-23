import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Download,
  FolderPlus,
  Folder as FolderIcon,
  Inbox,
  LayoutGrid,
  Layers,
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
import { useLibrary } from "@/store/library";

const PAGE_STEP = 200;
type StatusFilter = "all" | "complete" | "processing" | "failed";
type Sort = "newest" | "oldest";
type View = "grid" | "list";
type FolderView = "all" | "unsorted" | string;

function StatusBadge({ state }: { state?: TaskStateValue }) {
  const { t } = useTranslation();
  if (state === TaskState.COMPLETE) return <Badge variant="success">{t("Complete")}</Badge>;
  if (state === TaskState.FAILED) return <Badge variant="destructive">{t("Failed")}</Badge>;
  return <Badge variant="secondary">{t("Processing")}</Badge>;
}

export function LibraryPage() {
  const { t } = useTranslation();
  const api = useApi();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { folders, assign, createFolder, renameFolder, deleteFolder, moveToFolder, pruneAssignments } =
    useLibrary();

  const [limit, setLimit] = useState(PAGE_STEP);
  const [folderView, setFolderView] = useState<FolderView>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [view, setView] = useState<View>("grid");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["tasks", limit],
    queryFn: () => api.listTasks(1, limit),
    refetchInterval: (q) =>
      q.state.data?.tasks.some((x) => x.state === TaskState.PROCESSING) ? 2000 : false,
  });

  const del = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api.deleteTask(id))),
    onSuccess: (_r, ids) => {
      toast.success(t("Deleted {{n}} videos", { n: ids.length }));
      setPicked(new Set());
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => toast.error(t("Delete failed")),
  });

  const total = list.data?.total ?? 0;
  const allTasks = useMemo(() => list.data?.tasks ?? [], [list.data]);
  const loadedAll = allTasks.length >= total;

  // Housekeeping: once everything is loaded, drop folder assignments for
  // videos that no longer exist.
  useEffect(() => {
    if (loadedAll && allTasks.length > 0) {
      pruneAssignments(allTasks.map((x) => x.task_id ?? "").filter(Boolean));
    }
  }, [loadedAll, allTasks, pruneAssignments]);

  const counts = useMemo(() => {
    const byFolder: Record<string, number> = {};
    let unsorted = 0;
    for (const tk of allTasks) {
      const id = tk.task_id ?? "";
      const f = assign[id];
      if (f) byFolder[f] = (byFolder[f] ?? 0) + 1;
      else unsorted += 1;
    }
    return { byFolder, unsorted, all: allTasks.length };
  }, [allTasks, assign]);

  const visible = useMemo(() => {
    let rows = [...allTasks];
    if (sort === "newest") rows.reverse(); // backend returns insertion (oldest-first)
    if (folderView === "unsorted") rows = rows.filter((tk) => !assign[tk.task_id ?? ""]);
    else if (folderView !== "all")
      rows = rows.filter((tk) => assign[tk.task_id ?? ""] === folderView);
    if (status !== "all") {
      const want =
        status === "complete"
          ? TaskState.COMPLETE
          : status === "failed"
            ? TaskState.FAILED
            : TaskState.PROCESSING;
      rows = rows.filter((tk) => tk.state === want);
    }
    const q = search.trim().toLowerCase();
    if (q)
      rows = rows.filter(
        (tk) =>
          (tk.script ?? "").toLowerCase().includes(q) ||
          (tk.task_id ?? "").toLowerCase().includes(q),
      );
    return rows;
  }, [allTasks, sort, folderView, status, search, assign]);

  const pickedIds = useMemo(() => [...picked], [picked]);
  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allVisiblePicked = visible.length > 0 && visible.every((tk) => picked.has(tk.task_id ?? ""));
  const toggleAllVisible = () =>
    setPicked(allVisiblePicked ? new Set() : new Set(visible.map((tk) => tk.task_id ?? "")));

  const onDeletePicked = () => {
    if (pickedIds.length === 0) return;
    if (!window.confirm(t("Delete {{n}} videos? This can't be undone.", { n: pickedIds.length })))
      return;
    del.mutate(pickedIds);
  };

  const folderName = (id: string) => folders.find((f) => f.id === id)?.name ?? "";

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={t("Library")}
        subtitle={`${total} ${t("videos")}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => list.refetch()} disabled={list.isFetching}>
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
          <RailItem
            icon={<Layers className="size-4" />}
            label={t("All videos")}
            count={counts.all}
            active={folderView === "all"}
            onClick={() => setFolderView("all")}
          />
          <RailItem
            icon={<Inbox className="size-4" />}
            label={t("Unsorted")}
            count={counts.unsorted}
            active={folderView === "unsorted"}
            onClick={() => setFolderView("unsorted")}
          />

          <div className="text-muted-foreground/70 mt-4 flex items-center justify-between px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
            {t("Folders")}
            <button
              onClick={() => {
                setNewFolderOpen(true);
                setNewFolderName("");
              }}
              className="hover:text-foreground"
              aria-label={t("New folder")}
            >
              <FolderPlus className="size-3.5" />
            </button>
          </div>

          {newFolderOpen && (
            <form
              className="mb-1 flex gap-1 px-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (newFolderName.trim()) createFolder(newFolderName);
                setNewFolderOpen(false);
              }}
            >
              <Input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={() => setNewFolderOpen(false)}
                placeholder={t("Folder name")}
                className="h-8 text-sm"
              />
            </form>
          )}

          {folders.map((f) => (
            <div key={f.id} className="group/folder relative">
              {renaming === f.id ? (
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
                      renameFolder(f.id, e.target.value);
                      setRenaming(null);
                    }}
                    className="h-8 text-sm"
                  />
                </form>
              ) : (
                <RailItem
                  icon={<FolderIcon className="size-4" />}
                  label={f.name}
                  count={counts.byFolder[f.id] ?? 0}
                  active={folderView === f.id}
                  onClick={() => setFolderView(f.id)}
                  actions={
                    <>
                      <button
                        className="hover:text-foreground p-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenaming(f.id);
                        }}
                        aria-label={t("Rename")}
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        className="hover:text-destructive p-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(t("Delete folder “{{name}}”? Videos stay in the library.", { name: f.name }))) {
                            if (folderView === f.id) setFolderView("all");
                            deleteFolder(f.id);
                          }
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
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search videos…")}
                className="h-9 w-56 pl-8"
              />
            </div>

            <Segmented
              value={status}
              onChange={(v) => setStatus(v as StatusFilter)}
              options={[
                { value: "all", label: t("All") },
                { value: "complete", label: t("Done") },
                { value: "processing", label: t("Processing") },
                { value: "failed", label: t("Failed") },
              ]}
            />

            <Segmented
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              options={[
                { value: "newest", label: t("Newest") },
                { value: "oldest", label: t("Oldest") },
              ]}
            />

            <div className="bg-muted ml-auto flex items-center rounded-md p-0.5">
              <IconToggle active={view === "grid"} onClick={() => setView("grid")} label={t("Grid")}>
                <LayoutGrid className="size-4" />
              </IconToggle>
              <IconToggle active={view === "list"} onClick={() => setView("list")} label={t("List")}>
                <ListIcon className="size-4" />
              </IconToggle>
            </div>
          </div>

          {/* Selection bar */}
          {picked.size > 0 && (
            <div className="bg-card sticky top-14 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 shadow-xs">
              <span className="text-sm font-medium text-foreground">
                {picked.size} {t("selected")}
              </span>
              <Button variant="ghost" size="sm" onClick={toggleAllVisible}>
                {allVisiblePicked ? t("Clear") : t("Select all")}
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <MovePopover
                  folders={folders}
                  onMove={(fid) => {
                    moveToFolder(pickedIds, fid);
                    toast.success(
                      fid
                        ? t("Moved to {{name}}", { name: folderName(fid) })
                        : t("Removed from folder"),
                    );
                    setPicked(new Set());
                  }}
                  onCreate={(name) => createFolder(name)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeletePicked}
                  disabled={del.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 /> {t("Delete")}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setPicked(new Set())} aria-label={t("Cancel")}>
                  <X />
                </Button>
              </div>
            </div>
          )}

          {/* Body */}
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
          ) : visible.length === 0 ? (
            <EmptyState
              filtered={allTasks.length > 0}
              onCreate={() => navigate("/create")}
            />
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((task) => (
                <VideoCard
                  key={task.task_id}
                  task={task}
                  url={task.videos?.[0] ? api.fileUrl(task.videos[0]) : null}
                  picked={picked.has(task.task_id ?? "")}
                  onToggle={() => toggle(task.task_id ?? "")}
                  folderLabel={assign[task.task_id ?? ""] ? folderName(assign[task.task_id ?? ""]) : null}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card overflow-hidden rounded-xl border border-border shadow-xs">
              {visible.map((task) => (
                <VideoRow
                  key={task.task_id}
                  task={task}
                  url={task.videos?.[0] ? api.fileUrl(task.videos[0]) : null}
                  picked={picked.has(task.task_id ?? "")}
                  onToggle={() => toggle(task.task_id ?? "")}
                  folderLabel={assign[task.task_id ?? ""] ? folderName(assign[task.task_id ?? ""]) : null}
                />
              ))}
            </div>
          )}

          {!loadedAll && visible.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE_STEP)}>
                {t("Load more")} ({allTasks.length}/{total})
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function RailItem({
  icon,
  label,
  count,
  active,
  onClick,
  actions,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  actions?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group/folder flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {actions ? (
        <span className="hidden items-center gap-0.5 group-hover/folder:flex">{actions}</span>
      ) : null}
      <span className="text-muted-foreground/70 text-xs tabular-nums group-hover/folder:hidden">
        {count}
      </span>
    </button>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="bg-muted flex items-center rounded-md p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function IconToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-7 place-items-center rounded transition-colors",
        active ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Checkbox({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded border transition-colors",
        on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/80 text-transparent",
      )}
    >
      <Check className="size-3.5" />
    </span>
  );
}

function VideoCard({
  task,
  url,
  picked,
  onToggle,
  folderLabel,
}: {
  task: { task_id?: string; state?: TaskStateValue; progress?: number; script?: string };
  url: string | null;
  picked: boolean;
  onToggle: () => void;
  folderLabel: string | null;
}) {
  const { t } = useTranslation();
  const id = task.task_id ?? "";
  return (
    <div
      className={cn(
        "group bg-card relative flex flex-col overflow-hidden rounded-xl border shadow-xs transition-colors",
        picked ? "border-primary/60" : "border-border hover:border-foreground/20",
      )}
    >
      <div className="bg-muted relative aspect-[9/16] w-full overflow-hidden">
        {url ? (
          <video src={url} controls preload="metadata" className="size-full object-contain" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-4">
            {task.state === TaskState.FAILED ? (
              <VideoOff className="text-muted-foreground size-6" />
            ) : (
              <Loader2 className="text-primary size-6 animate-spin" />
            )}
            <Progress value={task.progress ?? 0} className="w-3/4" />
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label={t("Select")}
          aria-pressed={picked}
          className={cn(
            "absolute left-2 top-2 transition-opacity",
            picked ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <Checkbox on={picked} />
        </button>
      </div>
      <div className="flex flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge state={task.state} />
          {folderLabel ? (
            <span className="text-muted-foreground inline-flex max-w-[50%] items-center gap-1 truncate text-[11px]">
              <FolderIcon className="size-3 shrink-0" /> {folderLabel}
            </span>
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
          <Button asChild variant="outline" size="sm" className="mt-1 w-full">
            <a href={url} download>
              <Download /> {t("Download")}
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function VideoRow({
  task,
  url,
  picked,
  onToggle,
  folderLabel,
}: {
  task: { task_id?: string; state?: TaskStateValue; progress?: number; script?: string };
  url: string | null;
  picked: boolean;
  onToggle: () => void;
  folderLabel: string | null;
}) {
  const { t } = useTranslation();
  const id = task.task_id ?? "";
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0",
        picked && "bg-primary/5",
      )}
    >
      <button onClick={onToggle} aria-label={t("Select")} aria-pressed={picked}>
        <Checkbox on={picked} />
      </button>
      <div className="bg-muted aspect-[9/16] h-12 shrink-0 overflow-hidden rounded">
        {url ? (
          <video src={url} preload="metadata" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center">
            {task.state === TaskState.FAILED ? (
              <VideoOff className="text-muted-foreground size-3.5" />
            ) : (
              <Loader2 className="text-primary size-3.5 animate-spin" />
            )}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">
          {task.script || <span className="text-muted-foreground/60 italic">{t("No script")}</span>}
        </p>
        <span className="text-muted-foreground/60 font-mono text-[11px]">{id.slice(0, 8)}</span>
      </div>
      {folderLabel ? (
        <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:inline-flex">
          <FolderIcon className="size-3" /> {folderLabel}
        </span>
      ) : null}
      <StatusBadge state={task.state} />
      {url ? (
        <Button asChild variant="ghost" size="icon-sm" aria-label={t("Download")}>
          <a href={url} download>
            <Download />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function MovePopover({
  folders,
  onMove,
  onCreate,
}: {
  folders: { id: string; name: string }[];
  onMove: (folderId: string | null) => void;
  onCreate: (name: string) => string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderIcon /> {t("Move to")} <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        <div className="flex max-h-56 flex-col overflow-y-auto">
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                onMove(f.id);
                setOpen(false);
              }}
              className="hover:bg-secondary flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
            >
              <FolderIcon className="text-muted-foreground size-3.5" /> <span className="truncate">{f.name}</span>
            </button>
          ))}
          {folders.length > 0 && <div className="my-1 border-t border-border" />}
          <button
            onClick={() => {
              onMove(null);
              setOpen(false);
            }}
            className="hover:bg-secondary text-muted-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
          >
            <Inbox className="size-3.5" /> {t("Remove from folder")}
          </button>
        </div>
        <form
          className="mt-1.5 flex gap-1 border-t border-border pt-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const n = name.trim();
            if (!n) return;
            const id = onCreate(n);
            onMove(id);
            setName("");
            setOpen(false);
          }}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("New folder…")}
            className="h-8 text-sm"
          />
          <Button type="submit" size="icon-sm" variant="outline" aria-label={t("New folder")}>
            <Plus />
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function EmptyState({ filtered, onCreate }: { filtered: boolean; onCreate: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="bg-muted text-muted-foreground grid size-14 place-items-center rounded-xl">
        <VideoOff className="size-6" />
      </div>
      <div>
        <p className="font-medium text-foreground">
          {filtered ? t("No matches") : t("No videos yet")}
        </p>
        <p className="text-muted-foreground text-sm">
          {filtered
            ? t("Try a different folder, status or search.")
            : t("Create your first video to see it here.")}
        </p>
      </div>
      {!filtered && (
        <Button onClick={onCreate}>
          <Plus /> {t("Create a video")}
        </Button>
      )}
    </div>
  );
}
