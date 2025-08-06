export interface Menu {
  id: string;
  businessId: string;
  name: string;
  sections: MenuItem[];
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  products: Product[];
}

export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  imageUrl?: string;
}

export interface BusinessData {
  id: string;
  status?:string;
  business_id: string;
  business_name: string;
  owner_name: string;
  description: string;
  category: 'restaurant' | 'retail' | 'service' | 'other';
  products: string;
  subdomain?: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  instagram: string;
  logo_url: string;
  user_id: string;
  created_at: string;
  website_url?: string;
  deployed_at?: string;
  menu_url?: string;
}

export interface MenuCreatorClientProps {
  id: string;
  businessId: string;
}
