"use client";

import { useActionState, type ReactNode } from "react";
import { Notice } from "@/components/ui";

export type ActionResult = { ok: boolean; message?: string } | null;

/** A form bound to a server action that returns { ok, message }. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  children: (pending: boolean) => ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={className ?? "flex flex-col gap-3"}>
      {children(pending)}
      {state?.message && <Notice tone={state.ok ? "success" : "danger"}>{state.message}</Notice>}
    </form>
  );
}
