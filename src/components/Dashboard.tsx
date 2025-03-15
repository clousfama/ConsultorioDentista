import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Sidebar } from './Sidebar';
import { FinancialDashboard } from './FinancialDashboard';
import { Notifications } from './Notifications';
import { AppointmentsCalendar } from './AppointmentsCalendar';
import { UserProfile } from './UserProfile';
import { PatientManagement } from './PatientManagement';
import { LogOut, Bell } from 'lucide-react';

export function Dashboard() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      
      <div className="flex-1">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-800">DentClinic</h1>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Routes>
            <Route path="/" element={<FinancialDashboard />} />
            <Route path="/patients" element={<PatientManagement />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/appointments" element={<AppointmentsCalendar />} />
            <Route path="/profile" element={<UserProfile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}