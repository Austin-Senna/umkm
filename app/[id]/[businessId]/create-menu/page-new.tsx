import supabaseClient from '@/app/lib/supabase';
import MenuCreatorClient from './menu-creator-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Create Menu',
  description: 'Create and manage your business menu',
};

export default async function MenuCreatorPage({ params }: { params: { id: string; businessId: string } }) {
  return (
    <div>
      <MenuCreatorClient id={params.id} businessId={params.businessId} />
    </div>
  );
}

export async function generateStaticParams() {
  const { data: businesses } = await supabaseClient
    .from('businesses')
    .select('business_id, user_id');
  
  if (!businesses) return [];

  return businesses.map((business) => ({
    id: business.user_id,
    businessId: business.business_id,
  }));
}
