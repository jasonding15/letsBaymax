"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { addBeachEntry, type ActionResult } from "@/app/actions";
import { getOwnerToken } from "@/lib/owner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_COMMENT_LENGTH, MAX_NAME_LENGTH } from "@/lib/types";

interface ChipOption {
  value: string;
  label: string;
  emoji: string;
}

const ACTIVITY_OPTIONS: ChipOption[] = [
  { value: "outdoors", label: "Outdoors", emoji: "🌞" },
  { value: "indoors", label: "Indoors", emoji: "🏠" },
  { value: "either", label: "Either", emoji: "🤷" },
];

const DRINKING_OPTIONS: ChipOption[] = [
  { value: "yes", label: "Down to drink", emoji: "🍹" },
  { value: "no", label: "Prefers not to drink", emoji: "🙅" },
  { value: "indifferent", label: "Indifferent on drinking", emoji: "🤷" },
];

/** A single-select row of chips. Clicking the active chip (or "Clear") deselects. */
function ChipQuestion({
  question,
  options,
  value,
  onChange,
}: {
  question: string;
  options: ChipOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{question}</Label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-2 hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : opt.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span aria-hidden>{opt.emoji}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BeachForm() {
  const nameId = useId();
  const commentId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const [activity, setActivity] = useState<string | null>(null);
  const [drinking, setDrinking] = useState<string | null>(null);
  const [ownerToken, setOwnerToken] = useState("");

  // Mint/read this browser's owner token after mount (localStorage is client-only).
  useEffect(() => {
    setOwnerToken(getOwnerToken());
  }, []);

  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(addBeachEntry, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "You're on the beach! 🏖️");
      formRef.current?.reset();
      setActivity(null);
      setDrinking(null);
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {/* Hidden inputs carry the chip selections into FormData (empty = no preference). */}
      <input type="hidden" name="activityPreference" value={activity ?? ""} />
      <input type="hidden" name="drinkingPreference" value={drinking ?? ""} />
      <input type="hidden" name="ownerToken" value={ownerToken} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId} className="text-base">
          What&apos;s your name?
        </Label>
        <Input
          id={nameId}
          name="name"
          placeholder="e.g. Sandy Shores"
          required
          maxLength={MAX_NAME_LENGTH}
          autoComplete="name"
          className="h-11 text-base"
        />
      </div>

      <div className="bg-muted/30 flex flex-col gap-4 rounded-xl border border-dashed p-3.5">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Optional — totally fine to skip
        </p>
        <ChipQuestion
          question="Down to hang outdoors, indoors, or either?"
          options={ACTIVITY_OPTIONS}
          value={activity}
          onChange={setActivity}
        />
        <ChipQuestion
          question="Down to drink?"
          options={DRINKING_OPTIONS}
          value={drinking}
          onChange={setDrinking}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor={commentId}>Any comments?</Label>
          <Textarea
            id={commentId}
            name="comment"
            placeholder="e.g. down for dinner / museum / park stroll / run"
            maxLength={MAX_COMMENT_LENGTH}
            rows={2}
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-12 w-full bg-gradient-to-r from-cyan-500 to-sky-500 text-base font-bold text-white shadow-md transition-all hover:from-cyan-400 hover:to-sky-400 hover:shadow-lg active:scale-[0.98]"
      >
        {pending ? "Heading out… 🏄" : "I'm on the beach! 🏖️"}
      </Button>
    </form>
  );
}
