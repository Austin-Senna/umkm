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
          
          setMenuItems(convertedMenuItems);
          setProducts(prev => prev.filter(p => !usedProductIds.includes(p.id)));
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessData) {
      console.log('Business data updated:', businessData);
      // If there's a menu URL, log it
      if (businessData.menu_url) {
        console.log('Existing menu URL:', businessData.menu_url);
      }
    }
  }, [businessData]);

  const handleDragStart = (e: React.DragEvent, product: Product) => {
    setDraggedProduct(product);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetMenuItemId: string) => {
    e.preventDefault();
    
    if (!draggedProduct) return;

    setMenuItems(prev => prev.map(item => {
      if (item.id === targetMenuItemId) {
        const productExists = item.products.some(p => p.id === draggedProduct.id);
        if (!productExists) {
          return {
            ...item,
            products: [...item.products, draggedProduct]
          };
        }
      }
      return item;
    }));

    setProducts(prev => prev.filter(p => p.id !== draggedProduct.id));
    setDraggedProduct(null);
  };

  const addMenuItem = () => {
    if (!newMenuItemName.trim()) return;
    
    const newMenuItem: MenuItem = {
      id: `menu-${Date.now()}`,
      name: newMenuItemName.trim(),
      products: []
    };
    
    setMenuItems(prev => [...prev, newMenuItem]);
    setNewMenuItemName('');
  };

  const removeMenuItem = (menuItemId: string) => {
    const menuItem = menuItems.find(item => item.id === menuItemId);
    if (menuItem) {
      setProducts(prev => [...prev, ...menuItem.products]);
    }
    
    setMenuItems(prev => prev.filter(item => item.id !== menuItemId));
  };

  const removeProductFromMenuItem = (menuItemId: string, productId: string) => {
    setMenuItems(prev => prev.map(item => {
      if (item.id === menuItemId) {
        const product = item.products.find(p => p.id === productId);
        if (product) {
          setProducts(prevProducts => [...prevProducts, product]);
        }
        return {
          ...item,
          products: item.products.filter(p => p.id !== productId)
        };
      }
      return item;
    }));
  };

  // const saveMenu = async () => {

  //   if (!businessData || !menuName.trim() || menuItems.length === 0) {
  //     alert('Please provide a menu name and add at least one section with products');
  //     return;
  //   }

  //   setSaving(true);
  //   try {
  //     // Create submenus dictionary with product IDs
  //     const submenus: { [key: string]: string[] } = {};
  //     menuItems.forEach(menuItem => {
  //       submenus[menuItem.name] = menuItem.products.map(product => product.id);
  //     });

  //     const menuData = {
  //       id: `${businessData.business_id}-${menuName.trim()}`,
  //       businessId: businessData.business_id,
  //       name: menuName.trim(),
  //       submenus: submenus,
  //       updated_at: new Date().toISOString()
  //     };

  //     if (existingMenu) {
  //       // Update existing menu
  //       const { error } = await supabaseClient
  //         .from('menus')
  //         .update(menuData)
  //         .eq('id', existingMenu.id);

  //       if (error) throw error;
  //     } else {
  //       // Create new menu
  //       const { error } = await supabaseClient
  //         .from('menus')
  //         .insert({
  //           ...menuData,
  //           created_at: new Date().toISOString()
  //         });

  //       if (error) throw error;
  //     }

  //     alert('Menu saved successfully!');
  //     router.push(`/${businessData.user_id}/${businessData.business_id}`);
  //   } catch (error) {
  //     console.error('Error saving menu:', error);
  //     alert('Error saving menu. Please try again.');
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const generateMenuHTML = () => {
    if (!businessData) return '';

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessData.business_name} - Menu</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            display: flex;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            display : flex;
            text-align: center;
            background: rgba(255, 255, 255, 0.95);
            padding: 40px 20px;
            border-radius: 20px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            font-size: 2.5rem;
            color: #2d3748;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.1rem;
            color: #718096;
            margin-bottom: 20px;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #4a5568;
        }
        
        .menu-grid {
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
        }
        
        .menu-section {
            display: flex;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            flex-direction: column;
        }
        
        .menu-section h2 {
            font-size: 1.8rem;
            color: #2d3748;
            margin-bottom: 25px;
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .menu-item {
            display: flex;
            gap: 15px;
            margin-bottom: 25px;
            padding: 15px;
            border-radius: 15px;
            background: #f7fafc;
            transition: transform 0.2s ease;
        }
        
        .menu-item-image {
            display: flex;
            width: 80px;
            height: 80px;
            border-radius: 10px;
            object-fit: cover;
            flex-shrink: 0;
        }
        
        .menu-item-content {
            display: flex;
            flex: 1;
        }
        
        .menu-item-name {
            display:flex;
            font-size: 1.2rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 5px;
        }
        
        .menu-item-description {
            display:flex;
            color: #718096;
            font-size: 0.9rem;
            margin-bottom: 8px;
        }
        
        .menu-item-price {
            display:flex;
            font-size: 1.1rem;
            font-weight: 700;
            color: #667eea;
        }
        
        .footer {
            display:flex;
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .footer p {
            color: #718096;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .container {
                display:flex;
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            
            .contact-info {
                display:flex;
                flex-direction: column;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${businessData.business_name}</h1>
            <p>${businessData.description}</p>
            <div class="contact-info">
                ${businessData.phone ? `<div class="contact-item">📞 ${businessData.phone}</div>` : ''}
                ${businessData.address ? `<div class="contact-item">📍 ${businessData.address}</div>` : ''}
                ${businessData.whatsapp ? `<div class="contact-item">💬 ${businessData.whatsapp}</div>` : ''}
            </div>
            
        </div>
        
        <div class="menu-grid">`;

    menuItems.forEach(menuItem => {
      html += `
            <div class="menu-section">
                <h2>${menuItem.name}</h2>`;
      
      menuItem.products.forEach(product => {
        html += `
                <div class="menu-item">
                    ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}" class="menu-item-image">` : ''}
                    <div class="menu-item-content">
                        <div class="menu-item-name">${product.name}</div>
                        ${product.description ? `<div class="menu-item-description">${product.description}</div>` : ''}
                        <div class="menu-item-price">Rp ${parseFloat(product.price).toLocaleString()}</div>
                    </div>
                </div>`;
      });
      
      html += `
            </div>`;
    });

    html += `
        </div>
        
        <div class="footer">
            <p>© 2024 ${businessData.business_name}. All rights reserved.</p>
            <p>© 2024 ${businessData.business_name}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    return html;
  };

  const downloadMenu = async () => {
    if (!businessData) return;
    
    try {
      const html = generateMenuHTML();
      
      // First, generate the menu image using EdgeOne API
      const response = await fetch('https://umkm-eight.vercel.app/api/generate-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: html,
          businessId: businessData.business_id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate menu image');
      }

      const { imageUrl } = await response.json();

      // Update the business record with the menu URL
      const { error: updateError } = await supabaseClient
        .from('businesses')
        .update({
          menu_url: imageUrl
        })
        .eq('business_id', businessData.business_id);

      if (updateError) {
        throw updateError;
      }

      // Trigger a download of the HTML as well
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${businessData.business_name}-menu.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Menu has been generated and saved successfully!');
    } 
      catch(error) {
        console.error(error);
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Business Not Found</h1>
          <p className="text-gray-600">The business you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Menu</h1>
          <p className="text-gray-600">Organize your products into a beautiful menu for {businessData.business_name}</p>
        </div>

        {/* Menu Name Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Information</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="Enter menu name (e.g., Main Menu, Lunch Menu, etc.)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Products */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Products</h2>
            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No products available. Add products in the business dashboard first.</p>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, product)}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 transition-colors"
                  >
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{product.name}</h3>
                      <p className="text-gray-600 text-xs">{product.description}</p>
                      <p className="text-indigo-600 font-bold text-sm">
                        Rp {parseFloat(product.price).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-gray-400 text-xs">Drag to menu</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Menu Sections */}
          <div className="space-y-6">
            {/* Add New Menu Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Menu Section</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMenuItemName}
                  onChange={(e) => setNewMenuItemName(e.target.value)}
                  placeholder="Enter menu section name (e.g., Appetizers, Main Course)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={addMenuItem}
                  disabled={!newMenuItemName.trim()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Section
                </button>
              </div>
            </div>

            {/* Menu Sections */}
            {menuItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Sections</h2>
                <p className="text-gray-500 text-center py-8">
                  Create menu sections above and drag products from the left to organize your menu.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {menuItems.map((menuItem) => (
                  <div
                    key={menuItem.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, menuItem.id)}
                    className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{menuItem.name}</h3>
                      <button
                        onClick={() => removeMenuItem(menuItem.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove Section
                      </button>
                    </div>
                    
                    {menuItem.products.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Drop products here from the left panel
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {menuItem.products.map((product) => (
                          <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            {product.imageUrl && (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{product.name}</h4>
                              <p className="text-gray-600 text-xs">{product.description}</p>
                              <p className="text-indigo-600 font-bold text-sm">
                                Rp {parseFloat(product.price).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => removeProductFromMenuItem(menuItem.id, product.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {menuItems.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            {/* <button
              onClick={saveMenu}
              disabled={saving || !menuName.trim()}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Menu'}
            </button> */}
            <button
              onClick={downloadMenu}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Download Menu HTML
            </button>
          </div>
        )}

        <button
          onClick={()=> router.push(`/${businessData.user_id}/${businessData.business_id}`)}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-900 transition-colors text-lg font-medium"
          >
          Back to Dashboard
          </button>
        
      </div>
    </div>
  );
} 