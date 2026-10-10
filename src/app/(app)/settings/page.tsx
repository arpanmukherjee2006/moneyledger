"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Archive, ArchiveRestore, Download, LogOut, Moon, Monitor, Pencil, Plus, Sun, Upload, Check, X } from "lucide-react";
import { useLedger } from "@/components/providers/LedgerProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useToast } from "@/components/providers/ToastProvider";
import type { Category, ThemePreference } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/categories";
import { createBackup, validateBackup, type BackupPreview } from "@/lib/backup";
import { downloadText } from "@/lib/download";
import { dateLabel, todayISO } from "@/lib/dates";
import { formatPaise } from "@/lib/money";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ColorDot } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";

export default function SettingsPage() {
  const ledger = useLedger();
  const { status, mode, user, entries, categories, settings } = ledger;
  const { preference, setPreference } = useTheme();
  const { toast } = useToast();

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <h1 className="text-xl font-semibold">Settings</h1>
        <SkeletonCard lines={2} />
        <SkeletonCard lines={6} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  async function changeTheme(p: ThemePreference) {
    setPreference(p);
    try {
      await ledger.updateSettings({ theme: p });
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : "Could not save the theme.", tone: "error" });
    }
  }

  function downloadBackup() {
    const file = createBackup(entries, categories, settings);
    downloadText(`money-ledger-backup-${todayISO()}.json`, JSON.stringify(file, null, 2), "application/json");
    toast({ message: "Backup downloaded", tone: "success" });
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card>
        <CardHeader title="Appearance" description="Follows your device by default." />
        <CardBody>
          <SegmentedControl<ThemePreference>
            label="Theme"
            value={preference}
            onChange={changeTheme}
            className="sm:max-w-sm"
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
          <p className="mt-2 flex items-center gap-2 text-xs text-fg-3">
            {preference === "system" ? <Monitor className="h-4 w-4" aria-hidden /> : preference === "dark" ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
            {preference === "system" ? "Switches with your device setting." : preference === "dark" ? "Always dark." : "Always light."}
          </p>
        </CardBody>
      </Card>

      <CategoriesCard />

      <Card>
        <CardHeader title="Backup and restore" description="A backup is a JSON file with every entry and category." />
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" icon={<Download className="h-4 w-4" aria-hidden />} onClick={downloadBackup}>
              Download backup
            </Button>
            <RestoreButton />
          </div>
          <p className="text-sm text-fg-3">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} and {categories.length} categories will be included.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Account and data" description={mode === "cloud" ? `Signed in as ${user?.email ?? "your account"}. Data syncs to every device you sign in on.` : "Running in local mode. Data lives in this browser only, so keep a backup."} />
        <CardBody className="flex flex-col gap-4">
          {mode === "cloud" && (
            <Button variant="secondary" icon={<LogOut className="h-4 w-4" aria-hidden />} onClick={() => ledger.signOut()} className="self-start">
              Sign out
            </Button>
          )}
          <DangerZone />
        </CardBody>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ categories */

function CategoriesCard() {
  const { categories, addCategory, updateCategory } = useLedger();
  const { toast } = useToast();
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const visible = useMemo(
    () => categories.filter((c) => showArchived || !c.archived).sort((a, b) => a.name.localeCompare(b.name)),
    [categories, showArchived],
  );
  const archivedCount = categories.filter((c) => c.archived).length;

  async function toggleArchive(c: Category) {
    try {
      await updateCategory(c.id, { archived: !c.archived });
      toast({ message: c.archived ? `${c.name} restored` : `${c.name} archived`, tone: "success" });
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : "Could not update the category.", tone: "error" });
    }
  }

  return (
    <Card>
      <CardHeader
        title="Categories"
        description="Archived categories stay on old entries but are hidden when adding."
        action={
          <Button size="sm" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing("new")}>
            New
          </Button>
        }
      />
      <div className="mt-3 border-t border-border">
        {(["in", "out"] as const).map((type) => {
          const list = visible.filter((c) => c.type === type || c.type === "both");
          return (
            <section key={type} aria-label={type === "in" ? "Added categories" : "Withdrawn categories"}>
              <h3 className="bg-surface-2 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-fg-3 sm:px-6">
                {type === "in" ? "Added" : "Withdrawn"}
              </h3>
              <ul className="divide-y divide-border">
                {list.length === 0 && <li className="px-4 py-3 text-sm text-fg-3 sm:px-6">No categories.</li>}
                {list.map((c) => (
                  <li key={c.id} className={cn("flex items-center gap-3 px-4 py-2 sm:px-6", c.archived && "text-fg-3")}>
                    <ColorDot color={c.color} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {c.name}
                      {c.archived && <span className="ml-2 text-xs font-normal">Archived</span>}
                    </span>
                    <IconButton label={`Rename ${c.name}`} size="sm" onClick={() => setEditing(c)}>
                      <Pencil className="h-4 w-4" aria-hidden />
                    </IconButton>
                    <IconButton label={c.archived ? `Restore ${c.name}` : `Archive ${c.name}`} size="sm" onClick={() => toggleArchive(c)}>
                      {c.archived ? <ArchiveRestore className="h-4 w-4" aria-hidden /> : <Archive className="h-4 w-4" aria-hidden />}
                    </IconButton>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {archivedCount > 0 && (
        <div className="border-t border-border px-4 py-2 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => setShowArchived((s) => !s)} aria-pressed={showArchived}>
            {showArchived ? "Hide archived" : `Show ${archivedCount} archived`}
          </Button>
        </div>
      )}

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New category" : "Edit category"}>
        {editing !== null && (
          <CategoryForm
            initial={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
            onSave={async (values) => {
              if (editing === "new") await addCategory(values);
              else await updateCategory(editing.id, values);
            }}
          />
        )}
      </Sheet>
    </Card>
  );
}

function CategoryForm({
  initial,
  onDone,
  onSave,
}: {
  initial?: Category;
  onDone: () => void;
  onSave: (values: { name: string; type: Category["type"]; color: string }) => Promise<void>;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<Category["type"]>(initial?.type ?? "out");
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[0]);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the category a name.");
      return;
    }
    if (name.trim().length > 60) {
      setError("Keep the name under 60 characters.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), type, color });
      toast({ message: initial ? "Category updated" : "Category created", tone: "success" });
      onDone();
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : "Could not save the category.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg-2">
        Name
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
          aria-invalid={Boolean(error)}
          maxLength={60}
          autoFocus
        />
        {error && (
          <span role="alert" className="font-normal text-danger-text">
            {error}
          </span>
        )}
      </label>
      <SegmentedControl<Category["type"]>
        label="Used for"
        value={type}
        onChange={setType}
        options={[
          { value: "in", label: "Added", tone: "in" },
          { value: "out", label: "Withdrawn", tone: "out" },
          { value: "both", label: "Both" },
        ]}
      />
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg-2">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Colour ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform duration-150 hover:scale-105"
              style={{ background: c, borderColor: color === c ? "var(--fg)" : "transparent" }}
            >
              {color === c && <Check className="h-5 w-5 text-white" aria-hidden />}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button type="submit" size="lg" loading={saving}>
          {initial ? "Save changes" : "Create category"}
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ restore */

function RestoreButton() {
  const { restore } = useLedger();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const [restoring, setRestoring] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    const result = validateBackup(text);
    if (!result.ok) {
      toast({ message: result.error, tone: "error", duration: 8000 });
      return;
    }
    setFileName(file.name);
    setPreview(result.preview);
  }

  async function confirm() {
    if (!preview) return;
    setRestoring(true);
    try {
      await restore({ entries: preview.entries, categories: preview.categories });
      toast({ message: `Restored ${preview.summary.entryCount} entries`, tone: "success" });
      setPreview(null);
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : "Could not restore the backup.", tone: "error" });
    } finally {
      setRestoring(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const s = preview?.summary;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Choose a backup file"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <Button variant="secondary" icon={<Upload className="h-4 w-4" aria-hidden />} onClick={() => fileRef.current?.click()}>
        Restore from backup
      </Button>
      <Sheet open={preview !== null} onClose={() => !restoring && setPreview(null)} title="Restore this backup?" description="This replaces everything currently in your ledger.">
        {s && (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-sm bg-surface-2 p-4 text-sm">
              <dt className="text-fg-3">File</dt>
              <dd className="truncate font-medium">{fileName}</dd>
              <dt className="text-fg-3">Entries</dt>
              <dd className="num font-medium">{s.entryCount}</dd>
              <dt className="text-fg-3">Categories</dt>
              <dd className="num font-medium">{s.categoryCount}</dd>
              <dt className="text-fg-3">Date range</dt>
              <dd className="font-medium">{s.firstDate && s.lastDate ? `${dateLabel(s.firstDate)} to ${dateLabel(s.lastDate)}` : "No entries"}</dd>
              <dt className="text-fg-3">Added</dt>
              <dd className="num font-medium text-in-text">{formatPaise(s.added)}</dd>
              <dt className="text-fg-3">Withdrawn</dt>
              <dd className="num font-medium text-out-text">{formatPaise(s.withdrawn)}</dd>
              {preview?.exportedAt && (
                <>
                  <dt className="text-fg-3">Exported</dt>
                  <dd className="font-medium">{new Date(preview.exportedAt).toLocaleString("en-IN")}</dd>
                </>
              )}
            </dl>
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Button variant="destructive" size="lg" loading={restoring} onClick={confirm}>
                Replace my data
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setPreview(null)} disabled={restoring}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

/* ------------------------------------------------------------------ danger zone */

function DangerZone() {
  const { mode, clearAll, deleteAccount, entries } = useLedger();
  const { toast } = useToast();
  const [open, setOpen] = useState<"data" | "account" | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      if (open === "data") {
        await clearAll();
        toast({ message: "All data deleted", tone: "success" });
      } else {
        await deleteAccount();
        toast({ message: "Account deleted", tone: "success" });
      }
      setOpen(null);
      setTyped("");
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : "Could not delete.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  const word = "DELETE";

  return (
    <div className="rounded-sm border border-danger/40 p-4">
      <h3 className="text-sm font-semibold text-danger-text">Danger zone</h3>
      <p className="mt-1 text-sm text-fg-3">These actions cannot be undone. Download a backup first.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" className="text-danger-text" onClick={() => setOpen("data")} disabled={entries.length === 0}>
          Delete all entries
        </Button>
        {mode === "cloud" && (
          <Button variant="secondary" className="text-danger-text" onClick={() => setOpen("account")}>
            Delete account permanently
          </Button>
        )}
      </div>
      <Sheet
        open={open !== null}
        onClose={() => !busy && setOpen(null)}
        title={open === "data" ? "Delete all entries?" : "Delete your account?"}
        description={
          open === "data"
            ? "Every entry will be removed. Categories are reset to the defaults."
            : "Your account and every entry, category and setting will be permanently deleted."
        }
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-fg-2">
            Type {word} to confirm
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button variant="destructive" size="lg" loading={busy} disabled={typed !== word} onClick={run} icon={<X className="h-4 w-4" aria-hidden />}>
              {open === "data" ? "Delete everything" : "Delete account"}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setOpen(null)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
