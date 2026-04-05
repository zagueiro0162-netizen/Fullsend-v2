import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Calendar, Clock, Wrench, Package, ShoppingBag } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  serviceId: string;
  serviceName?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
}

interface Order {
  id: string;
  productId: string;
  productName: string;
  price: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  confirmed: 'bg-green-500/10 text-green-500 border-green-500/20',
  completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusLabels = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

const orderStatusLabels = {
  pending: 'Iniciado',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'orders'>('appointments');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch Appointments
        const qApps = query(
          collection(db, 'appointments'), 
          where('userId', '==', user.uid)
        );
        const appsSnapshot = await getDocs(qApps);
        
        const appsData = await Promise.all(appsSnapshot.docs.map(async (d) => {
          const data = d.data();
          let serviceName = 'Serviço não encontrado';
          try {
            const sDoc = await getDoc(doc(db, 'services', data.serviceId));
            if (sDoc.exists()) serviceName = sDoc.data().name;
          } catch (e) {}

          return {
            id: d.id,
            ...data,
            serviceName
          } as Appointment;
        }));

        appsData.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
        setAppointments(appsData);

        // Fetch Orders
        const qOrders = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        const ordersSnapshot = await getDocs(qOrders);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];

        ordersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(ordersData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Profile Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-zinc-400">{user.email}</p>
          <p className="text-xs text-zinc-500 mt-1">{user.phone}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'appointments' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Agendamentos
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'orders' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Compras
        </button>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : activeTab === 'appointments' ? (
          // Appointments Tab
          appointments.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 border-dashed">
              <p className="text-zinc-500">Você ainda não possui agendamentos.</p>
              <button onClick={() => navigate('/booking')} className="mt-4 text-red-500 font-medium hover:underline">
                Agendar agora
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {appointments.map((app) => (
                <div key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                      <Wrench size={16} className="text-zinc-400" />
                      {app.serviceName}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[app.status]}`}>
                      {statusLabels[app.status]}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {format(parseISO(app.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {app.time}
                    </div>
                  </div>

                  {app.notes && (
                    <div className="mt-2 text-sm text-zinc-500 bg-zinc-950 p-3 rounded-xl">
                      <span className="font-medium text-zinc-400">Obs:</span> {app.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          // Orders Tab
          orders.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 border-dashed">
              <p className="text-zinc-500">Você ainda não possui histórico de compras.</p>
              <button onClick={() => navigate('/products')} className="mt-4 text-red-500 font-medium hover:underline">
                Ver produtos
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                      <Package size={16} className="text-zinc-400" />
                      {order.productName}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[order.status]}`}>
                      {orderStatusLabels[order.status]}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mt-1">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Calendar size={14} />
                      {format(parseISO(order.createdAt), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                    <div className="font-bold text-red-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
