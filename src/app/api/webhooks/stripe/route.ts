import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { isStripeWebhookConfigured } from "@/lib/saas/config";
import { downgradeToFree, syncSubscription } from "@/lib/saas/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function userIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined
): string | null {
  return metadata?.clerk_user_id ?? null;
}

export async function POST(request: Request) {
  if (!isStripeWebhookConfigured()) {
    return NextResponse.json(
      { ok: false, error: "stripe_webhook_not_configured" },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET as string;
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { ok: false, error: "missing_signature" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      secret
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId =
          session.client_reference_id ?? userIdFromMetadata(session.metadata);
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (userId && subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(userId, sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = userIdFromMetadata(sub.metadata);
        if (userId) await syncSubscription(userId, sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = userIdFromMetadata(sub.metadata);
        if (userId) await downgradeToFree(userId);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(
      "[api/webhooks/stripe]",
      event.type,
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ ok: false, error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, received: true });
}
