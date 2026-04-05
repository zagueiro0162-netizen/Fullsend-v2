import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, User as UserIcon, Phone, Mail } from 'lucide-react';

interface UserProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'admin';
  createdAt: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ message: string, isAlert?: boolean, onConfirm: () => void } | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      // Sort admins first, then by name
      usersData.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return a.name.localeCompare(b.name);
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    if (userId === user?.uid) {
      setConfirmAction({
        message: "Você não pode alterar sua própria permissão.",
        isAlert: true,
        onConfirm: () => {}
      });
      return;
    }
    
    setConfirmAction({
      message: `Tem certeza que deseja alterar a permissão deste usuário para ${newRole === 'admin' ? 'Administrador' : 'Cliente'}?`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'users', userId), { role: newRole });
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as 'client' | 'admin' } : u));
        } catch (error) {
          console.error("Error updating user role:", error);
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
          <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
          <p className="text-zinc-400 text-sm mt-1">Visualize clientes e gerencie administradores.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">Nenhum usuário encontrado.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {users.map((u) => (
            <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {u.role === 'admin' ? <Shield size={20} /> : <UserIcon size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">{u.name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block mt-1 ${
                      u.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {u.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Mail size={14} /> {u.email}
                </div>
                {u.phone && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Phone size={14} /> {u.phone}
                  </div>
                )}
              </div>

              <div className="mt-2 pt-3 border-t border-zinc-800/50 flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  Mudar permissão:
                </span>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  disabled={u.id === user.uid}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-red-500 disabled:opacity-50"
                >
                  <option value="client">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white">
              {confirmAction.isAlert ? 'Aviso' : 'Confirmação'}
            </h3>
            <p className="text-zinc-400 text-sm">{confirmAction.message}</p>
            <div className="flex gap-3 mt-2">
              {!confirmAction.isAlert && (
                <button 
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="flex-1 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                {confirmAction.isAlert ? 'Entendi' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
