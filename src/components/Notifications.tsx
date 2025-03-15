import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Bell, Calendar, MessageCircle, AlertTriangle, CheckCircle, X } from 'lucide-react';

// Verificar se estamos em modo de desenvolvimento
const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'message' | 'alert';
  date: string;
  read: boolean;
  patient_id?: string;
  patient_name?: string;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'appointment' | 'message' | 'alert'>('all');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  // Função para gerar um ID único para o modo de desenvolvimento
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Função para carregar notificações do localStorage no modo de desenvolvimento
  const loadDevNotifications = () => {
    try {
      const storedNotifications = localStorage.getItem('dentclinic-notifications');
      if (storedNotifications) {
        return JSON.parse(storedNotifications);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações do localStorage:', error);
    }
    return [];
  };

  // Função para salvar notificações no localStorage no modo de desenvolvimento
  const saveDevNotifications = (notificationsData: Notification[]) => {
    try {
      localStorage.setItem('dentclinic-notifications', JSON.stringify(notificationsData));
    } catch (error) {
      console.error('Erro ao salvar notificações no localStorage:', error);
    }
  };

  // Função para criar notificações demo no modo de desenvolvimento
  const createDemoNotifications = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const demoNotifications: Notification[] = [
      {
        id: generateId(),
        title: 'Lembrete de Consulta',
        message: 'Lembrete: Maria da Silva tem consulta amanhã às 14:30.',
        type: 'appointment',
        date: tomorrow.toISOString(),
        read: false,
        patient_name: 'Maria da Silva'
      },
      {
        id: generateId(),
        title: 'Mensagem Recebida',
        message: 'João Pereira enviou uma mensagem confirmando a consulta.',
        type: 'message',
        date: now.toISOString(),
        read: false,
        patient_name: 'João Pereira'
      },
      {
        id: generateId(),
        title: 'Alerta de Sistema',
        message: 'A agenda para a próxima semana está quase cheia.',
        type: 'alert',
        date: now.toISOString(),
        read: true
      },
      {
        id: generateId(),
        title: 'Consulta Cancelada',
        message: 'Ana Oliveira cancelou a consulta agendada para ontem às 10:00.',
        type: 'appointment',
        date: yesterday.toISOString(),
        read: true,
        patient_name: 'Ana Oliveira'
      }
    ];

    return demoNotifications;
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        let devNotifications = loadDevNotifications();
        
        // Se não houver notificações, vamos criar algumas demo
        if (!devNotifications || devNotifications.length === 0) {
          devNotifications = createDemoNotifications();
          saveDevNotifications(devNotifications);
        }
        
        // Filtrar notificações conforme a aba ativa
        if (activeTab !== 'all') {
          if (activeTab === 'unread') {
            devNotifications = devNotifications.filter((notif: Notification) => !notif.read);
          } else {
            devNotifications = devNotifications.filter((notif: Notification) => notif.type === activeTab);
          }
        }
        
        // Ordenar por data (mais recente primeiro)
        devNotifications.sort((a: Notification, b: Notification) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setNotifications(devNotifications);
        setLoading(false);
        return;
      }

      // Em modo de produção, usamos o Supabase
      let query = supabase
        .from('notifications')
        .select('*');
        
      if (activeTab !== 'all') {
        if (activeTab === 'unread') {
          query = query.eq('read', false);
        } else {
          query = query.eq('type', activeTab);
        }
      }
      
      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        throw error;
      }

      setNotifications(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error.message);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notification: Notification) => {
    try {
      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        const allNotifications = loadDevNotifications();
        
        const updatedNotifications = allNotifications.map((notif: Notification) => {
          if (notif.id === notification.id) {
            return { ...notif, read: true };
          }
          return notif;
        });
        
        saveDevNotifications(updatedNotifications);
        
        // Atualizar a lista de notificações
        setNotifications(notifications.map(notif => {
          if (notif.id === notification.id) {
            return { ...notif, read: true };
          }
          return notif;
        }));
      } else {
        // Em modo de produção, usamos o Supabase
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notification.id);
          
        if (error) throw error;
        
        // Atualizar a lista de notificações
        fetchNotifications();
      }
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error.message);
      toast.error('Erro ao atualizar notificação');
    }
  };

  // Enviar nova mensagem/notificação
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientName.trim() || !messageTitle.trim() || !messageBody.trim()) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    try {
      const notificationData = {
        title: messageTitle,
        message: messageBody,
        type: 'message' as const,
        date: new Date().toISOString(),
        read: false,
        patient_name: patientName
      };
      
      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        const allNotifications = loadDevNotifications();
        
        const newNotification = {
          id: generateId(),
          ...notificationData
        };
        
        const updatedNotifications = [newNotification, ...allNotifications];
        saveDevNotifications(updatedNotifications);
        
        // Atualizar a lista de notificações se estiver na aba correta
        if (activeTab === 'all' || activeTab === 'message' || activeTab === 'unread') {
          setNotifications([newNotification, ...notifications]);
        }
        
        toast.success('Mensagem enviada com sucesso');
      } else {
        // Em modo de produção, usamos o Supabase
        const { data, error } = await supabase
          .from('notifications')
          .insert([notificationData])
          .select();
          
        if (error) throw error;
        
        if (data && data[0] && (activeTab === 'all' || activeTab === 'message' || activeTab === 'unread')) {
          setNotifications([data[0], ...notifications]);
        }
        
        toast.success('Mensagem enviada com sucesso');
      }
      
      // Fechar modal e limpar campos
      setShowComposeModal(false);
      setPatientName('');
      setMessageTitle('');
      setMessageBody('');
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error.message);
      toast.error(`Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}`);
    }
  };

  // Criar um lembrete automático para todas as consultas do dia seguinte
  const createAppointmentReminders = async () => {
    try {
      setLoading(true);
      
      // Obter a data de amanhã
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
      
      if (DEV_MODE) {
        // Em modo de desenvolvimento, buscamos agendamentos do localStorage
        const storedAppointments = localStorage.getItem('dentclinic-appointments');
        if (!storedAppointments) {
          toast.error('Não há agendamentos para criar lembretes');
          setLoading(false);
          return;
        }
        
        const appointments = JSON.parse(storedAppointments);
        const tomorrowAppointments = appointments.filter(
          (apt: any) => apt.date === tomorrowFormatted && apt.status === 'scheduled'
        );
        
        if (tomorrowAppointments.length === 0) {
          toast.info('Não há consultas agendadas para amanhã');
          setLoading(false);
          return;
        }
        
        // Criar notificações para cada agendamento
        const allNotifications = loadDevNotifications();
        const newNotifications = [];
        
        for (const apt of tomorrowAppointments) {
          const reminder = {
            id: generateId(),
            title: 'Lembrete Automático de Consulta',
            message: `Lembrete: ${apt.patient_name} tem consulta agendada para amanhã às ${apt.time}.`,
            type: 'appointment' as const,
            date: new Date().toISOString(),
            read: false,
            patient_name: apt.patient_name
          };
          
          newNotifications.push(reminder);
        }
        
        const updatedNotifications = [...newNotifications, ...allNotifications];
        saveDevNotifications(updatedNotifications);
        
        // Atualizar a lista de notificações se estiver na aba correta
        if (activeTab === 'all' || activeTab === 'appointment' || activeTab === 'unread') {
          setNotifications([...newNotifications, ...notifications]);
        }
        
        toast.success(`${newNotifications.length} lembretes criados com sucesso`);
      } else {
        // Em modo de produção, usamos o Supabase
        // Buscar agendamentos de amanhã
        const { data: appointments, error: aptError } = await supabase
          .from('appointments')
          .select('*')
          .eq('date', tomorrowFormatted)
          .eq('status', 'scheduled');
          
        if (aptError) throw aptError;
        
        if (!appointments || appointments.length === 0) {
          toast.info('Não há consultas agendadas para amanhã');
          setLoading(false);
          return;
        }
        
        // Criar notificações para cada agendamento
        const reminders = appointments.map(apt => ({
          title: 'Lembrete Automático de Consulta',
          message: `Lembrete: ${apt.patient_name} tem consulta agendada para amanhã às ${apt.time}.`,
          type: 'appointment',
          date: new Date().toISOString(),
          read: false,
          patient_name: apt.patient_name,
          patient_id: apt.patient_id
        }));
        
        const { data, error } = await supabase
          .from('notifications')
          .insert(reminders)
          .select();
          
        if (error) throw error;
        
        toast.success(`${reminders.length} lembretes criados com sucesso`);
        
        // Atualizar a lista de notificações
        fetchNotifications();
      }
    } catch (error: any) {
      console.error('Erro ao criar lembretes:', error.message);
      toast.error(`Erro ao criar lembretes: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Visualizar detalhes da notificação
  const viewNotificationDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetail(true);
    
    // Marcar como lida se ainda não foi lida
    if (!notification.read) {
      markAsRead(notification);
    }
  };

  // Renderizar o ícone correto para o tipo de notificação
  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Formatar data para exibição amigável
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrar notificações não lidas
  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold text-gray-800">Notificações</h2>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} não lidas
            </span>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowComposeModal(true)}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Nova Mensagem
          </button>
          
          <button
            onClick={createAppointmentReminders}
            className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Gerar Lembretes de Consulta
          </button>
        </div>
      </div>

      {/* Tabs de filtragem */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('all')}
            className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Todas
          </button>
          
          <button
            onClick={() => setActiveTab('unread')}
            className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'unread'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Não Lidas
          </button>
          
          <button
            onClick={() => setActiveTab('appointment')}
            className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'appointment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Consultas
          </button>
          
          <button
            onClick={() => setActiveTab('message')}
            className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'message'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mensagens
          </button>
          
          <button
            onClick={() => setActiveTab('alert')}
            className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'alert'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Alertas
          </button>
        </nav>
      </div>

      {/* Lista de notificações */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando notificações...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-gray-500">Nenhuma notificação encontrada</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map(notification => (
              <li 
                key={notification.id}
                className={`hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => viewNotificationDetails(notification)}
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {renderNotificationIcon(notification.type)}
                      
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-blue-800' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                      <p className="text-xs text-gray-500">
                        {formatDate(notification.date)}
                      </p>
                      {!notification.read && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Nova
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal para nova mensagem */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Nova Mensagem
              </h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={sendMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Paciente</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome do paciente"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="Título da mensagem"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Mensagem</label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  rows={4}
                  placeholder="Digite sua mensagem..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalhes da notificação */}
      {showDetail && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center space-x-2">
                {renderNotificationIcon(selectedNotification.type)}
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedNotification.title}
                </h3>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  {formatDate(selectedNotification.date)}
                </p>
                {selectedNotification.patient_name && (
                  <p className="text-sm font-medium text-gray-700">
                    Paciente: {selectedNotification.patient_name}
                  </p>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-800">
                  {selectedNotification.message}
                </p>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowDetail(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {DEV_MODE && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          <p className="font-semibold">Modo de Desenvolvimento Ativo</p>
          <p>As notificações estão sendo salvas no armazenamento local do navegador.</p>
        </div>
      )}
    </div>
  );
}
