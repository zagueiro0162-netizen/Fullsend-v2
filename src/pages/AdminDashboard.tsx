import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Calendar as CalendarIcon, CheckCircle, PlusCircle, Wrench, Mail, Phone, X, Store } from 'lucide-react';

interface AdminAppointment {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  serviceId: string;
  serviceName?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalClients: 0, totalApps: 0, todayApps: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch users
        const usersSnap = await getDocs(collection(db, 'users'));
        const clientsCount = usersSnap.docs.filter(d => d.data().role === 'client').length;

        // Fetch appointments
        const appsSnap = await getDocs(collection(db, 'appointments'));
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        let todayCount = 0;

        const appsData = await Promise.all(appsSnap.docs.map(async (d) => {
          const data = d.data();
          if (data.date === todayStr) todayCount++;

          // Fetch service name
          let serviceName = 'Desconhecido';
          try {
            const sDoc = await getDoc(doc(db, 'services', data.serviceId));
            if (sDoc.exists()) serviceName = sDoc.data().name;
          } catch (e) {}

          // Fetch user name
          let userName = 'Desconhecido';
          let userEmail = '';
          let userPhone = '';
          try {
            const uDoc = await getDoc(doc(db, 'users', data.userId));
            if (uDoc.exists()) {
              const uData = uDoc.data();
              userName = uData.name;
              userEmail = uData.email || '';
              userPhone = uData.phone || '';
            }
          } catch (e) {}

          return {
            id: d.id,
            ...data,
            serviceName,
            userName,
            userEmail,
            userPhone
          } as AdminAppointment;
        }));

        appsData.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
        
        setAppointments(appsData);
        setStats({
          totalClients: clientsCount,
          totalApps: appsData.length,
          todayApps: todayCount
        });
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const updateStatus = async (appId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'appointments', appId), { status: newStatus });
      setAppointments(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus as any } : app));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erro ao atualizar status.");
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const matchStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchDate = dateFilter === '' || app.date === dateFilter;
    return matchStatus && matchDate;
  });

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Painel Admin</h2>
          <p className="text-zinc-400 mt-1">Visão geral da oficina.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Users size={24} className="text-blue-500 mb-2" />
          <span className="text-2xl font-bold">{stats.totalClients}</span>
          <span className="text-xs text-zinc-400">Clientes</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <CalendarIcon size={24} className="text-green-500 mb-2" />
          <span className="text-2xl font-bold">{stats.totalApps}</span>
          <span className="text-xs text-zinc-400">Total Agend.</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <CheckCircle size={24} className="text-red-500 mb-2" />
          <span className="text-2xl font-bold">{stats.todayApps}</span>
          <span className="text-xs text-zinc-400">Hoje</span>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-bold mb-3">Gerenciamento</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/admin/services" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 hover:bg-zinc-800 transition-colors">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><Wrench size={20} /></div>
            <span className="font-semibold text-zinc-100">Serviços</span>
          </Link>
          <Link to="/admin/products" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 hover:bg-zinc-800 transition-colors">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><PlusCircle size={20} /></div>
            <span className="font-semibold text-zinc-100">Produtos</span>
          </Link>
          <Link to="/admin/users" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 hover:bg-zinc-800 transition-colors">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Users size={20} /></div>
            <span className="font-semibold text-zinc-100">Usuários</span>
          </Link>
          <Link to="/admin/company" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 hover:bg-zinc-800 transition-colors">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Store size={20} /></div>
            <span className="font-semibold text-zinc-100">Empresa</span>
          </Link>
        </div>
      </div>

      {/* Appointments List */}
      <div>
        <h3 className="text-lg font-bold mb-4">Agendamentos</h3>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs text-zinc-500 mb-1 block">Filtrar por Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-red-500"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Finalizado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-zinc-500 mb-1 block">Filtrar por Data</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-red-500 [color-scheme:dark]"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-3 rounded-xl transition-colors flex items-center justify-center"
                  title="Limpar data"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-10 text-zinc-500">Nenhum agendamento encontrado com os filtros atuais.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAppointments.map((app) => (
              <div key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="relative group inline-block">
                      <h4 className="font-bold text-zinc-100 cursor-help border-b border-dashed border-zinc-600">{app.userName}</h4>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex flex-col gap-1.5 bg-zinc-800 border border-zinc-700 p-3 rounded-xl shadow-xl z-10 w-max min-w-[200px]">
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Mail size={14} className="text-zinc-400" /> {app.userEmail || 'Sem e-mail'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Phone size={14} className="text-zinc-400" /> {app.userPhone || 'Sem telefone'}
                        </div>
                        <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-zinc-800"></div>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 mt-0.5">{app.serviceName}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[app.status]}`}>
                    {statusLabels[app.status]}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-zinc-300 bg-zinc-950 p-2 rounded-lg">
                  <span>{format(parseISO(app.date), "dd/MM/yyyy")}</span>
                  <span>•</span>
                  <span>{app.time}</span>
                </div>

                {app.notes && (
                  <p className="text-sm text-zinc-500 italic">"{app.notes}"</p>
                )}

                {/* Admin Actions */}
                <div className="flex gap-2 mt-2 pt-3 border-t border-zinc-800/50">
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-red-500 flex-1"
                  >
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmar</option>
                    <option value="completed">Finalizar</option>
                    <option value="cancelled">Cancelar</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
