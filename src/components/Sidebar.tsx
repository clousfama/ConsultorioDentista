import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutDashboard,
  Calendar,
  Bell,
  DollarSign,
  UserCircle,
  Settings,
  Users
} from 'lucide-react';

export function Sidebar() {
  const { user } = useAuthStore();

  const menuItems = [
    {
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: 'Dashboard'
    },
    {
      path: '/dashboard/patients',
      icon: <Users className="w-5 h-5" />,
      label: 'Pacientes'
    },
    {
      path: '/dashboard/appointments',
      icon: <Calendar className="w-5 h-5" />,
      label: 'Agendamentos'
    },
    {
      path: '/dashboard/notifications',
      icon: <Bell className="w-5 h-5" />,
      label: 'Notificações'
    }
  ];

  if (user?.role === 'admin') {
    menuItems.push({
      path: '/dashboard/financial',
      icon: <DollarSign className="w-5 h-5" />,
      label: 'Financeiro'
    });
  }

  menuItems.push(
    {
      path: '/dashboard/profile',
      icon: <UserCircle className="w-5 h-5" />,
      label: 'Perfil'
    },
    {
      path: '/dashboard/settings',
      icon: <Settings className="w-5 h-5" />,
      label: 'Configurações'
    }
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800">DentClinic</h2>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-blue-600 ${
                isActive ? 'text-blue-600 bg-blue-50' : ''
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}