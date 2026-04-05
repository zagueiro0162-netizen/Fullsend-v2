import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
  status?: 'available' | 'unavailable' | 'on_request';
}

const AVAILABLE_TIMES = [
  '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function Booking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState(location.state?.serviceId || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, 'services'));
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        price: doc.data().price,
        status: doc.data().status
      }));
      setServices(servicesData);
    };

    fetchServices();
  }, [user, navigate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedService || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        userId: user.uid,
        serviceId: selectedService,
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
        notes,
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error("Error booking:", error);
      alert("Erro ao agendar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Generate next 14 days for selection
  const today = startOfToday();
  const availableDates = Array.from({ length: 14 }).map((_, i) => {
    const date = addDays(today, i + 1); // Start from tomorrow
    // Skip Sundays (0)
    if (date.getDay() === 0) return null;
    return date;
  }).filter(Boolean) as Date[];

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Agendamento Solicitado!</h2>
        <p className="text-zinc-400">
          Sua solicitação foi enviada com sucesso. Você será redirecionado para seus agendamentos.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Agendar Serviço</h2>
        <p className="text-zinc-400 mt-1">Escolha o serviço, data e horário.</p>
      </div>

      <form onSubmit={handleBooking} className="flex flex-col gap-6">
        {/* Service Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-300">Serviço Desejado</label>
          <select
            required
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 focus:outline-none focus:border-red-500 appearance-none"
          >
            <option value="" disabled>Selecione um serviço...</option>
            {services.map(s => (
              <option key={s.id} value={s.id} disabled={s.status === 'unavailable'}>
                {s.name} - R$ {s.price.toFixed(2)} {s.status === 'unavailable' ? '(Indisponível)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <CalendarIcon size={16} /> Data
          </label>
          <div className="flex overflow-x-auto gap-3 pb-2 snap-x">
            {availableDates.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`snap-start shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl border transition-colors ${
                    isSelected 
                      ? 'bg-red-600 border-red-500 text-white' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs uppercase font-medium mb-1">
                    {format(date, 'EEE', { locale: ptBR })}
                  </span>
                  <span className="text-2xl font-bold">
                    {format(date, 'dd')}
                  </span>
                  <span className="text-xs mt-1">
                    {format(date, 'MMM', { locale: ptBR })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Clock size={16} /> Horário
            </label>
            <div className="grid grid-cols-3 gap-3">
              {AVAILABLE_TIMES.map(time => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-300">Observações (Opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500 resize-none"
            placeholder="Detalhes sobre o carro, modelo, ano, etc..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedService || !selectedDate || !selectedTime}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl py-4 mt-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processando...' : 'Confirmar Agendamento'}
        </button>
      </form>
    </div>
  );
}
