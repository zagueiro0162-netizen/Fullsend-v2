import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedTime: string;
  status?: 'available' | 'unavailable' | 'on_request';
}

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
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

    fetchServices();
  }, []);

  return (
    <div className="p-4 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Nossos Serviços</h2>
        <p className="text-zinc-400 mt-1">Especialidade em performance e manutenção premium.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">
          Nenhum serviço cadastrado no momento.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {services.map((service) => {
            const status = service.status || 'available';
            const statusConfig = {
              available: { label: 'Disponível', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
              unavailable: { label: 'Indisponível', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
              on_request: { label: 'Sob Consulta', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
            };
            const config = statusConfig[status as keyof typeof statusConfig];

            return (
            <div key={service.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-lg font-bold text-zinc-100">{service.name}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border whitespace-nowrap ${config.className}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{service.description}</p>
              
              <div className="flex items-center gap-4 mt-2 pt-3 border-t border-zinc-800/50">
                <div className="flex items-center gap-1.5 text-zinc-300 text-sm font-medium">
                  <DollarSign size={16} className="text-green-500" />
                  R$ {service.price.toFixed(2).replace('.', ',')}
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300 text-sm font-medium">
                  <Clock size={16} className="text-blue-500" />
                  {service.estimatedTime}
                </div>
              </div>

              <button
                onClick={() => navigate('/booking', { state: { serviceId: service.id } })}
                disabled={status === 'unavailable'}
                className="mt-2 w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {status === 'unavailable' ? 'Indisponível' : 'Agendar Serviço'}
              </button>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
