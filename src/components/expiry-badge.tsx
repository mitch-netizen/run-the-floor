import { Badge } from "@/components/ui";
import type { ExpiryState } from "@/lib/qualifications";

export function ExpiryBadge({ expiry, label }: { expiry: ExpiryState; label?: string }) {
  const prefix = label ? `${label} ` : "";
  switch (expiry.status) {
    case "expired":
      return <Badge tone="danger">{prefix}expired</Badge>;
    case "due":
      return <Badge tone="warning">{prefix}expires in {expiry.daysLeft} {expiry.daysLeft === 1 ? "day" : "days"}</Badge>;
    case "ok":
      return <Badge tone="success">{prefix}current</Badge>;
    default:
      return <Badge>{prefix}no expiry</Badge>;
  }
}
