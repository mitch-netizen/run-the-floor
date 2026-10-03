"use client";

import { useActionState } from "react";
import { Button, Field, Input, Notice } from "@/components/ui";
import { sendMagicLink, type SignInState } from "./actions";

export function MagicLinkForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(sendMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <Notice tone="success">
        If {state.email} has access, a sign-in link is on its way. Tap the link in the email to sign in.
      </Notice>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@venue.com.au" />
      </Field>
      {state.status === "error" && <Notice tone="danger">{state.message}</Notice>}
      <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Email me a sign-in link"}</Button>
    </form>
  );
}
