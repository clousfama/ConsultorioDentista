import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { UserCircle } from 'lucide-react';

export function UserProfile() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <UserCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Perfil do Usuário</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Função</label>
            <p className="text-gray-900">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}