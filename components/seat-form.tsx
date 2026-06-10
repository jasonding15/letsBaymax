"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { addSeatEntry, type ActionResult } from "@/app/actions";
import { getOwnerToken } from "@/lib/owner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  BAYS,
  BAY_EMOJI,
  BAY_LABELS,
  FLOORS,
  MAX_COMMENT_LENGTH,
  MAX_NAME_LENGTH,
  STATUSES,
  STATUS_EMOJI,
  STATUS_HINTS,
  STATUS_LABELS,
  type Status,
} from "@/lib/types";

const NAME_STORAGE_KEY = "letsbaymax:last-name";

interface ChipOption {
  value: string;
  label: string;
  emoji?: string;
}

const FLOOR_OPTIONS: ChipOption[] = FLOORS.map((f) => ({
  value: String(f),
  label: `Floor ${f}`,
}));

const BAY_OPTIONS: ChipOption[] = BAYS.map((b) => ({
  value: b,
  label: BAY_LABELS[b],
  emoji: BAY_EMOJI[b],
}));

/** A single-select row of chips. Selection is required (no clear button). */
function ChipQuestion({
  question,
  options,
  value,
  onChange,
}: {
  question: string;
  options: ChipOption[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>
        {question} <span className="text-primary">*</span>
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {opt.emoji ? <span aria-hidden>{opt.emoji}</span> : null}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SeatForm() {
  const nameId = useId();
  const commentId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [floor, setFloor] = useState<string | null>(null);
  const [bay, setBay] = useState<string | null>(null);
  const [ownerToken, setOwnerToken] = useState("");

  // After mount (client-only): read this browser's token and last-used name so
  // updating your status through the day doesn't mean retyping your name.
  useEffect(() => {
    setOwnerToken(getOwnerToken());
    const saved = localStorage.getItem(NAME_STORAGE_KEY);
    if (saved) setName(saved);
  }, []);

  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(addSeatEntry, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Status updated! 🤖");
      // Keep the name (for quick re-updates); reset the rest.
      formRef.current?.reset();
      setStatus(null);
      setFloor(null);
      setBay(null);
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  function handleSubmit(formData: FormData) {
    const trimmed = name.trim();
    if (trimmed) localStorage.setItem(NAME_STORAGE_KEY, trimmed);
    return formAction(formData);
  }

  const needsBay = status === "at_bay";
  const submitDisabled =
    pending || !name.trim() || !status || (needsBay && (!floor || !bay));

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
      {/* Hidden inputs carry the chip selections into FormData. */}
      <input type="hidden" name="status" value={status ?? ""} />
      <input type="hidden" name="floor" value={needsBay ? (floor ?? "") : ""} />
      <input type="hidden" name="bay" value={needsBay ? (bay ?? "") : ""} />
      <input type="hidden" name="ownerToken" value={ownerToken} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId} className="text-base">
          What&apos;s your name?
        </Label>
        <Input
          id={nameId}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex Kim"
          required
          maxLength={MAX_NAME_LENGTH}
          autoComplete="name"
          className="h-11 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          What&apos;s your status? <span className="text-primary">*</span>
        </Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {STATUSES.map((s) => {
            const selected = status === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={selected}
                onClick={() => setStatus(s)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-primary/40 ring-2"
                    : "border-input bg-background hover:bg-accent",
                )}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <span aria-hidden>{STATUS_EMOJI[s]}</span>
                  {STATUS_LABELS[s]}
                </span>
                <span className="text-muted-foreground text-xs">
                  {STATUS_HINTS[s]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {needsBay ? (
        <div className="bg-muted/30 flex flex-col gap-4 rounded-xl border border-dashed p-3.5">
          <ChipQuestion
            question="Which floor?"
            options={FLOOR_OPTIONS}
            value={floor}
            onChange={setFloor}
          />
          <ChipQuestion
            question="Which bay?"
            options={BAY_OPTIONS}
            value={bay}
            onChange={setBay}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor={commentId}>
          Any comments?{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id={commentId}
          name="comment"
          placeholder="e.g. free till 4, grabbing coffee, ping me on Slack"
          maxLength={MAX_COMMENT_LENGTH}
          rows={2}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={submitDisabled}
        className="h-12 w-full bg-gradient-to-r from-red-600 to-rose-500 text-base font-bold text-white shadow-md transition-all hover:from-red-500 hover:to-rose-400 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Updating… 🤖" : "Set my status 🤖"}
      </Button>
    </form>
  );
}
