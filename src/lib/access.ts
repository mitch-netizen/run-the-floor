import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { Capability } from "@/lib/capabilities";
import { createClient } from "@/lib/supabase/server";

export type VenueAccess = {
  venueId: string;
  organisationId: string;
  slug: string;
  name: string;
  roleName: string | null;
  capabilities: string[];
  isGroupOwner: boolean;
};

/** The signed-in user's id, or a redirect to sign in. */
export const requireUserId = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) redirect("/sign-in");
  return sub;
});

/** Venues the signed-in user can reach (RLS decides). One query per request. */
export const getMyVenues = cache(async (): Promise<VenueAccess[]> => {
  await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_venues");
  if (error) throw error;
  return (data ?? []).map((v) => ({
    venueId: v.venue_id,
    organisationId: v.organisation_id,
    slug: v.slug,
    name: v.name,
    roleName: v.role_name,
    capabilities: v.capabilities,
    isGroupOwner: v.is_group_owner,
  }));
});

/** The venue for a route segment; 404 if the user can't reach it. */
export async function requireVenue(slug: string): Promise<VenueAccess> {
  const venue = (await getMyVenues()).find((v) => v.slug === slug);
  if (!venue) notFound();
  return venue;
}

export function can(venue: VenueAccess, capability: Capability): boolean {
  return venue.capabilities.includes(capability);
}

/** For server actions: the venue plus a hard capability check (RLS still applies). */
export async function requireCapability(slug: string, capability: Capability): Promise<VenueAccess> {
  const venue = await requireVenue(slug);
  if (!can(venue, capability)) throw new Error("You don't have permission to do that at this venue.");
  return venue;
}
