import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { useAuthStore } from './stores/authStore';
import { PrivateRoute } from './components/PrivateRoute';

// Flag para ativar o modo de desenvolvimento - controlado por variável de ambiente
// Em produção, isso deve ser FALSE
const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true';

function App() {
  const { user, loading, checkAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // No modo dev, verificamos primeiro o localStorage
        if (DEV_MODE) {
          const devUserStr = localStorage.getItem('dentclinic-user');
          if (devUserStr) {
            setIsInitialized(true);
            return;
          }
        }
        
        await checkAuth();
      } catch (err) {
        console.error('Erro ao inicializar autenticação:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Mostra tela de loading enquanto verifica autenticação
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginForm devMode={DEV_MODE} />} />
          <Route path="/dashboard/*" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </>
  );
}

export default App;