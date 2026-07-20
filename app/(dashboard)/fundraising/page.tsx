import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import type { Donation, FundraisingContact } from '@/types/fundraising';
import { FundraisingDashboard, type DonationListItem } from '@/components/fundraising/FundraisingDashboard';

type DonationRow = Donation & {
  fundraising_contacts: { name: string } | { name: string }[] | null;
};

function decodeRoleId(accessToken: string) {
  const payload = accessToken.split('.')[1];
  if (!payload) return 1;
  const parsed = JSON.parse(atob(payload)) as unknown;
  if (!parsed || typeof parsed !== 'object' || !('org_role_id' in parsed)) return 1;
  return Number(parsed.org_role_id);
}

export default async function FundraisingPage() {
  const cookieStore = await cookies();
  const year = new Date().getFullYear();
  const goalKey = `fundraising_goal_${year}`;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          return;
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const [donationsResult, contactsResult, goalResult] = await Promise.all([
    supabase
      .from('donations')
      .select('*, fundraising_contacts(name)')
      .order('donated_at', { ascending: false }),
    supabase.from('fundraising_contacts').select('*').order('name', { ascending: true }),
    supabase.from('org_settings').select('value').eq('key', goalKey).maybeSingle(),
  ]);

  const donations = ((donationsResult.data ?? []) as DonationRow[]).map<DonationListItem>((donation) => {
    const contact = Array.isArray(donation.fundraising_contacts)
      ? donation.fundraising_contacts[0]
      : donation.fundraising_contacts;

    return {
      donation_id: donation.donation_id,
      contact_id: donation.contact_id,
      donor_name: contact?.name ?? null,
      amount: donation.amount,
      donated_at: donation.donated_at,
      notes: donation.notes,
      recorded_by: donation.recorded_by,
      created_at: donation.created_at,
    };
  });

  const totalRaised = donations.reduce((total, donation) => total + donation.amount, 0);
  const parsedGoal = Number(goalResult.data?.value ?? '');
  const goal = Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : null;

  return (
    <FundraisingDashboard
      donations={donations}
      contacts={(contactsResult.data ?? []) as FundraisingContact[]}
      totalRaised={totalRaised}
      goal={goal}
      isBoard={decodeRoleId(session.access_token) === 3}
      year={year}
    />
  );
}
