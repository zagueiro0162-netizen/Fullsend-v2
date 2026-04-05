import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Building2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isCompany, setIsCompany] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isCompany && adminCode !== 'admin123') {
      setError('Código de administrador inválido.');
      return;
    }

    setLoading(true);

    try {
      let user;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
          } catch (signInErr) {
            throw authErr;
          }
        } else {
          throw authErr;
        }
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const userData: any = {
          uid: user.uid,
          name,
          email,
          phone,
          role: isCompany ? 'admin' : 'client',
          createdAt: new Date().toISOString()
        };

        if (isCompany) {
          userData.adminCode = adminCode;
        }

        await setDoc(userDocRef, userData);
      }

      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'permission-denied') {
        setError('Erro de permissão no banco de dados. Tente novamente.');
      } else {
        setError(err.message || 'Erro ao criar conta. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    
    if (isCompany && adminCode !== 'admin123') {
      setError('Código de administrador inválido.');
      return;
    }

    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const userData: any = {
          uid: user.uid,
          name: user.displayName || 'Usuário',
          email: user.email || '',
          phone: user.phoneNumber || null,
          role: isCompany ? 'admin' : 'client',
          createdAt: new Date().toISOString()
        };

        if (isCompany) {
          userData.adminCode = adminCode;
        }

        await setDoc(userDocRef, userData);
      }
      navigate('/');
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Cadastro com Google cancelado pelo usuário.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Erro: Domínio não autorizado. Adicione a URL deste app no painel do Firebase (Authentication > Settings > Authorized domains).');
      } else {
        setError(`Erro Google: ${err.message || 'Falha na autenticação'}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center p-6">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold">Criar Conta</h2>
        <p className="text-zinc-400 mt-2">Junte-se à FullSend Performance</p>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Nome Completo</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500 transition-colors"
            placeholder="João Silva"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Telefone / WhatsApp</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500 transition-colors"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500 transition-colors"
            placeholder="seu@email.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Senha</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-red-500 transition-colors"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="mt-2 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={isCompany}
                onChange={(e) => {
                  setIsCompany(e.target.checked);
                  if (!e.target.checked) setAdminCode('');
                }}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border-2 border-zinc-600 rounded bg-zinc-900 peer-checked:bg-red-600 peer-checked:border-red-600 transition-colors"></div>
              <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Building2 size={16} className="text-zinc-500" />
              Sou a empresa (Conta Admin)
            </div>
          </label>

          {isCompany && (
            <div className="flex flex-col gap-1.5 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-medium text-zinc-400">Código de Administrador</label>
              <input
                type="password"
                required={isCompany}
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-red-500 transition-colors"
                placeholder="Digite o código secreto"
              />
              <p className="text-[10px] text-zinc-500">Dica: admin123</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl py-3.5 mt-4 transition-colors disabled:opacity-50"
        >
          {loading ? 'Criando conta...' : 'Cadastrar com E-mail'}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-4">
        <div className="h-px bg-zinc-800 flex-1"></div>
        <span className="text-zinc-500 text-sm font-medium">OU</span>
        <div className="h-px bg-zinc-800 flex-1"></div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="bg-white hover:bg-zinc-200 text-zinc-900 font-semibold rounded-xl py-3.5 mt-6 flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
      >
        <GoogleIcon />
        {googleLoading ? 'Conectando...' : 'Cadastrar com Google'}
      </button>

      <p className="text-center text-zinc-400 mt-8">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-red-500 font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
