import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Verificar se estamos em modo de desenvolvimento
const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true';

interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

// Categorias de receitas e despesas
const INCOME_CATEGORIES = [
  'Consulta',
  'Procedimento',
  'Produto',
  'Outro'
];

const EXPENSE_CATEGORIES = [
  'Material',
  'Salário',
  'Aluguel',
  'Marketing',
  'Impostos',
  'Manutenção',
  'Utilidades',
  'Outro'
];

export function FinancialDashboard() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'income',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: INCOME_CATEGORIES[0]
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    fetchRecords();
  }, []);

  // Função para gerar um ID único para o modo de desenvolvimento
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Função para carregar registros financeiros do localStorage no modo de desenvolvimento
  const loadDevRecords = () => {
    try {
      const storedRecords = localStorage.getItem('dentclinic-financial-records');
      if (storedRecords) {
        return JSON.parse(storedRecords);
      }
    } catch (error) {
      console.error('Erro ao carregar registros do localStorage:', error);
    }
    return [];
  };

  // Função para salvar registros financeiros no localStorage no modo de desenvolvimento
  const saveDevRecords = (recordsData: FinancialRecord[]) => {
    try {
      localStorage.setItem('dentclinic-financial-records', JSON.stringify(recordsData));
    } catch (error) {
      console.error('Erro ao salvar registros no localStorage:', error);
    }
  };

  async function fetchRecords() {
    try {
      setLoading(true);

      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        const devRecords = loadDevRecords();
        setRecords(devRecords);
        setLoading(false);
        return;
      }

      // Em modo de produção, usamos o Supabase
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      toast.error('Erro ao carregar registros financeiros');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newRecord.description.trim() || !newRecord.amount || parseFloat(newRecord.amount) <= 0) {
      toast.error('Por favor, preencha todos os campos corretamente');
      return;
    }
    
    try {
      if (DEV_MODE) {
        // Em modo de desenvolvimento, usamos o localStorage
        const recordData = {
          id: generateId(),
          type: newRecord.type as 'income' | 'expense',
          description: newRecord.description,
          amount: parseFloat(newRecord.amount),
          date: newRecord.date,
          category: newRecord.category
        };
        
        const devRecords = loadDevRecords();
        const updatedRecords = [recordData, ...devRecords];
        saveDevRecords(updatedRecords);
        
        setRecords(updatedRecords);
        toast.success('Registro adicionado com sucesso!');
        setShowForm(false);
        
        // Reset form
        setNewRecord({
          type: 'income',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          category: INCOME_CATEGORIES[0]
        });
        
        return;
      }
      
      // Em modo de produção, usamos o Supabase
      const { error } = await supabase
        .from('financial_records')
        .insert([{
          type: newRecord.type,
          description: newRecord.description,
          amount: parseFloat(newRecord.amount),
          date: newRecord.date,
          category: newRecord.category
        }]);

      if (error) throw error;

      toast.success('Registro adicionado com sucesso!');
      setShowForm(false);
      fetchRecords();
      
      // Reset form
      setNewRecord({
        type: 'income',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: INCOME_CATEGORIES[0]
      });
      
    } catch (error) {
      toast.error('Erro ao adicionar registro');
      console.error(error);
    }
  }

  // Filtra os registros com base nos filtros selecionados
  const filteredRecords = records.filter((record) => {
    // Filtrar por tipo (receita ou despesa)
    if (selectedType !== 'all' && record.type !== selectedType) {
      return false;
    }
    
    // Filtrar por categoria
    if (selectedCategory && record.category !== selectedCategory) {
      return false;
    }
    
    return true;
  });

  const totalIncome = filteredRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpenses = filteredRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const balance = totalIncome - totalExpenses;
  
  // Função auxiliar para obter as categorias disponíveis com base no tipo selecionado
  const getCategoriesForType = (type: string) => {
    if (type === 'income') return INCOME_CATEGORIES;
    return EXPENSE_CATEGORIES;
  };
  
  // Função auxiliar para formatar valores monetários
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Receitas Totais</h3>
          <p className="text-2xl font-semibold text-green-600">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Despesas Totais</h3>
          <p className="text-2xl font-semibold text-red-600">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Saldo</h3>
          <p className={`text-2xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <h2 className="text-lg font-semibold text-gray-800">Registros Financeiros</h2>
          
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
            {/* Filtros */}
            <div className="flex space-x-3">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as 'all' | 'income' | 'expense');
                  setSelectedCategory(null); // Reset category when type changes
                }}
                className="block w-full md:w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="all">Todos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
              
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="block w-full md:w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="">Todas as Categorias</option>
                {selectedType === 'all' && (
                  <>
                    <optgroup label="Receitas">
                      {INCOME_CATEGORIES.map(category => (
                        <option key={`income-${category}`} value={category}>{category}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Despesas">
                      {EXPENSE_CATEGORIES.map(category => (
                        <option key={`expense-${category}`} value={category}>{category}</option>
                      ))}
                    </optgroup>
                  </>
                )}
                {selectedType !== 'all' && (
                  getCategoriesForType(selectedType).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))
                )}
              </select>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full md:w-auto"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Novo Registro</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-6">
            <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum registro encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedType !== 'all' || selectedCategory
                ? 'Tente alterar os filtros ou adicione um novo registro.'
                : 'Comece adicionando um novo registro financeiro.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 px-4">Data</th>
                  <th className="pb-3 px-4">Descrição</th>
                  <th className="pb-3 px-4">Categoria</th>
                  <th className="pb-3 px-4">Tipo</th>
                  <th className="pb-3 px-4">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b">
                    <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{record.description}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        {record.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className={`py-3 px-4 ${
                      record.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(record.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Novo Registro Financeiro</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={newRecord.type}
                  onChange={(e) => {
                    const type = e.target.value as 'income' | 'expense';
                    setNewRecord({ 
                      ...newRecord, 
                      type, 
                      category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  value={newRecord.category}
                  onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {newRecord.type === 'income'
                    ? INCOME_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))
                    : EXPENSE_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <input
                  type="text"
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newRecord.amount}
                  onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Data</label>
                <input
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {DEV_MODE && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          <p className="font-semibold">Modo de Desenvolvimento Ativo</p>
          <p>Os registros financeiros estão sendo salvos no armazenamento local do navegador.</p>
        </div>
      )}
    </div>
  );
}