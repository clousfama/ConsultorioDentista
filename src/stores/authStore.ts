import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Função para criar store de autenticação
export const useAuthStore = create<AuthState>()((set: any) => {
  return {
    user: null,
    loading: true,
    error: null,
    signIn: async (email: string, password: string) => {
      try {
        // Redefinir erro ao tentar novo login
        set({ error: null });
        
        // Verificar se há um usuário do modo de desenvolvimento no localStorage
        const devUserStr = localStorage.getItem('dentclinic-user');
        if (devUserStr) {
          try {
            const devUser = JSON.parse(devUserStr);
            if (devUser && devUser.email === email) {
              console.log('Usando usuário do modo de desenvolvimento');
              set({
                user: devUser,
                error: null
              });
              toast.success('Login realizado com sucesso!');
              return;
            }
          } catch (e) {
            console.error('Erro ao processar usuário do modo de desenvolvimento:', e);
            localStorage.removeItem('dentclinic-user');
          }
        }
        
        // 1. Autenticar o usuário
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Erro de autenticação:', error.message);
          throw error;
        }

        if (!data.user) {
          console.error('Dados do usuário ausentes na resposta de autenticação');
          throw new Error('Usuário não encontrado');
        }

        // 2. Recuperar o perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Erro ao recuperar perfil:', profileError);
          // Continuamos apesar do erro para não bloquear o login
        }

        // 3. Se o perfil não existir, tentar criá-lo
        if (!profile) {
          console.log('Perfil não encontrado, criando perfil padrão para o usuário:', data.user.id);
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({ 
              id: data.user.id, 
              email: data.user.email,
              role: 'user',
              created_at: new Date().toISOString()
            });

          if (createProfileError) {
            console.error('Erro ao criar perfil:', createProfileError);
            // Continuamos apesar do erro para não bloquear o login
          }
        }

        // 4. Atualizar o estado com os dados do usuário
        set({
          user: {
            id: data.user.id,
            email: data.user.email!,
            role: profile?.role || 'user',
          },
          error: null
        });

        toast.success('Login realizado com sucesso!');
      } catch (error: any) {
        console.error('Erro detalhado de login:', error);
        
        let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
        
        // Mensagens mais específicas para erros comuns
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Credenciais inválidas. Por favor, verifique seu email e senha.';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado. Por favor, verifique sua caixa de entrada.';
        }
        
        set({ error: errorMessage });
        toast.error(errorMessage);
        throw error;
      }
    },
    signOut: async () => {
      try {
        set({ loading: true, error: null });
        
        // Remover usuário de desenvolvimento do localStorage
        localStorage.removeItem('dentclinic-user');
        
        await supabase.auth.signOut();
        set({ user: null, loading: false });
        toast.success('Logout realizado com sucesso!');
      } catch (error: any) {
        console.error('Erro detalhado de logout:', error);
        const errorMessage = `Erro ao fazer logout: ${error.message || 'Erro desconhecido'}`;
        set({ error: errorMessage, loading: false });
        toast.error(errorMessage);
      }
    },
    checkAuth: async () => {
      try {
        set({ loading: true, error: null });
        
        // Verificar se há um usuário do modo de desenvolvimento no localStorage
        const devUserStr = localStorage.getItem('dentclinic-user');
        if (devUserStr) {
          try {
            const devUser = JSON.parse(devUserStr);
            if (devUser && devUser.id && devUser.email) {
              console.log('Usuário de desenvolvimento encontrado:', devUser);
              set({
                user: devUser,
                loading: false,
                error: null
              });
              return;
            }
          } catch (e) {
            console.error('Erro ao processar usuário do modo de desenvolvimento:', e);
            localStorage.removeItem('dentclinic-user');
          }
        }
        
        // 1. Verificar se há uma sessão ativa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao verificar sessão:', sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.log('Nenhuma sessão ativa encontrada');
          set({ user: null, loading: false });
          return;
        }

        console.log('Sessão ativa encontrada para usuário:', session.user.id);
        
        // 2. Recuperar o perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Erro ao recuperar perfil durante verificação de auth:', profileError);
        }
        
        // 3. Criar perfil se não existir
        if (!profile) {
          console.log('Perfil não encontrado durante verificação de auth, criando perfil padrão');
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({ 
              id: session.user.id, 
              email: session.user.email,
              role: 'user',
              created_at: new Date().toISOString()
            });

          if (createProfileError) {
            console.error('Erro ao criar perfil durante verificação de auth:', createProfileError);
          }
        }

        // 4. Atualizar o estado com os dados do usuário
        set({
          user: {
            id: session.user.id,
            email: session.user.email!,
            role: profile?.role || 'user',
          },
          loading: false,
          error: null
        });
      } catch (error: any) {
        console.error('Erro detalhado ao verificar autenticação:', error);
        set({ 
          user: null, 
          loading: false,
          error: `Erro na verificação de autenticação: ${error.message || 'Erro desconhecido'}`
        });
      }
    }
  };
});