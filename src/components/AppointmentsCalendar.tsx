import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, X, ChevronLeft, ChevronRight, AlertTriangle, Search } from 'lucide-react';

// Verificar se estamos em modo de desenvolvimento
const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true';

// Horários disponíveis para agendamento (8h às 18h, intervalos de 30min)
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

interface Appointment {
  id: string;
  patient_name: string;
  patient_id?: string;
  date: string;
  time: string;
  created_at: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export function AppointmentsCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const patientInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [selectedDate]);

  // Função para gerar um ID único para o modo de desenvolvimento
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Função para carregar agendamentos do localStorage no modo de desenvolvimento
  const loadDevAppointments = () => {
    try {
      const storedAppointments = localStorage.getItem('dentclinic-appointments');
      if (storedAppointments) {
        return JSON.parse(storedAppointments);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos do localStorage:', error);
    }
    return [];
  };

  // Função para salvar agendamentos no localStorage no modo de desenvolvimento
  const saveDevAppointments = (appointmentsData: Appointment[]) => {
    try {
      localStorage.setItem('dentclinic-appointments', JSON.stringify(appointmentsData));
    } catch (error) {
      console.error('Erro ao salvar agendamentos no localStorage:', error);
    }
  };

  // Função para carregar pacientes do localStorage no modo de desenvolvimento
  const loadDevPatients = () => {
    try {
      const storedPatients = localStorage.getItem('dentclinic-patients');
      if (storedPatients) {
        return JSON.parse(storedPatients);
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes do localStorage:', error);
    }
    return [];
  };

  // Função para buscar todos os pacientes cadastrados
  const fetchPatients = async () => {
    try {
      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        const devPatients = loadDevPatients();
        setPatients(devPatients);
        return;
      }

      // Em modo de produção, usamos o Supabase
      const { data, error } = await supabase
        .from('patients')
        .select('*');

      if (error) {
        throw error;
      }

      setPatients(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar pacientes:', error.message);
    }
  };

  // Função para buscar pacientes à medida que a secretária digita
  const searchPatients = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setPatientSearchResults([]);
      setShowPatientSuggestions(false);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const results = patients.filter((patient) => {
      const patientName = patient.name || '';
      return patientName.toLowerCase().includes(searchTermLower);
    });

    setPatientSearchResults(results);
    setShowPatientSuggestions(true);
  };

  // Função para selecionar um paciente da lista de sugestões
  const selectPatient = (patient: Patient) => {
    setPatientName(patient.name);
    setShowPatientSuggestions(false);
  };

  // Função para lidar com a mudança no campo de nome do paciente
  const handlePatientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPatientName(value);
    searchPatients(value);
  };

  // Fechar sugestões ao clicar fora do campo
  const handleClickOutside = (e: MouseEvent) => {
    if (patientInputRef.current && !patientInputRef.current.contains(e.target as Node)) {
      setShowPatientSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        const devAppointments = loadDevAppointments();
        const filteredAppointments = devAppointments.filter((apt: Appointment) => {
          return apt.date === formatDate(selectedDate);
        });
        setAppointments(filteredAppointments);
        setLoading(false);
        return;
      }

      // Em modo de produção, usamos o Supabase
      const formattedDate = formatDate(selectedDate);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', formattedDate)
        .order('time', { ascending: true });

      if (error) {
        throw error;
      }

      setAppointments(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos:', error.message);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  // Formatar data como YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Formatar data para exibição
  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Verificar se um horário está disponível
  const isTimeSlotAvailable = (time: string): boolean => {
    return !appointments.some(apt => 
      apt.time === time && apt.status !== 'cancelled'
    );
  };

  // Obter o agendamento em um horário específico
  const getAppointmentAtTime = (time: string): Appointment | undefined => {
    return appointments.find(apt => 
      apt.time === time && apt.status !== 'cancelled'
    );
  };

  // Abrir modal para agendar
  const openAppointmentModal = (time: string) => {
    setSelectedTime(time);
    setPatientName('');
    setNotes('');
    setShowAppointmentModal(true);
  };

  // Abrir modal para cancelar
  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  // Navegar para o dia anterior
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // Navegar para o próximo dia
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Agendar consulta
  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientName.trim()) {
      toast.error('Por favor, informe o nome do paciente');
      return;
    }
    
    try {
      const appointmentData = {
        patient_name: patientName,
        date: formatDate(selectedDate),
        time: selectedTime,
        notes,
        status: 'scheduled' as const,
        created_at: new Date().toISOString()
      };
      
      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        const allAppointments = loadDevAppointments();
        
        // Verificar se já existe agendamento neste horário
        const conflictingAppointment = allAppointments.find((apt: Appointment) => 
          apt.date === appointmentData.date && 
          apt.time === appointmentData.time && 
          apt.status !== 'cancelled'
        );
        
        if (conflictingAppointment) {
          toast.error('Este horário já está ocupado');
          return;
        }
        
        const newAppointment = {
          id: generateId(),
          ...appointmentData
        };
        
        const updatedAppointments = [...allAppointments, newAppointment];
        saveDevAppointments(updatedAppointments);
        
        // Atualizar a lista de consultas do dia atual
        setAppointments([...appointments, newAppointment]);
        toast.success('Consulta agendada com sucesso');
      } else {
        // Em modo de produção, usamos o Supabase
        const { data, error } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select();
          
        if (error) throw error;
        
        if (data && data[0]) {
          setAppointments([...appointments, data[0]]);
        }
        
        toast.success('Consulta agendada com sucesso');
      }
      
      // Fechar modal
      setShowAppointmentModal(false);
      setShowConfirmation(true);
      
      // Esconder confirmação após 3 segundos
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Erro ao agendar consulta:', error.message);
      toast.error(`Erro ao agendar consulta: ${error.message || 'Erro desconhecido'}`);
    }
  };

  // Cancelar consulta
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        const allAppointments = loadDevAppointments();
        
        const updatedAppointments = allAppointments.map((apt: Appointment) => {
          if (apt.id === selectedAppointment.id) {
            return { ...apt, status: 'cancelled' };
          }
          return apt;
        });
        
        saveDevAppointments(updatedAppointments);
        
        // Atualizar a lista de consultas do dia atual
        setAppointments(appointments.map(apt => {
          if (apt.id === selectedAppointment.id) {
            return { ...apt, status: 'cancelled' };
          }
          return apt;
        }));
        
        toast.success('Consulta cancelada com sucesso');
      } else {
        // Em modo de produção, usamos o Supabase
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', selectedAppointment.id);
          
        if (error) throw error;
        
        // Atualizar a lista de consultas
        fetchAppointments();
        toast.success('Consulta cancelada com sucesso');
      }
      
      // Fechar modal
      setShowCancelModal(false);
      
    } catch (error: any) {
      console.error('Erro ao cancelar consulta:', error.message);
      toast.error(`Erro ao cancelar consulta: ${error.message || 'Erro desconhecido'}`);
    }
  };

  // Renderizar slots de horário
  const renderTimeSlots = () => {
    return TIME_SLOTS.map(time => {
      const isAvailable = isTimeSlotAvailable(time);
      const appointment = getAppointmentAtTime(time);
      
      return (
        <div 
          key={time}
          className={`p-4 border rounded-md flex flex-col ${
            isAvailable 
              ? 'hover:bg-blue-50 cursor-pointer border-gray-200' 
              : 'bg-gray-50 border-gray-300'
          }`}
          onClick={() => isAvailable && openAppointmentModal(time)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{time}</span>
            {isAvailable ? (
              <span className="text-green-600 text-sm font-medium">Disponível</span>
            ) : (
              <span className="text-red-600 text-sm font-medium">Ocupado</span>
            )}
          </div>
          
          {!isAvailable && appointment && (
            <div>
              <div className="text-sm text-gray-800">{appointment.patient_name}</div>
              {appointment.notes && (
                <div className="text-xs text-gray-500 mt-1">{appointment.notes}</div>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openCancelModal(appointment);
                }}
                className="mt-2 text-xs text-red-600 hover:text-red-800"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Agendamentos</h2>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <h3 className="text-lg font-semibold text-center">
            {formatDisplayDate(selectedDate)}
          </h3>
          
          <button
            onClick={goToNextDay}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando agenda...</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {renderTimeSlots()}
            </div>
          </div>
        )}
      </div>

      {/* Modal para agendar consulta */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Agendar Consulta - {selectedDate.toLocaleDateString()} às {selectedTime}
              </h3>
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleScheduleAppointment} className="p-6 space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">Nome do Paciente*</label>
                <div className="relative">
                  <input
                    ref={patientInputRef}
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 pl-8 focus:ring-blue-500 focus:border-blue-500"
                    value={patientName}
                    onChange={handlePatientNameChange}
                    placeholder="Digite o nome do paciente"
                    required
                  />
                  <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                </div>
                
                {/* Lista de sugestões de pacientes */}
                {showPatientSuggestions && patientSearchResults.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto">
                    {patientSearchResults.map((patient) => (
                      <li
                        key={patient.id}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        onClick={() => selectPatient(patient)}
                      >
                        <div>
                          <span className="font-medium">{patient.name}</span>
                          {patient.phone && (
                            <span className="text-gray-500 text-xs ml-2">
                              {patient.phone}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Motivo da consulta, procedimentos previstos, etc."
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAppointmentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para cancelar consulta */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Cancelar Consulta
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900">
                    Tem certeza que deseja cancelar esta consulta?
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Paciente: {selectedAppointment.patient_name}<br />
                    Data: {new Date(selectedAppointment.date).toLocaleDateString()}<br />
                    Horário: {selectedAppointment.time}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleCancelAppointment}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificação de confirmação */}
      {showConfirmation && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 rounded-lg shadow-lg p-4 max-w-md animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Agendamento confirmado!</h3>
              <div className="mt-1 text-sm text-green-700">
                <p>{patientName} - {selectedDate.toLocaleDateString()} às {selectedTime}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {DEV_MODE && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          <p className="font-semibold">Modo de Desenvolvimento Ativo</p>
          <p>Os agendamentos estão sendo salvos no armazenamento local do navegador.</p>
        </div>
      )}
    </div>
  );
}