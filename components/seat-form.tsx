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
} from "@/lib/types";

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
        {question} <span className="text-destructive">*</span>
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

  const [floor, setFloor] = useState<string | null>(null);
  const [bay, setBay] = useState<string | null>(null);
  const [ownerToken, setOwnerToken] = useState("");

  // Mint/read this browser's owner token after mount (localStorage is client-only).
  useEffect(() => {
    setOwnerToken(getOwnerToken());
  }, []);

  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(addSeatEntry, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "You're checked in! 🏢");
      formRef.current?.reset();
      setFloor(null);
      setBay(null);
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {/* Hidden inputs carry the chip selections into FormData. */}
      <input type="hidden" name="floor" value={floor ?? ""} />
      <input type="hidden" name="bay" value={bay ?? ""} />
      <input type="hidden" name="ownerToken" value={ownerToken} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId} className="text-base">
          What&apos;s your name?
        </Label>
        <Input
          id={nameId}
          name="name"
          placeholder="e.g. Alex Kim"
          required
          maxLength={MAX_NAME_LENGTH}
          autoComplete="name"
          className="h-11 text-base"
        />
      </div>

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

      <div className="flex flex-col gap-2">
        <Label htmlFor={commentId}>
          Any comments?{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id={commentId}
          name="comment"
          placeholder="e.g. by the window, here till 4, grabbing lunch at noon"
          maxLength={MAX_COMMENT_LENGTH}
          rows={2}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={pending || !floor || !bay}
        className="h-12 w-full bg-gradient-to-r from-indigo-500 to-sky-500 text-base font-bold text-white shadow-md transition-all hover:from-indigo-400 hover:to-sky-400 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Checking in… 🏢" : "I'm in the office! 🏢"}
      </Button>
    </form>
  );
}
