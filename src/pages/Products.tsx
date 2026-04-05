import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Package, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  status: 'available' | 'out_of_stock';
}

interface CompanyProfile {
  phone: string;
}

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyPhone, setCompanyPhone] = useState('11999999999');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Company Profile for phone number
        const companyDoc = await getDoc(doc(db, 'settings', 'companyProfile'));
        if (companyDoc.exists()) {
          const data = companyDoc.data() as CompanyProfile;
          if (data.phone) {
            setCompanyPhone(data.phone.replace(/\D/g, ''));
          }
        }

        // Fetch Products
        const q = query(
          collection(db, 'products'),
          where('status', '==', 'available')
        );
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        productsData.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBuy = async (product: Product) => {
    if (user) {
      try {
        // Register the order intent in Firestore
        await addDoc(collection(db, 'orders'), {
          userId: user.uid,
          productId: product.id,
          productName: product.name,
          price: product.price,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error registering order:", error);
      }
    }
    
    // Redirect to WhatsApp
    const whatsappUrl = `https://wa.me/55${companyPhone}?text=Olá! Tenho interesse no produto: ${product.name}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Produtos e Peças</h2>
          <p className="text-zinc-400 text-sm mt-1">Catálogo completo de performance.</p>
        </div>
      </div>

      {/* Search Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-zinc-500" />
        </div>
        <input
          type="text"
          placeholder="Buscar produtos por nome ou descrição..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-10 text-zinc-500 flex flex-col items-center gap-3">
          <Package size={48} className="text-zinc-700" />
          <p>{searchQuery ? 'Nenhum produto encontrado para sua busca.' : 'Nenhum produto disponível no momento.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProducts.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
              {p.imageUrl ? (
                <div className="h-48 w-full bg-zinc-800 relative">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                </div>
              ) : (
                <div className="h-48 w-full bg-zinc-800 flex items-center justify-center">
                  <Package size={48} className="text-zinc-600" />
                </div>
              )}
              
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-xl text-zinc-100 leading-tight mb-2">{p.name}</h3>
                <p className="text-sm text-zinc-400 mb-4 flex-1">{p.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800/50">
                  <span className="font-bold text-2xl text-red-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                  </span>
                  <button 
                    onClick={() => handleBuy(p)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Comprar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
