import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { deleteAppUser, ensureAppUser } from "@/lib/saas/app-users";
import { isClerkWebhookConfigured } from "@/lib/saas/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserData {
  id: string;
  primary_email_address_id?: string | null;
  email_addresses?: ClerkEmailAddress[];
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData;
}

function primaryEmail(data: ClerkUserData): string | null {
  const list = data.email_addresses ?? [];
  if (data.primary_email_address_id) {
    const match = list.find((e) => e.id === data.primary_email_address_id);
    if (match) return match.email_address;
  }
  return list[0]?.email_address ?? null;
}

export async function POST(request: Request) {
  if (!isClerkWebhookConfigured()) {
    return NextResponse.json(
      { ok: false, error: "clerk_webhook_not_configured" },
      { status: 503 }
    );
  }

  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET as string;
  const payload = await request.text();

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { ok: false, error: "missing_svix_headers" },
      { status: 400 }
    );
  }

  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_signature" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "user.created":
    case "user.updated":
      await ensureAppUser(event.data.id, primaryEmail(event.data));
      break;
    case "user.deleted":
      if (event.data.id) await deleteAppUser(event.data.id);
      break;
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
