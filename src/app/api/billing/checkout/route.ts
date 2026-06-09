import { NextResponse } from "next/server";
import { getAuthIdentity } from "@/lib/auth/current-user";
import { getStripe, proPriceId } from "@/lib/billing/stripe";
import { ensureAppUser, getAppUser } from "@/lib/saas/app-users";
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
  const priceId = proPriceId();
  if (!stripe || !priceId) {
    return NextResponse.json(
      { ok: false, error: "billing_not_configured" },
      { status: 503 }
    );
  }

  const { userId, email } = identity;
  await ensureAppUser(userId, email);
  const appUser = await getAppUser(userId);

  let locale = "en";
  try {
    const body = (await request.json()) as { locale?: string };
    if (body?.locale === "zh" || body?.locale === "en") locale = body.locale;
  } catch {
    /* no body is fine */
  }

  const appUrl = getAppUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      ...(appUser?.stripe_customer_id
        ? { customer: appUser.stripe_customer_id }
        : email
          ? { customer_email: email }
          : {}),
      subscription_data: { metadata: { clerk_user_id: userId } },
      metadata: { clerk_user_id: userId },
      allow_promotion_codes: true,
      success_url: `${appUrl}/${locale}/account/billing?status=success`,
      cancel_url: `${appUrl}/${locale}/pricing?status=cancelled`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error(
      "[api/billing/checkout]",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { ok: false, error: "checkout_failed" },
      { status: 500 }
    );
  }
}
