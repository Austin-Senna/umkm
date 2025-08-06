import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for the server component
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PreviewProps {
  params: {
    webId: string;
  };
}

// Server Component
export default async function PreviewPage({ params }: PreviewProps) {
  // Fetch the website data at build time
  const { data: website, error } = await supabaseClient
    .from('websites')
    .select('html')
    .eq('id', params.webId)
    .single();

  if (error || !website) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Website Not Found</h1>
          <p className="text-gray-600 mt-2">The website preview you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Return the raw HTML as a static preview
  return (
    <div 
      className="preview-container"
      dangerouslySetInnerHTML={{ __html: website.html || 'No preview available' }}
    />
  );
}

// This function is called at build time on the server
export async function generateStaticParams() {
  try {
    // Get all websites from the database
    const { data: websites, error } = await supabaseClient
      .from('websites')
      .select('id');

    if (error) {
      console.error('Error fetching websites for static params:', error);
      return [];
    }

    // Return all possible webId parameters
    return (websites || []).map((website: { id: string }) => ({
      webId: website.id,
    }));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import NavDash from '@/components/dashboardnav'
import supabaseClient from '@/app/lib/supabase'

interface Website {
  id: string
  name: string
  description: string
  category: string
  phone: string
  email: string
  address: string
  user_id: string
  created_at: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  website_id: string
  created_at: string
}

const EditWebsite = () => {
  const router = useRouter()
  const params = useParams()
  const webId = params.webId as string
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    phone: '',
    email: '',
    address: ''
  })
  
  const [products, setProducts] = useState<Product[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showProductForm, setShowProductForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    imageFile: null
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabaseClient.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        setUser(user)
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchWebsiteData = async () => {
      if (!user || !webId) return
      
      try {
        setLoading(true)
        setError(null)

        const { data: websiteData, error: websiteError } = await supabaseClient
          .from('websiteforms')
          .select('*')
          .eq('id', webId)
          .single()

        if (websiteError) {
          throw new Error(`Website not found: ${websiteError.message}`)
        }

        if (websiteData.user_id !== user.id) {
          throw new Error('You do not have permission to edit this website')
        }

        setFormData({
          name: websiteData.name,
          category: websiteData.category,
          description: websiteData.description,
          phone: websiteData.phone,
          email: websiteData.email,
          address: websiteData.address
        })

        const { data: productsData, error: productsError } = await supabaseClient
          .from('products')
          .select('*')
          .eq('website_id', webId)
          .order('created_at', { ascending: true })

        if (productsError) {
          console.error('Error fetching products:', productsError)
        } else {
          setProducts(productsData || [])
        }

      } catch (error) {
        console.error('Error fetching website data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load website data')
      } finally {
        setLoading(false)
      }
    }

    fetchWebsiteData()
  }, [user, webId])

  const handleSave = async () => {
    if (!user || !webId) return

    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields (Name, Email, Phone)')
      return
    }

    setSaving(true)
    
    try {
      const { error: updateError } = await supabaseClient
        .from('websiteforms')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          phone: formData.phone,
          email: formData.email,
          address: formData.address
        })
        .eq('id', webId)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      alert('Website updated successfully!')
      
    } catch (error) {
      console.error('Error updating website:', error)
      alert('Error updating website. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setNewProduct({...newProduct, image: imageUrl, imageFile: file})
    }
  }

  const uploadImageToSupabase = async (file, filename) => {
    try {
      const { data, error } = await supabaseClient.storage
        .from('productimages')
        .upload(filename, file)
      
      if (error) throw error
      
      const { data: { publicUrl } } = supabaseClient.storage
        .from('productimages')
        .getPublicUrl(filename)
      
      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Please fill in product name and price')
      return
    }

    try {
      let imageUrl = ''
      
      if (newProduct.imageFile) {
        const filename = `${Date.now()}-${newProduct.imageFile.name}`
        imageUrl = await uploadImageToSupabase(newProduct.imageFile, filename)
      }
      
      const { data, error } = await supabaseClient
        .from('products')
        .insert({
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          image_url: imageUrl,
          website_id: webId
        })
        .select()
        .single()

      if (error) throw error

      setProducts([...products, data])
      setNewProduct({ name: '', price: '', description: '', image: '', imageFile: null })
      setShowProductForm(false)
      
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Error adding product. Please try again.')
    }
  }

  const removeProduct = async (productId) => {
    try {
      const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('website_id', webId)

      if (error) throw error

      setProducts(products.filter(product => product.id !== productId))
      
    } catch (error) {
      console.error('Error removing product:', error)
      alert('Error removing product. Please try again.')
    }
  }

  if (loading) {
    return (
      <div>
        <NavDash />
        <div className="section px-15 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-button mx-auto mb-4"></div>
            <p className="text-gray-600 font-inter">Loading website data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <NavDash />
        <div className="section px-15">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-red-800 font-mont font-bold text-xl mb-2">Error</h2>
            <p className="text-red-600 font-inter">{error}</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 bg-button text-white px-4 py-2 rounded-lg font-inter hover:bg-black transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <NavDash />
      <div className="section px-15">
        <div className="flex items-center justify-between mb-6">
          <h1 className='font-mont font-bold text-3xl'>Edit Website</h1>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className='bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors'
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className='bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500 transition-colors'
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Edit Form */}
          <div>
            <div className="form flex flex-col gap-3 mb-8">
              <div className="flex flex-col gap-1 font-inter">
                <h3 className='text-sm'>Name *</h3>
                <input 
                  className='bg-white px-2 text-xs border-[1.6] w-full h-[2rem] border-stroke rounded-sm outline-none' 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1 font-inter">
                <h3 className='text-sm'>Category</h3>
                <input 
                  className='bg-white px-2 text-xs border-[1.6] w-full h-[2rem] border-stroke rounded-sm outline-none' 
                  type="text" 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1 font-inter">
                <h3 className='text-sm'>Description</h3>
                <textarea 
                  className='bg-white px-2 py-2 text-xs border-[1.6] w-full h-[4rem] border-stroke rounded-sm outline-none'
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex flex-col gap-1 font-inter">
                <h3 className='text-sm'>Phone *</h3>
                <input 
                  className='bg-white px-2 text-xs border-[1.6] w-full h-[2rem] border-stroke rounded-sm outline-none' 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1 font-inter">
                <h3 className='text-sm'>Email *</h3>
                <input 
                  className='bg-white px-2 text-xs border-[1.6] w-full h-[2rem] border-stroke rounded-sm outline-none' 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1 font-inter">
                <h3 className='text-sm'>Address</h3>
                <input 
                  className='bg-white px-2 text-xs border-[1.6] w-full h-[2rem] border-stroke rounded-sm outline-none' 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            {/* Products Section */}
            <div className="products-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className='font-mont font-bold text-2xl'>Products</h2>
                <button 
                  onClick={() => setShowProductForm(!showProductForm)} 
                  className='bg-button text-white px-4 py-2 rounded-lg text-sm hover:bg-black transition-colors'
                >
                  {showProductForm ? 'Cancel' : 'Add Product'}
                </button>
              </div>

              {showProductForm && (
                <div className="product-form bg-[#E9E4DA] p-4 rounded-xl mb-4">
                  <h3 className='font-mont font-bold mb-3 text-lg'>Add New Product</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 font-inter">
                      <h4 className='text-sm'>Product Name</h4>
                      <input 
                        className='bg-white px-2 text-xs border-[1.6] h-[2rem] border-stroke rounded-sm outline-none' 
                        type="text" 
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1 font-inter">
                      <h4 className='text-sm'>Price</h4>
                      <input 
                        className='bg-white px-2 text-xs border-[1.6] h-[2rem] border-stroke rounded-sm outline-none' 
                        type="number" 
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1 font-inter">
                      <h4 className='text-sm'>Description</h4>
                      <textarea 
                        className='bg-white px-2 py-2 text-xs border-[1.6] h-[3rem] border-stroke rounded-sm outline-none'
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      ></textarea>
                    </div>
                    <div className="flex flex-col gap-1 font-inter">
                      <h4 className='text-sm'>Product Image</h4>
                      <input 
                        className='text-xs h-[2rem] rounded-sm outline-none file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-button file:text-white file:cursor-pointer file:hover:bg-opacity-80' 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      {newProduct.image && (
                        <img src={newProduct.image} alt="Preview" className="w-16 h-16 object-cover rounded mt-2" />
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={addProduct} 
                    className='bg-button text-white px-4 py-2 rounded-lg text-sm mt-3 hover:bg-black transition-colors'
                  >
                    Add Product
                  </button>
                </div>
              )}

              <div className="products-list">
                {products.length === 0 ? (
                  <p className='text-gray-500 text-sm font-inter'>No products added yet.</p>
                ) : (
                  <div className="grid gap-3">
                    {products.map((product) => (
                      <div key={product.id} className="product-item bg-[#E9E4DA] border-[1.6] border-stroke rounded-xl p-4 flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                          {product.image_url && (
                            <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <h4 className='font-inter font-semibold text-sm'>{product.name}</h4>
                            <p className='text-button font-bold text-sm'>${product.price}</p>
                            {product.description && (
                              <p className='text-gray-600 text-xs mt-1'>{product.description}</p>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => removeProduct(product.id)} 
                          className='text-red-500 hover:text-red-700 text-xs font-inter px-2 py-1 hover:bg-red-50 rounded transition-colors'
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="submit-section mt-8 mb-8">
              <button 
                onClick={handleSave}
                disabled={saving}
                className='bg-button text-white px-8 py-3 rounded-lg font-mont font-semibold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="preview-section">
              <h2 className='font-mont font-bold text-2xl mb-4'>Website Preview</h2>
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="bg-gradient-to-r from-button to-black text-white p-6 rounded-lg mb-6">
                  <h3 className="font-mont font-bold text-2xl">{formData.name || 'Your Business Name'}</h3>
                  <p className="text-gray-100">{formData.category || 'Business Category'}</p>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 font-inter">{formData.description || 'Your business description will appear here...'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <strong>Email:</strong> {formData.email || 'your@email.com'}
                  </div>
                  <div>
                    <strong>Phone:</strong> {formData.phone || 'Your phone number'}
                  </div>
                  <div className="md:col-span-2">
                    <strong>Address:</strong> {formData.address || 'Your business address'}
                  </div>
                </div>
                
                {products.length > 0 && (
                  <div>
                    <h4 className="font-mont font-bold text-lg mb-3">Products</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {products.slice(0, 4).map((product) => (
                        <div key={product.id} className="bg-gray-50 p-3 rounded">
                          {product.image_url && (
                            <img src={product.image_url} alt={product.name} className="w-full h-20 object-cover rounded mb-2" />
                          )}
                          <h5 className="font-semibold text-xs">{product.name}</h5>
                          <p className="text-button font-bold text-sm">${product.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 text-center text-xs text-gray-500">
                  <p>🔗 This is a preview of how your website will look</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditWebsite