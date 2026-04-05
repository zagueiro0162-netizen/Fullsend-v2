import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Store, Save } from 'lucide-react';

export default function AdminCompany() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    address: '',
    phone: '',
    cnpj: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchCompanyProfile();
  }, [user, navigate]);

  const fetchCompanyProfile = async () => {
    try {
      const docRef = doc(db, 'settings', 'companyProfile');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          name: data.name || '',
          logoUrl: data.logoUrl || '',
          address: data.address || '',
          phone: data.phone || '',
          cnpj: data.cnpj || ''
        });
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const docRef = doc(db, 'settings', 'companyProfile');
      await setDoc(docRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      alert("Perfil da empresa atualizado com sucesso!");
    } catch (error) {
      console.error("Error saving company profile:", error);
      alert("Erro ao salvar perfil da empresa.");
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link to="/admin" className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Perfil da Empresa</h2>
          <p className="text-zinc-400 text-sm mt-1">Configure os dados visíveis para os clientes.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
          
          <div className="flex items-center gap-4 mb-2">
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo" className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
                <Store size={32} className="text-zinc-500" />
              </div>
            )}
            <div className="flex-1">
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">URL da Logo (Foto da Empresa)</label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500"
                placeholder="https://exemplo.com/logo.jpg"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Nome da Empresa</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500"
              placeholder="Ex: FullSend Performance"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Endereço / Localização</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500"
              placeholder="Ex: Av. das Nações Unidas, 1234 - São Paulo, SP"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Telefone para Contato</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">CNPJ</label>
              <input
                type="text"
                required
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500"
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={saving}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Perfil da Empresa'}
          </button>
        </form>
      )}
    </div>
  );
}
