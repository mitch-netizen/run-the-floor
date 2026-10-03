import { microsoftSignInEnabled } from "@/lib/env";
import { safeNext } from "@/lib/safe-next";
import { Button, Notice } from "@/components/ui";
import { signInWithMicrosoft } from "./actions";
import { MagicLinkForm } from "./magic-link-form";

const errors: Record<string, string> = {
  link: "That sign-in link has expired or was already used. Send a new one.",
  microsoft: "Microsoft sign-in didn't complete. Try again or use an email link.",
};

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const sp = await props.searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  const error = typeof sp.error === "string" ? errors[sp.error] : undefined;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Run The Floor</h1>
        <p className="mt-1 text-muted">Sign in to your venue.</p>
      </div>
      {error && <Notice tone="danger">{error}</Notice>}
      <MagicLinkForm next={next} />
      {microsoftSignInEnabled && (
        <form action={signInWithMicrosoft}>
          <input type="hidden" name="next" value={next} />
          <Button type="submit" variant="secondary" className="w-full">Sign in with Microsoft</Button>
        </form>
      )}
      <p className="text-xs text-muted">Access is by invitation from your venue. You&apos;ll stay signed in on this device.</p>
    </main>
  );
}
