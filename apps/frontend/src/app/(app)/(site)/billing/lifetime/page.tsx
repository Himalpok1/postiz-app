import { LifetimeDeal } from '@gitroom/frontend/components/billing/lifetime.deal';
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
export const metadata: Metadata = {
  title: `Castrapid Lifetime deal`,
  description: '',
};
export default async function Page() {
  // Billing calls Stripe, and with no keys its 401 would sign the person out.
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    return redirect('/launches');
  }
  return <LifetimeDeal />;
}
