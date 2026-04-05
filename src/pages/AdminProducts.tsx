import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  status: 'available' | 'out_of_stock';
  createdAt: string;
}

export default function AdminProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    status: 'available'
  });

  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchProducts();
  }, [user, navigate]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // Sort by name
      productsData.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const seedProducts = async () => {
    setConfirmAction({
      message: "Isso irá adicionar uma lista de produtos padrão. Deseja continuar?",
      onConfirm: async () => {
        setSeeding(true);
        try {
          const batch = writeBatch(db);
          const productsCollection = collection(db, 'products');

          const defaultProducts = [
            {
              name: 'Óleo Motul 8100 X-cess 5W40 (5L)',
              description: 'Óleo lubrificante 100% sintético de alta performance para motores a gasolina e diesel. Proporciona excelente proteção e limpeza do motor.',
              price: 450.00,
              imageUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=500&q=80',
              status: 'available'
            },
            {
              name: 'Filtro de Ar Esportivo K&N Inbox',
              description: 'Filtro de ar lavável e reutilizável. Aumenta o fluxo de ar e a potência do motor, mantendo a filtragem excelente.',
              price: 580.00,
              imageUrl: 'https://images.unsplash.com/photo-1600705722908-bab1e61c0b4d?auto=format&fit=crop&w=500&q=80',
              status: 'available'
            },
            {
              name: 'Velas de Ignição NGK Iridium (Jogo 4 un)',
              description: 'Velas de alta performance com ponta de Iridium. Melhoram a ignição, resposta do acelerador e durabilidade.',
              price: 320.00,
              imageUrl: 'https://images.unsplash.com/photo-1530021232320-687d8e3dbaa9?auto=format&fit=crop&w=500&q=80',
              status: 'available'
            },
            {
              name: 'Downpipe Inox 304 (Vários Modelos)',
              description: 'Downpipe fabricado em aço inox 304 com solda TIG. Elimina a restrição do catalisador original, melhorando o fluxo de gases e o som.',
              price: 1200.00,
              imageUrl: 'https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?auto=format&fit=crop&w=500&q=80',
              status: 'available'
            },
            {
              name: 'Kit Embreagem de Cerâmica',
              description: 'Kit de embreagem de alta performance para carros preparados. Suporta maior torque e potência sem patinar.',
              price: 1850.00,
              imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=500&q=80',
              status: 'available'
            },
            {
              name: 'Fluido de Freio Motul RBF 660',
              description: 'Fluido de freio 100% sintético para uso em pista e rua extrema. Ponto de ebulição extremamente alto.',
              price: 180.00,
              imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80',
              status: 'available'
            },
            {
              name: 'Pneu Michelin Pilot Sport 4S (Unidade)',
              description: 'Pneu de ultra alta performance. Oferece aderência excepcional em piso seco e molhado, ideal para track days e uso esportivo.',
              price: 1450.00,
              imageUrl: 'https://images.unsplash.com/photo-1580422676646-3474d2091931?auto=format&fit=crop&w=500&q=80',
              status: 'available'
            },
            {
              name: 'Pastilha de Freio EBC Yellowstuff',
              description: 'Pastilhas de freio de alta performance para uso misto (rua e pista). Excelente poder de frenagem mesmo em altas temperaturas.',
              price: 980.00,
              imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=500&q=80',
              status: 'available'
            },
            {
              name: 'Bobina de Ignição Audi R8 (Unidade)',
              description: 'Bobina de ignição original Audi R8 (vermelha). Upgrade muito comum para motores TSI/TFSI para evitar falhas de ignição.',
              price: 250.00,
              imageUrl: 'https://images.unsplash.com/photo-1530021232320-687d8e3dbaa9?auto=format&fit=crop&w=500&q=80',
              status: 'available'
            },
            {
              name: 'Intercooler Frontal Upgrade',
              description: 'Intercooler de maior volume para resfriar o ar da admissão de forma mais eficiente. Essencial para projetos de alta potência.',
              price: 2500.00,
              imageUrl: 'https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?auto=format&fit=crop&w=500&q=80',
              status: 'available'
            }
          ];

          for (const prod of defaultProducts) {
            const newDocRef = doc(productsCollection);
            batch.set(newDocRef, {
              ...prod,
              createdAt: new Date().toISOString()
            });
          }

          await batch.commit();
          fetchProducts();
        } catch (error) {
          console.error("Error seeding products:", error);
        } finally {
          setSeeding(false);
        }
      }
    });
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        imageUrl: product.imageUrl || '',
        status: product.status
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        status: 'available'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      imageUrl: formData.imageUrl || null,
      status: formData.status as 'available' | 'out_of_stock',
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString()
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        const newDocRef = doc(collection(db, 'products'));
        await setDoc(newDocRef, productData);
      }
      handleCloseModal();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Erro ao salvar produto.");
    }
  };

  const handleDelete = (id: string) => {
    setConfirmAction({
      message: "Tem certeza que deseja excluir este produto?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'products', id));
          setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
          console.error("Error deleting product:", error);
        }
      }
    });
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link to="/admin" className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Produtos</h2>
          <p className="text-zinc-400 text-sm mt-1">Adicione ou edite produtos da oficina.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button 
          onClick={seedProducts}
          disabled={seeding}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Package size={20} />
          {seeding ? 'Gerando...' : 'Gerar Lista Padrão'}
        </button>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-zinc-500 flex flex-col items-center gap-3">
          <Package size={48} className="text-zinc-700" />
          <p>Nenhum produto cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
              {p.imageUrl ? (
                <div className="h-40 w-full bg-zinc-800 relative">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                </div>
              ) : (
                <div className="h-40 w-full bg-zinc-800 flex items-center justify-center">
                  <Package size={40} className="text-zinc-600" />
                </div>
              )}
              
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-lg text-zinc-100 leading-tight">{p.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border shrink-0 ${
                    p.status === 'available' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                    'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {p.status === 'available' ? 'Disponível' : 'Esgotado'}
                  </span>
                </div>
                
                <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">{p.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800/50">
                  <span className="font-bold text-lg text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenModal(p)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-300"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-6">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500"
                    placeholder="Ex: Óleo Motul 8100 5W40"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Descrição</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500 min-h-[100px] resize-y"
                    placeholder="Descrição detalhada do produto..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">URL da Imagem (Opcional)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500"
                  >
                    <option value="available">Disponível</option>
                    <option value="out_of_stock">Esgotado</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-4">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 rounded-xl font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white">Confirmação</h3>
            <p className="text-zinc-400 text-sm">{confirmAction.message}</p>
            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="flex-1 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
