import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Usuários pré-definidos para modo de desenvolvimento
const DEV_USERS = [
  {
    id: 'admin-id-123',
    email: 'admin@dentclinic.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 'user-id-123',
    email: 'user@dentclinic.com',
    password: 'user123',
    role: 'user'
  }
];

interface LoginFormProps {
  devMode?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ devMode = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      // Se estiver em modo de desenvolvimento, verificar credenciais localmente
      if (devMode) {
        const user = DEV_USERS.find(u => u.email === email && u.password === password);
        
        if (user) {
          console.log('Login de desenvolvimento bem-sucedido para:', user.email);
          
          // Armazenar usuário de desenvolvimento no localStorage
          const devUser = {
            id: user.id,
            email: user.email,
            role: user.role
          };
          localStorage.setItem('dentclinic-user', JSON.stringify(devUser));
          
          // Chamar signIn para processar o login
          await signIn(email, password);
          
          navigate('/dashboard');
        } else {
          console.error('Credenciais inválidas em modo de desenvolvimento');
          toast.error('Credenciais inválidas. Tente admin@dentclinic.com/admin123 ou user@dentclinic.com/user123');
        }
      } else {
        // Modo normal - usa autenticação do Supabase
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      // Não é necessário mostrar toast aqui, pois o signIn já faz isso
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Dentista Clinica</h2>
          <p className="mt-2 text-sm text-gray-600">
            {devMode ? 'Modo de Desenvolvimento' : 'Acesso Restrito'}
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 mt-2">
              {error}
            </div>
          )}

          {devMode && (
            <div className="text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
              <p className="font-bold text-yellow-700">Modo de Desenvolvimento Ativo</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                2024 Dentista Clinica
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};