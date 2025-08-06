'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavDash from '@/components/dashboardnav';
import { User } from '@supabase/supabase-js';
import BusinessTab from '@/components/business-tab';
import WebsiteTab from '@/components/website-tab';
import supabaseClient from '@/app/lib/supabase';
import GuideTab from '@/components/guideoutput';

interface BusinessData {
  businessId: string;
  businessName: string;
  ownerName: string;
  description: string;
  category: 'restaurant' | 'retail' | 'service' | 'other';
  products: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  instagram: string;
  logoUrl: string;
  userId: string;
  createdAt: string;
  websiteUrl?: string;
  websiteGenerated?: boolean;
  subdomain?: string;
}

interface DashboardClientProps {
  id: string;
  businessId: string;
}

export default function DashboardClient({ id, businessId }: DashboardClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'business-info' | 'website' | 'guide'>('business-info');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkUserAndLoadBusiness = async () => {
      try {
        // Check user authentication
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
          router.push('/login');
          return;
        }
        setUser(user);

        // Load business data
        if (businessId) {
          let { data: business, error: businessError } = await supabaseClient
            .from('businesses')
            .select('*')
            .eq('business_id', businessId)
            .single();

          // Transform the database data to match the frontend interface
          if (business) {
            const transformedBusiness = {
              businessId: business.business_id,
              businessName: business.business_name,
              ownerName: business.owner_name,
              description: business.description,
              category: business.category,
              products: business.products,
              phone: business.phone,
              email: business.email,
              address: business.address,
              whatsapp: business.whatsapp,
              instagram: business.instagram,
              logoUrl: business.logo_url,
              userId: user.id,
              createdAt: business.created_at,
              websiteUrl: business.website_url,
              websiteGenerated: !!business.website_url,
              subdomain: business.subdomain
            };

            setBusinessData(transformedBusiness);
          }
        }
      } catch (err) {
        console.error('Error loading business:', err);
        setError('Failed to load business data');
      } finally {
        setLoading(false);
      }
    };

    checkUserAndLoadBusiness();
  }, [businessId, router]);

  const handleCreateMenu = () => {
    router.push(`/${id}/${businessId}/create-menu`);
  };

  const handleViewWebsite = () => {
    if (businessData?.websiteUrl) {
      window.open(businessData.websiteUrl, '_blank');
    }
  };

  const handleGenerateWebsite = () => {
    router.push(`/${id}/${businessId}/generate-website`);
  };

  const handleBusinessUpdate = (updatedData: BusinessData) => {
    setBusinessData(updatedData);
  };

  // Wrapper function to handle WebsiteTab's snake_case data format
  const handleWebsiteUpdate = (updatedData: any) => {
    const transformedData: BusinessData = {
      businessId: updatedData.business_id || updatedData.businessId,
      businessName: updatedData.business_name || updatedData.businessName,
      ownerName: updatedData.owner_name || updatedData.ownerName,
      description: updatedData.description,
      category: updatedData.category,
      products: updatedData.products,
      phone: updatedData.phone,
      email: updatedData.email,
      address: updatedData.address,
      whatsapp: updatedData.whatsapp,
      instagram: updatedData.instagram,
      logoUrl: updatedData.logo_url || updatedData.logoUrl,
      userId: updatedData.user_id || updatedData.userId,
      createdAt: updatedData.createdAt,
      websiteUrl: updatedData.website_url || updatedData.websiteUrl,
      websiteGenerated: updatedData.website_generated || updatedData.websiteGenerated
    };
    setBusinessData(transformedData);
  };

  const handleDeleteBusiness = async () => {
    if (!businessData || !user) return;
    
    setIsDeleting(true);
    try {
      // Get the current session token
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`https://umkm-eight.vercel.app/api/businesses/${businessData.businessId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete business');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete business: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div>
        <NavDash />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
            {businessId && (
              <p className="text-sm text-gray-500 mt-2">Business ID: {businessId}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <NavDash />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600">{error}</p>
            {businessId && (
              <p className="text-sm text-gray-500 mt-2">Business ID: {businessId}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!businessData) {
    return (
      <div>
        <NavDash />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h1>
            <p className="text-gray-600">The business you're looking for doesn't exist.</p>
            {businessId && (
              <p className="text-sm text-gray-500 mt-2">Business ID: {businessId}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavDash />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {businessData.businessName}
                </h1>
                <p className="text-gray-600 mb-4">Business Dashboard</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">Business ID: {businessData.businessId}</span>
                  <span className="text-sm text-gray-500">Owner: {businessData.ownerName}</span>
                </div>
              </div>
              <div className="flex gap-3">
                {businessData.websiteUrl && (
                  <button
                    onClick={handleViewWebsite}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    View Website
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Business
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-lg mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('business-info')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'business-info'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Business Information
                </button>
                <button
                  onClick={() => setActiveTab('website')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'website'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Website
                </button>
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'guide'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Google Business Profile Guide
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'business-info' && (
                <BusinessTab businessData={businessData} onUpdate={handleBusinessUpdate} />
              )}
              {activeTab === 'website' && (
                <WebsiteTab 
                  businessData={{
                    business_id: businessData.businessId,
                    business_name: businessData.businessName,
                    owner_name: businessData.ownerName,
                    description: businessData.description,
                    category: businessData.category,
                    products: businessData.products,
                    phone: businessData.phone,
                    email: businessData.email,
                    address: businessData.address,
                    whatsapp: businessData.whatsapp,
                    instagram: businessData.instagram,
                    logo_url: businessData.logoUrl,
                    user_id: businessData.userId,
                    createdAt: businessData.createdAt,
                    website_url: businessData.websiteUrl,
                    website_generated: businessData.websiteGenerated
                  }} 
                  onUpdate={handleWebsiteUpdate} 
                />
              )}
              {activeTab === 'guide' && (
                <GuideTab businessData={businessData} />
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleCreateMenu}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Menu
            </button>
            
            {businessData.websiteUrl && (
              <button
                onClick={handleViewWebsite}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                View Website
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Business
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{businessData.businessName}"? This action cannot be undone and will permanently remove all business data including any associated website.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBusiness}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
