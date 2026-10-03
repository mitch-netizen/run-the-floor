"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/components/action-form";
import { requireCapability, requireUserId } from "@/lib/access";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const uuid = z.uuid();
const optionalUuid = z.union([z.literal(""), z.uuid()]).transform((v) => v || null);
const optionalDate = z.union([z.literal(""), z.iso.date()]).transform((v) => v || null);

const fail = (message: string): ActionResult => ({ ok: false, message });
const peoplePath = (slug: string) => `/v/${slug}/admin/people`;

const inviteSchema = z.object({
  email: z.email().transform((e) => e.trim().toLowerCase()),
  full_name: z.string().trim().max(120).optional(),
  role_id: uuid,
  department_id: optionalUuid,
});

/**
 * Invite someone to the venue. The caller's users.manage is checked first; the
 * service role is used only to find or invite the auth user. The membership
 * itself is written with the caller's own client, so RLS has the final say.
 */
export async function inviteMember(slug: string, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  const venue = await requireCapability(slug, "users.manage");
  const parsed = inviteSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail("Check the email address and role.");
  const { email, full_name, role_id, department_id } = parsed.data;

  const admin = createAdminClient();
  let userId: string | undefined;
  const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  userId = existing?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: full_name || null },
      redirectTo: `${await siteUrl()}/auth/confirm?next=${encodeURIComponent(`/v/${slug}`)}`,
    });
    if (error || !data.user) return fail("The invitation couldn't be sent. Try again shortly.");
    userId = data.user.id;
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("memberships").select("id, archived_at").eq("venue_id", venue.venueId).eq("user_id", userId).maybeSingle();

  const { error } = current
    ? await supabase.from("memberships")
        .update({ role_id, department_id, status: "active", archived_at: null })
        .eq("id", current.id)
    : await supabase.from("memberships")
        .insert({ venue_id: venue.venueId, organisation_id: venue.organisationId, user_id: userId, role_id, department_id });
  if (error) return fail("They couldn't be added to this venue.");

  revalidatePath(peoplePath(slug));
  return { ok: true, message: existing ? `${email} now has access.` : `Invitation sent to ${email}.` };
}

const memberSchema = z.object({ role_id: uuid, department_id: optionalUuid });

async function guardNotSelf(membershipId: string, venueId: string) {
  const me = await requireUserId();
  const supabase = await createClient();
  const { data } = await supabase.from("memberships").select("user_id").eq("id", membershipId).eq("venue_id", venueId).single();
  if (!data) return { supabase, error: "That person isn't at this venue." };
  if (data.user_id === me) return { supabase, error: "You can't change your own access. Ask another admin." };
  return { supabase, userId: data.user_id };
}

export async function updateMember(slug: string, membershipId: string, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  const venue = await requireCapability(slug, "users.manage");
  const parsed = memberSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail("Choose a role.");
  const { supabase, error: guard } = await guardNotSelf(membershipId, venue.venueId);
  if (guard) return fail(guard);

  const { error } = await supabase.from("memberships").update(parsed.data).eq("id", membershipId);
  if (error) return fail("Changes weren't saved.");
  revalidatePath(peoplePath(slug), "layout");
  return { ok: true, message: "Saved." };
}

export async function setMemberStatus(
  slug: string, membershipId: string, status: "active" | "suspended", _prev: ActionResult, _form: FormData,
): Promise<ActionResult> {
  const venue = await requireCapability(slug, "users.manage");
  const { supabase, userId, error: guard } = await guardNotSelf(membershipId, venue.venueId);
  if (guard || !userId) return fail(guard ?? "Not found.");

  const { error } = await supabase.from("memberships").update({ status }).eq("id", membershipId);
  if (error) return fail("Access wasn't changed.");

  let message = status === "active" ? "Access restored." : "Access suspended.";
  if (status === "suspended") {
    // Venue data is already blocked by RLS; this also ends their sessions on every device.
    const { error: revokeError } = await supabase.rpc("revoke_user_sessions", { p_user_id: userId });
    message = revokeError ? "Access suspended, but their devices couldn't be signed out." : "Access suspended and signed out on all devices.";
  }
  revalidatePath(peoplePath(slug), "layout");
  return { ok: status === "active" || message.endsWith("all devices."), message };
}

const qualificationSchema = z.object({
  qualification_type_id: uuid,
  number: z.string().trim().max(60).optional(),
  expires_on: optionalDate,
});

export async function addQualification(slug: string, userId: string, _prev: ActionResult, form: FormData): Promise<ActionResult> {
  const venue = await requireCapability(slug, "users.manage");
  const parsed = qualificationSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail("Choose a qualification and a valid expiry date.");
  const supabase = await createClient();
  const { error } = await supabase.from("staff_qualifications").insert({
    venue_id: venue.venueId,
    organisation_id: venue.organisationId,
    user_id: uuid.parse(userId),
    qualification_type_id: parsed.data.qualification_type_id,
    number: parsed.data.number || null,
    expires_on: parsed.data.expires_on,
    source: "manual",
  });
  if (error) return fail("The qualification wasn't saved.");
  revalidatePath(peoplePath(slug), "layout");
  return { ok: true, message: "Qualification added." };
}

export async function archiveQualification(slug: string, qualificationId: string, _prev: ActionResult, _form: FormData): Promise<ActionResult> {
  const venue = await requireCapability(slug, "users.manage");
  const supabase = await createClient();
  const { error } = await supabase.from("staff_qualifications")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", uuid.parse(qualificationId)).eq("venue_id", venue.venueId);
  if (error) return fail("It wasn't removed.");
  revalidatePath(peoplePath(slug), "layout");
  return { ok: true, message: "Removed." };
}
