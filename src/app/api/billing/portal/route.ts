import { NextResponse } from "next/server";
import { getAuthIdentity } from "@/lib/auth/current-user";
import { getStripe } from "@/lib/billing/stripe";
import { getAppUser } from "@/lib/saas/app-users";
import { getAppUrl, isStripeConfigured } from "@/lib/saas/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { ok: false, error: "billing_not_configured" },
      { status: 503 }
    );
  }

  const identity = await getAuthIdentity();
  if (!identity) {
    return NextResponse.json(
      { ok: false, error: "auth_required" },
      { status: 401 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: "billing_not_configured" },
      { status: 503 }
    );
  }

  const appUser = await getAppUser(identity.userId);
  if (!appUser?.stripe_customer_id) {
    return NextResponse.json(
      { ok: false, error: "no_stripe_customer" },
      { status: 400 }
    );
  }

  let locale = "en";
  try {
    const body = (await request.json()) as { locale?: string };
    if (body?.locale === "zh" || body?.locale === "en") locale = body.locale;
  } catch {
    /* no body is fine */
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: appUser.stripe_customer_id,
      return_url: `${getAppUrl()}/${locale}/account/billing`,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error(
      "[api/billing/portal]",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { ok: false, error: "portal_failed" },
      { status: 500 }
    );
  }
}
