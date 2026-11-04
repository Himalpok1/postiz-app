export const dynamic = 'force-dynamic';
import { BillingComponent } from '@gitroom/frontend/components/billing/billing.component';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
export const metadata: Metadata = {
  title: `Castrapid Billing`,
  description: '',
};
export default async function Page() {
  // Billing calls Stripe, and with no keys its 401 would sign the person out.
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    return redirect('/launches');
  }
  return (
    <div className="bg-newBgColorInner flex-1 flex-col flex p-[20px] gap-[12px]">
      <BillingComponent />
    </div>
  );
}
