'use client';

import { useEffect, useState } from 'react';
import LogoGenerator from '@/components/LogoGenerator';
import { getBusinessInfoNeo } from '@/lib/api';
import supabaseClient from '@/app/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface BusinessInfo {
  id: string;
  businessName: string;
  ownerName: string;
  description: string;
  category: string;
  products: string;
  phone: string;
  email?: string;
  address: string;
  whatsapp?: string;
  instagram?: string;
  logoUrl?: string;
  websiteUrl?: string;
  subdomain: string;
  status: string;
  createdAt: number;
  deployedAt?: number;
}

interface LogoGeneratorClientProps {
  id: string;
  businessId: string;
}

export default function LogoGeneratorClient({ id, businessId }: LogoGeneratorClientProps) {
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const businessInfo = await getBusinessInfoNeo(businessId);
        setBusiness(businessInfo);
      } catch (err) {
        console.error('Error loading business:', err);
        setError(err instanceof Error ? err.message : 'Failed to load business');
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [businessId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-red-600 text-xl">Error: {error || 'Business not found'}</div>
        <Button variant="outline" asChild>
          <Link href={`/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-5xl">
        <Button variant="outline" asChild className="mb-6">
          <Link href={`/${id}/${businessId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Business
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Logo Generator</CardTitle>
            <CardDescription>
              Generate a unique logo for {business.businessName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogoGenerator 
              businessInfo={business}
              businessId={businessId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
