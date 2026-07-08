"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/shared/form-field";
import { useCreateReturn } from "@/features/returns/use-returns";
import type { OrderItem, ReturnReason, ReturnType } from "@/types";

const REASONS: { value: ReturnReason; label: string }[] = [
  { value: "defective", label: "Defective / damaged" },
  { value: "wrong_item", label: "Wrong item delivered" },
  { value: "not_as_described", label: "Not as described" },
  { value: "size_fit", label: "Size / fit issue" },
  { value: "no_longer_needed", label: "No longer needed" },
  { value: "other", label: "Other" },
];

export function ReturnRequestDialog({
  item,
  open,
  onOpenChange,
}: {
  item: OrderItem;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const create = useCreateReturn();
  const router = useRouter();
  const canReturn = item.is_returnable ?? true;
  const canExchange = item.is_exchangeable ?? false;

  const [type, setType] = useState<ReturnType>(
    canReturn ? "return" : "exchange",
  );
  const [reason, setReason] = useState<ReturnReason>("defective");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const maxQty = item.quantity ?? 1;

  const submit = () => {
    create.mutate(
      {
        order_item: item.id,
        type,
        reason,
        reason_note: note,
        quantity: Math.min(Math.max(1, quantity), maxQty),
      },
      {
        onSuccess: (rr) => {
          onOpenChange(false);
          // Land the buyer on the order page, where the new request now shows
          // in the Returns & Exchanges panel and can be tracked.
          router.push(`/account/orders/${rr.order}`);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Return or exchange item</DialogTitle>
          <DialogDescription className="truncate">
            {item.product_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {canReturn && canExchange && (
            <Field label="What would you like to do?">
              <Select
                value={type}
                onValueChange={(v) => setType(v as ReturnType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="return">Return for refund</SelectItem>
                  <SelectItem value="exchange">
                    Exchange for the same item
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field label="Reason" required>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as ReturnReason)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {maxQty > 1 && (
            <Field label={`Quantity (max ${maxQty})`}>
              <Input
                type="number"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              />
            </Field>
          )}

          <Field label="Details (optional)">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell the seller what went wrong…"
              rows={3}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="brand" loading={create.isPending} onClick={submit}>
            Submit {type === "exchange" ? "exchange" : "return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
