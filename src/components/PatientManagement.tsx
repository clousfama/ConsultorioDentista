import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Search, UserPlus, Edit, Trash2, X } from 'lucide-react';

// Verificar se estamos em modo de desenvolvimento
const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  address: string;
  created_at: string;
}

export function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  // Função para gerar um ID único para o modo de desenvolvimento
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
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

  // Função para salvar pacientes no localStorage no modo de desenvolvimento
  const saveDevPatients = (patientsData: Patient[]) => {
    try {
      localStorage.setItem('dentclinic-patients', JSON.stringify(patientsData));
    } catch (error) {
      console.error('Erro ao salvar pacientes no localStorage:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);

      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        const devPatients = loadDevPatients();
        setPatients(devPatients);
        setLoading(false);
        return;
      }

      // Em modo de produção, usamos o Supabase
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setPatients(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar pacientes:', error.message);
      toast.error('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setBirthDate('');
    setAddress('');
    setEditingPatient(null);
  };

  const openForm = (patient: Patient | null = null) => {
    if (patient) {
      setEditingPatient(patient);
      setName(patient.name);
      setEmail(patient.email);
      setPhone(patient.phone);
      setBirthDate(patient.birth_date ? patient.birth_date.substring(0, 10) : '');
      setAddress(patient.address);
    } else {
      resetForm();
    }
    
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!name || !email || !phone) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
      
      const patientData = {
        name,
        email,
        phone,
        birth_date: birthDate,
        address
      };
      
      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        if (editingPatient) {
          // Atualizando paciente existente
          const updatedPatients = patients.map(p => 
            p.id === editingPatient.id 
              ? { ...p, ...patientData, updated_at: new Date().toISOString() } 
              : p
          );
          setPatients(updatedPatients);
          saveDevPatients(updatedPatients);
          toast.success('Paciente atualizado com sucesso!');
        } else {
          // Criando novo paciente
          const newPatient = {
            id: generateId(),
            ...patientData,
            created_at: new Date().toISOString()
          };
          const newPatients = [...patients, newPatient];
          setPatients(newPatients);
          saveDevPatients(newPatients);
          toast.success('Paciente cadastrado com sucesso!');
        }
        
        setShowForm(false);
        resetForm();
        return;
      }
      
      // Em modo de produção, usamos o Supabase
      if (editingPatient) {
        // Atualizando paciente existente
        const { error } = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', editingPatient.id);
        
        if (error) throw error;
        
        toast.success('Paciente atualizado com sucesso!');
      } else {
        // Criando novo paciente
        const { error } = await supabase
          .from('patients')
          .insert([{ ...patientData, created_at: new Date().toISOString() }]);
        
        if (error) throw error;
        
        toast.success('Paciente cadastrado com sucesso!');
      }
      
      // Recarregar lista e fechar formulário
      fetchPatients();
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar paciente:', error.message);
      toast.error(`Erro ao salvar paciente: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) return;
    
    try {
      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        const updatedPatients = patients.filter(patient => patient.id !== id);
        setPatients(updatedPatients);
        saveDevPatients(updatedPatients);
        toast.success('Paciente excluído com sucesso');
        return;
      }
      
      // Em modo de produção, usamos o Supabase
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setPatients(patients.filter(patient => patient.id !== id));
      toast.success('Paciente excluído com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir paciente:', error.message);
      toast.error(`Erro ao excluir paciente: ${error.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Pacientes</h2>
        <button
          onClick={() => openForm()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5" />
          <span>Novo Paciente</span>
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar paciente..."
              className="pl-10 pr-4 py-2 border rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando pacientes...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Nascimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{patient.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openForm(patient)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for adding/editing patients */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome completo*</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email*</label>
                <input
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone*</label>
                <input
                  type="tel"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                <input
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Endereço</label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingPatient ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {DEV_MODE && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          <p className="font-semibold">Modo de Desenvolvimento Ativo</p>
          <p>Os pacientes estão sendo salvos no armazenamento local do navegador.</p>
        </div>
      )}
    </div>
  );
}
