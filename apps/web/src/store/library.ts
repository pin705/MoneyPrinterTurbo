import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Folder {
  id: string;
  name: string;
}

interface LibraryState {
  /** User-defined folders (client-side; this is a local single-user desktop app). */
  folders: Folder[];
  /** taskId → folderId. A task without an entry is "Unsorted". */
  assign: Record<string, string>;

  createFolder: (name: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  /** Move tasks into a folder, or pass null to send them back to Unsorted. */
  moveToFolder: (taskIds: string[], folderId: string | null) => void;
  /** Drop assignments for tasks that no longer exist (housekeeping). */
  pruneAssignments: (existingIds: string[]) => void;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `f_${Date.now().toString(36)}`;
  }
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set) => ({
      folders: [],
      assign: {},

      createFolder: (name) => {
        const id = newId();
        const clean = name.trim() || "Untitled";
        set((s) => ({ folders: [...s.folders, { id, name: clean }] }));
        return id;
      },

      renameFolder: (id, name) =>
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === id ? { ...f, name: name.trim() || f.name } : f,
          ),
        })),

      deleteFolder: (id) =>
        set((s) => {
          const assign = { ...s.assign };
          for (const taskId of Object.keys(assign)) {
            if (assign[taskId] === id) delete assign[taskId];
          }
          return { folders: s.folders.filter((f) => f.id !== id), assign };
        }),

      moveToFolder: (taskIds, folderId) =>
        set((s) => {
          const assign = { ...s.assign };
          for (const taskId of taskIds) {
            if (folderId) assign[taskId] = folderId;
            else delete assign[taskId];
          }
          return { assign };
        }),

      pruneAssignments: (existingIds) =>
        set((s) => {
          const keep = new Set(existingIds);
          const assign: Record<string, string> = {};
          for (const [taskId, folderId] of Object.entries(s.assign)) {
            if (keep.has(taskId)) assign[taskId] = folderId;
          }
          return { assign };
        }),
    }),
    { name: "mpt-library" },
  ),
);
