'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabaseClient from '@/app/lib/supabase';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h4: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
      textarea: React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;
    }
  }
}

type HTMLInputEvent = React.ChangeEvent<HTMLInputElement>;
type HTMLTextAreaEvent = React.ChangeEvent<HTMLTextAreaElement>;
type HTMLDragEvent = React.DragEvent<HTMLDivElement>;

interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  imageUrl?: string;
}

interface MenuItem {
  id: string;
  name: string;
  products: Product[];
}

interface Menu {
  id: string;
  businessId: string;
  name: string;
  sections: MenuItem[];
  created_at: string;
  updated_at: string;
}

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
  menu_url?: string;
}

interface MenuCreatorClientProps {
  id: string;
  businessId: string;
}

export default function MenuCreatorClient({ id, businessId }: MenuCreatorClientProps) {
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newSectionName, setNewSectionName] = useState('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');

  // Product form state
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<Product>({
    id: '',
    name: '',
    price: '',
    description: '',
  });
  const [showAddProductForm, setShowAddProductForm] = useState(false);

  useEffect(() => {
    const loadBusinessAndMenu = async () => {
      try {
        // Load business data
        const { data: business, error: businessError } = await supabaseClient
          .from('businesses')
          .select('*')
          .eq('business_id', businessId)
          .single();

        if (businessError) throw businessError;

        if (business) {
          setBusiness({
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
            userId: business.user_id,
            createdAt: business.created_at,
            websiteUrl: business.website_url,
            websiteGenerated: !!business.website_url,
            menu_url: business.menu_url
          });

          // Load menu data
          const { data: menu, error: menuError } = await supabaseClient
            .from('menus')
            .select('*')
            .eq('business_id', business.business_id)
            .single();

          if (!menuError && menu) {
            setMenu(menu);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load business or menu data');
      } finally {
        setLoading(false);
      }
    };

    loadBusinessAndMenu();
  }, [businessId]);

  const addSection = async () => {
    if (!newSectionName || !menu) return;

    const newSection: MenuItem = {
      id: `section-${Date.now()}`,
      name: newSectionName,
      products: []
    };

    const updatedSections = [...menu.sections, newSection];
    
    try {
      const { error } = await supabaseClient
        .from('menus')
        .update({ 
          sections: updatedSections,
          updated_at: new Date().toISOString()
        })
        .eq('id', menu.id);

      if (error) throw error;

      setMenu({
        ...menu,
        sections: updatedSections,
        updated_at: new Date().toISOString()
      });
      setNewSectionName('');
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to add section');
    }
  };

  const saveEditedSection = async () => {
    if (!editingSection || !editingSectionName || !menu) return;

    const updatedSections = menu.sections.map((section: MenuItem) => 
      section.id === editingSection 
        ? { ...section, name: editingSectionName }
        : section
    );

    try {
      const { error } = await supabaseClient
        .from('menus')
        .update({ 
          sections: updatedSections,
          updated_at: new Date().toISOString()
        })
        .eq('id', menu.id);

      if (error) throw error;

      setMenu({
        ...menu,
        sections: updatedSections,
        updated_at: new Date().toISOString()
      });
      setEditingSection(null);
      setEditingSectionName('');
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Failed to update section');
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!menu) return;

    if (!confirm('Are you sure you want to delete this section and all its products?')) {
      return;
    }

    const updatedSections = menu.sections.filter((section: MenuItem) => section.id !== sectionId);

    try {
      const { error } = await supabaseClient
        .from('menus')
        .update({ 
          sections: updatedSections,
          updated_at: new Date().toISOString()
        })
        .eq('id', menu.id);

      if (error) throw error;

      setMenu({
        ...menu,
        sections: updatedSections,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const addProduct = async () => {
    if (!selectedSection || !menu) return;

    const section = menu.sections.find((s: MenuItem) => s.id === selectedSection);
    if (!section) return;

    const productWithId: Product = {
      ...newProduct,
      id: `product-${Date.now()}`
    };

    const updatedSections = menu.sections.map((s: MenuItem) =>
      s.id === selectedSection
        ? { ...s, products: [...s.products, productWithId] }
        : s
    );

    try {
      const { error } = await supabaseClient
        .from('menus')
        .update({ 
          sections: updatedSections,
          updated_at: new Date().toISOString()
        })
        .eq('id', menu.id);

      if (error) throw error;

      setMenu({
        ...menu,
        sections: updatedSections,
        updated_at: new Date().toISOString()
      });
      setNewProduct({ id: '', name: '', price: '', description: '' });
      setShowAddProductForm(false);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    }
  };

  const deleteProduct = async (sectionId: string, productId: string) => {
    if (!menu) return;

    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    const updatedSections = menu.sections.map((section: MenuItem) =>
      section.id === sectionId
        ? { ...section, products: section.products.filter((p: Product) => p.id !== productId) }
        : section
    );

    try {
      const { error } = await supabaseClient
        .from('menus')
        .update({ 
          sections: updatedSections,
          updated_at: new Date().toISOString()
        })
        .eq('id', menu.id);

      if (error) throw error;

      setMenu({
        ...menu,
        sections: updatedSections,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Business not found'}</p>
        </div>
      </div>
    );
  }

  // Create initial menu if none exists
  if (!menu) {
    const createNewMenu = async () => {
      try {
        const newMenu: Menu = {
          id: `menu-${Date.now()}`,
          businessId: business.businessId,
          name: `${business.businessName}'s Menu`,
          sections: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabaseClient
          .from('menus')
          .insert([newMenu]);

        if (error) throw error;

        setMenu(newMenu);
      } catch (error) {
        console.error('Error creating menu:', error);
        setError('Failed to create menu');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Create Menu</h1>
          <p className="text-gray-600 mb-6">No menu found for {business.businessName}</p>
          <button
            onClick={createNewMenu}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{menu.name}</h1>
          <p className="text-gray-600">Last updated: {new Date(menu.updated_at).toLocaleString()}</p>
        </div>

        {/* Add Section Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Menu Section</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newSectionName}
              onChange={(e: HTMLInputEvent) => setNewSectionName(e.target.value)}
              placeholder="Enter section name (e.g., Appetizers, Main Course)"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addSection}
              disabled={!newSectionName}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Add Section
            </button>
          </div>
        </div>

        {/* Menu Sections */}
        {menu.sections.map((section: MenuItem) => (
          <div key={section.id} className="bg-white rounded-lg shadow-lg p-6 mb-8">
            {editingSection === section.id ? (
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={editingSectionName}
                  onChange={(e: HTMLInputEvent) => setEditingSectionName(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={saveEditedSection}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingSection(null);
                    setEditingSectionName('');
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{section.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingSection(section.id);
                      setEditingSectionName(section.name);
                    }}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Products List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {section.products.map((product: Product) => (
                <div
                  key={product.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.description}</p>
                    </div>
                    <button
                      onClick={() => deleteProduct(section.id, product.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold text-gray-900">{product.price}</p>
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Product Button */}
            {selectedSection === section.id && showAddProductForm ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e: HTMLInputEvent) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Product name"
                    className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={newProduct.price}
                    onChange={(e: HTMLInputEvent) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="Price"
                    className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    value={newProduct.description}
                    onChange={(e: HTMLTextAreaEvent) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Description"
                    className="md:col-span-2 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowAddProductForm(false);
                      setSelectedSection(null);
                      setNewProduct({ id: '', name: '', price: '', description: '' });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addProduct}
                    disabled={!newProduct.name || !newProduct.price}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSelectedSection(section.id);
                  setShowAddProductForm(true);
                }}
                className="text-indigo-600 hover:text-indigo-700"
              >
                + Add Product
              </button>
            )}
          </div>
        ))}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => router.push(`/${id}/${businessId}`)}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Business
          </button>
        </div>
      </div>
    </div>
  );
}
