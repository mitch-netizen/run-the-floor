import { signOut } from "@/app/sign-in/actions";
import { Button } from "@/components/ui";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" className="w-full text-muted">Sign out</Button>
    </form>
  );
}
