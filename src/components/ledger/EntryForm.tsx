"use client";

import { useMemo, useState, type FormEvent, type RefObject } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import type { Entry, EntryType } from "@/lib/types";
import { parseAmountToPaise, paiseToDecimal } from "@/lib/money";
import { isFutureDate, isValidISODate, todayISO } from "@/lib/dates";
import { categoriesForType } from "@/lib/categories";
import { useLedger } from "@/components/providers/LedgerProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { AmountInput } from "@/components/ui/AmountInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Chip } from "@/components/ui/Chip";

interface EntryFormProps {
  /** When set, the form edits this entry. */
  initial?: Entry;
  onDone: () => void;
  amountRef?: RefObject<HTMLInputElement | null>;
}

export function EntryForm({ initial, onDone, amountRef }: EntryFormProps) {
  const { categories, settings, addEntry, updateEntry, deleteEntry } = useLedger();
  const { toast } = useToast();

  const [type, setType] = useState<EntryType>(initial?.type ?? settings.lastType);
  const [amount, setAmount] = useState(initial ? paiseToDecimal(initial.amount) : "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [categoryId, setCategoryId] = useState<string | null>(
    initial ? initial.categoryId : settings.lastCategoryId[settings.lastType],
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [amountError, setAmountError] = useState<string | undefined>();
  const [dateError, setDateError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const options = useMemo(() => categoriesForType(categories, type, categoryId), [categories, type, categoryId]);

  // Switching type drops a category that does not belong to the new type and recalls the last used one.
  function changeType(next: EntryType) {
    setType(next);
    if (initial && next === initial.type) {
      setCategoryId(initial.categoryId);
      return;
    }
    const stillValid = categoriesForType(categories, next, null).some((c) => c.id === categoryId);
    if (!stillValid) setCategoryId(settings.lastCategoryId[next] ?? null);
  }

  const futureDate = isValidISODate(date) && isFutureDate(date);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseAmountToPaise(amount);
    if (!parsed.ok) {
      setAmountError(parsed.error);
      amountRef?.current?.focus();
      return;
    }
    if (!isValidISODate(date)) {
      setDateError("Enter a valid date.");
      return;
    }
    setAmountError(undefined);
    setDateError(undefined);
    setSaving(true);
    try {
      const input = { type, amount: parsed.paise, date, categoryId, note };
      if (initial) {
        await updateEntry(initial.id, input);
        toast({ message: "Entry updated", tone: "success" });
      } else {
        await addEntry(input);
        toast({ message: "Entry saved", tone: "success" });
      }
      onDone();
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : "Could not save the entry.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await deleteEntry(initial.id);
      onDone();
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : "Could not delete the entry.", tone: "error" });
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <SegmentedControl
        label="Entry type"
        size="lg"
        value={type}
        onChange={changeType}
        options={[
          { value: "in", label: "Added", tone: "in" },
          { value: "out", label: "Withdrawn", tone: "out" },
        ]}
      />

      <Field label="Amount" error={amountError} hint={amountError ? undefined : "Up to two decimals"}>
        {({ id, describedBy }) => (
          <AmountInput
            id={id}
            ref={amountRef}
            value={amount}
            aria-describedby={describedBy}
            aria-invalid={Boolean(amountError)}
            onChange={(e) => {
              setAmount(e.target.value);
              if (amountError) setAmountError(undefined);
            }}
            required
          />
        )}
      </Field>

      <Field label="Date" error={dateError}>
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="date"
            value={date}
            max="9999-12-31"
            aria-describedby={describedBy}
            aria-invalid={Boolean(dateError)}
            onChange={(e) => {
              setDate(e.target.value);
              if (dateError) setDateError(undefined);
            }}
            required
          />
        )}
      </Field>
      {futureDate && (
        <p className="-mt-3 flex items-start gap-2 rounded-sm bg-warning-soft px-3 py-2 text-sm text-warning-text" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          This date is in the future. The entry will count once that day arrives in your reports.
        </p>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg-2">Category</legend>
        <div className="flex flex-wrap gap-2">
          <Chip selected={categoryId === null} onClick={() => setCategoryId(null)}>
            None
          </Chip>
          {options.map((c) => (
            <Chip key={c.id} color={c.color} selected={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
              {c.name}
              {c.archived ? " (archived)" : ""}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Field label="Note" hint="Optional">
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            value={note}
            maxLength={500}
            placeholder="What was this for?"
            aria-describedby={describedBy}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </Field>

      <div className="mt-1 flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button type="submit" size="lg" loading={saving}>
            {initial ? "Save changes" : "Save entry"}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={onDone} disabled={saving}>
            Cancel
          </Button>
        </div>
        {initial && (
          <Button
            type="button"
            variant={confirmDelete ? "destructive" : "ghost"}
            size="lg"
            icon={<Trash2 className="h-5 w-5" aria-hidden />}
            onClick={onDelete}
            disabled={saving}
            className={confirmDelete ? "" : "text-danger-text"}
          >
            {confirmDelete ? "Confirm delete" : "Delete entry"}
          </Button>
        )}
      </div>
    </form>
  );
}
