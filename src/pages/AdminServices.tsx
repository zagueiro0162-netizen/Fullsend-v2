import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, DollarSign, Clock, X } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedTime: string;
  status?: 'available' | 'unavailable' | 'on_request';
}

export default function AdminServices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    estimatedTime: '',
    status: 'available'
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchServices();
  }, [user, navigate]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'services'));
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      setServices(servicesData);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingId(service.id);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price.toString(),
        estimatedTime: service.estimatedTime,
        status: service.status || 'available'
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        estimatedTime: '',
        status: 'available'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        estimatedTime: formData.estimatedTime,
        status: formData.status,
      };

      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), serviceData);
      } else {
        await addDoc(collection(db, 'services'), {
          ...serviceData,
          createdAt: new Date().toISOString()
        });
      }
      
      handleCloseModal();
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmAction({
      message: "Tem certeza que deseja excluir este serviço?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'services', id));
          fetchServices();
        } catch (error) {
          console.error("Error deleting service:", error);
        }
      }
    });
  };

  const seedCompleteServices = () => {
    setConfirmAction({
      message: "Isso adicionará uma lista completa de serviços de performance ao banco de dados. Deseja continuar?",
      onConfirm: async () => {
        const completeServices = [
          { name: 'Remap ECU - Stage 1', description: 'Otimização de software para ganho de potência e torque sem necessidade de peças adicionais. Foco em confiabilidade e dirigibilidade.', price: 1500, estimatedTime: '3 horas', status: 'available' },
          { name: 'Remap ECU - Stage 2', description: 'Ajuste de software mais agressivo. Requer instalação obrigatória de downpipe e filtro esportivo de alto fluxo.', price: 2200, estimatedTime: '4 horas', status: 'available' },
          { name: 'Remap ECU - Stage 3', description: 'Calibração customizada para projetos com upgrade de turbina, bicos injetores e bomba de combustível.', price: 3500, estimatedTime: '2 dias', status: 'on_request' },
          { name: 'Remap TCU (Câmbio)', description: 'Otimização do software do câmbio (DSG, ZF, etc) para trocas mais rápidas, aumento do limite de torque e launch control aprimorado.', price: 1800, estimatedTime: '2 horas', status: 'available' },
          { name: 'Pops & Bangs / VMAX', description: 'Ativação de pipocos no escapamento (Pops & Bangs) e remoção do limitador eletrônico de velocidade (VMAX).', price: 800, estimatedTime: '1 hora', status: 'available' },
          { name: 'Instalação de Downpipe', description: 'Substituição do catalisador original por downpipe em inox 304 para melhor fluxo de gases, redução de temperatura e ronco mais esportivo.', price: 600, estimatedTime: '3 horas', status: 'available' },
          { name: 'Instalação de Intake', description: 'Instalação de sistema de admissão de ar frio (Cold Air Intake) e filtro esportivo inbox ou cônico.', price: 300, estimatedTime: '1 hora', status: 'available' },
          { name: 'Upgrade de Intercooler', description: 'Instalação de intercooler de maior volume (Wagner Tuning, APR, etc) para reduzir a temperatura do ar de admissão.', price: 800, estimatedTime: '4 horas', status: 'on_request' },
          { name: 'Upgrade de Turbina', description: 'Substituição da turbina original por modelo híbrido ou de maior fluxo (Plug & Play).', price: 1500, estimatedTime: '1 dia', status: 'on_request' },
          { name: 'Instalação de Escapamento Catback', description: 'Instalação de sistema de escapamento completo pós-catalisador em inox.', price: 800, estimatedTime: '4 horas', status: 'on_request' },
          { name: 'Revisão Premium', description: 'Troca de óleo (Motul/Liqui Moly), filtros originais, verificação completa de freios, suspensão e diagnóstico via scanner VCDS/Odis.', price: 850, estimatedTime: '2 horas', status: 'available' },
          { name: 'Troca de Óleo de Câmbio', description: 'Substituição do fluido de transmissão (DSG, ZF) com equipamento de diálise e filtro original.', price: 1800, estimatedTime: '3 horas', status: 'available' },
          { name: 'Descarbonização (Walnut Blasting)', description: 'Limpeza das válvulas de admissão com casca de noz, serviço essencial para restaurar a potência em motores com injeção direta.', price: 1200, estimatedTime: '1 dia', status: 'on_request' },
          { name: 'Troca de Velas e Bobinas', description: 'Substituição por velas de Iridium grau mais frio e bobinas de alta performance (ex: APR, R8).', price: 400, estimatedTime: '1 hora', status: 'available' },
          { name: 'Aferição em Dinamômetro', description: '3 puxadas no dinamômetro servomotor para medição precisa de potência e torque nas rodas, com entrega de gráfico impresso.', price: 400, estimatedTime: '1 hora', status: 'available' },
        ];

        setLoading(true);
        try {
          for (const service of completeServices) {
            await addDoc(collection(db, 'services'), {
              ...service,
              createdAt: new Date().toISOString()
            });
          }
          fetchServices();
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Serviços</h2>
            <p className="text-zinc-400 text-sm mt-1">Adicione, edite ou remova serviços.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => handleOpenModal()}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} /> Novo Serviço
        </button>
        <button 
          onClick={seedCompleteServices}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl px-4 py-3.5 flex items-center justify-center transition-colors text-sm"
          title="Gerar lista completa de serviços de performance"
        >
          Gerar Lista Padrão
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">Nenhum serviço cadastrado.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">{service.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border inline-block mt-1 ${
                    service.status === 'unavailable' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    service.status === 'on_request' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                    'bg-green-500/10 text-green-500 border-green-500/20'
                  }`}>
                    {service.status === 'unavailable' ? 'Indisponível' : service.status === 'on_request' ? 'Sob Consulta' : 'Disponível'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(service)} className="p-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(service.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-400 line-clamp-2">{service.description}</p>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5 text-zinc-300 text-sm font-medium">
                  <DollarSign size={14} className="text-green-500" />
                  R$ {service.price.toFixed(2)}
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300 text-sm font-medium">
                  <Clock size={14} className="text-blue-500" />
                  {service.estimatedTime}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h3>
              <button onClick={handleCloseModal} className="p-1 text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <form id="service-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Nome do Serviço</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:border-red-500 outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Descrição</label>
                  <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:border-red-500 outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-zinc-300">Preço (R$)</label>
                    <input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:border-red-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-zinc-300">Tempo Estimado</label>
                    <input required type="text" placeholder="Ex: 2 horas" value={formData.estimatedTime} onChange={e => setFormData({...formData, estimatedTime: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:border-red-500 outline-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:border-red-500 outline-none appearance-none">
                    <option value="available">Disponível</option>
                    <option value="unavailable">Indisponível</option>
                    <option value="on_request">Sob Consulta</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
              <button type="submit" form="service-form" className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl py-3.5 transition-colors">
                Salvar Serviço
              </button>
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
