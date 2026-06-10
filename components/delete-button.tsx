"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { removeSeatEntry } from "@/app/actions";
import { getOwnerHash, getOwnerToken } from "@/lib/owner";
import { Button } from "@/components/ui/button";

/**
 * Renders a delete button only when this browser's owner hash matches the row's
 * stored hash. Ownership is resolved after mount (it depends on localStorage), so
 * the button is hidden during SSR and the first client paint.
 */
export function DeleteButton({
  id,
  name,
  ownerHash,
}: {
  id: string;
  name: string;
  ownerHash: string | null;
}) {
  const [owned, setOwned] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!ownerHash) return;
    let active = true;
    getOwnerHash().then((mine) => {
      if (active) setOwned(mine === ownerHash);
    });
    return () => {
      active = false;
    };
  }, [ownerHash]);

  if (!owned) return null;

  function handleDelete() {
    startTransition(async () => {
      const result = await removeSeatEntry(id, getOwnerToken());
      if (result.ok) {
        toast.success(`Checked ${name} out.`);
      } else {
        toast.error(result.message ?? "Could not remove that check-in.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`Remove ${name}`}
      title={`Remove ${name}`}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
