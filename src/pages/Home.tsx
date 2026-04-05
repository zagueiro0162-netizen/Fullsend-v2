import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Wrench, MessageCircle, ChevronRight, Package, Store, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, limit, query, where, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  status: 'available' | 'out_of_stock';
}

interface CompanyProfile {
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  cnpj: string;
}

const ImageWithSkeleton = ({ src, alt }: { src: string, alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
          <Package size={24} className="text-zinc-700" />
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} 
        onLoad={() => setLoaded(true)}
        referrerPolicy="no-referrer" 
      />
    </div>
  );
};

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Company Profile
        const companyDoc = await getDoc(doc(db, 'settings', 'companyProfile'));
        if (companyDoc.exists()) {
          setCompanyProfile(companyDoc.data() as CompanyProfile);
        }

        // Fetch Products
        const q = query(
          collection(db, 'products'),
          where('status', '==', 'available'),
          limit(4)
        );
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingProducts(false);
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
    const phone = companyProfile?.phone.replace(/\D/g, '') || '11999999999';
    const whatsappUrl = `https://wa.me/55${phone}?text=Olá! Tenho interesse no produto: ${product.name}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Greeting & Company Profile */}
      <div className="mt-4 flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold">
            {user ? `Bem-vindo, ${user.name.split(' ')[0]}` : 'Bem-vindo à'}
          </h2>
          {!user && <h2 className="text-3xl font-bold text-red-500">{companyProfile?.name || 'FullSend'}</h2>}
          <p className="text-zinc-400 mt-1">O que seu carro precisa hoje?</p>
        </div>

        {/* Company Profile Card (Visible when logged in) */}
        {user && companyProfile && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
            {companyProfile.logoUrl ? (
              <img src={companyProfile.logoUrl} alt="Logo da Empresa" className="w-16 h-16 rounded-full object-cover border-2 border-zinc-800" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 shrink-0">
                <Store size={24} className="text-zinc-500" />
              </div>
            )}
            <div className="flex flex-col flex-1 overflow-hidden">
              <h3 className="font-bold text-zinc-100 text-lg truncate">{companyProfile.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{companyProfile.address}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                <span className="flex items-center gap-1"><Phone size={10} /> {companyProfile.phone}</span>
                <span>CNPJ: {companyProfile.cnpj}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hero Banner */}
      <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl shadow-black/50">
        <img 
          src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1000&q=80" 
          alt="Performance Car" 
          className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-luminosity"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">Performance & Remap</h3>
          <p className="text-sm text-zinc-300 drop-shadow-md">Desperte o verdadeiro potencial do seu motor.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/booking" className="bg-red-600 hover:bg-red-700 transition-colors rounded-2xl p-4 flex flex-col items-center justify-center gap-3 text-center shadow-lg shadow-red-900/20">
          <Calendar size={32} className="text-white" />
          <span className="font-semibold text-white">Agendar<br/>Serviço</span>
        </Link>
        <Link to="/services" className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors rounded-2xl p-4 flex flex-col items-center justify-center gap-3 text-center">
          <Wrench size={32} className="text-red-500" />
          <span className="font-semibold text-zinc-100">Nossos<br/>Serviços</span>
        </Link>
      </div>

      {/* Products Section */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Package size={20} className="text-red-500" />
            Produtos em Destaque
          </h3>
          <Link to="/products" className="text-sm text-red-500 hover:text-red-400 font-medium flex items-center">
            Ver todos <ChevronRight size={16} />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
            <p className="text-zinc-500 text-sm">Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
              <div 
                key={product.id} 
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col cursor-pointer hover:border-zinc-700 transition-colors"
                onClick={() => handleBuy(product)}
              >
                {product.imageUrl ? (
                  <div className="h-28 w-full bg-zinc-800 relative">
                    <ImageWithSkeleton src={product.imageUrl} alt={product.name} />
                  </div>
                ) : (
                  <div className="h-28 w-full bg-zinc-800 flex items-center justify-center">
                    <Package size={24} className="text-zinc-600" />
                  </div>
                )}
                <div className="p-3 flex flex-col flex-1">
                  <h4 className="font-bold text-sm text-zinc-100 line-clamp-1">{product.name}</h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1 mb-2 flex-1">{product.description}</p>
                  <div className="font-bold text-red-400 text-sm mt-auto">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secondary Actions */}
      <div className="flex flex-col gap-3 mt-2">
        <a 
          href={`https://wa.me/55${companyProfile?.phone.replace(/\D/g, '') || '11999999999'}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <MessageCircle size={20} className="text-green-500" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-100">Falar no WhatsApp</h4>
              <p className="text-xs text-zinc-400">Tire dúvidas com nossos especialistas</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-zinc-600" />
        </a>

        {user && (
          <Link 
            to="/dashboard"
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar size={20} className="text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-100">Meus Agendamentos</h4>
                <p className="text-xs text-zinc-400">Acompanhe seus serviços</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-zinc-600" />
          </Link>
        )}
      </div>
    </div>
  );
}
