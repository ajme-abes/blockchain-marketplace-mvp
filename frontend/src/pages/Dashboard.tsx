// src/pages/Dashboard.tsx - UPDATED VERSION
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import BuyerDashboard from './buyer/BuyerDashboard';
import ProducerDashboard from './producer/ProducerDashboard';
import AdminDashboard from './admin/AdminDashboard';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const userRole = user.role.toLowerCase() as 'buyer' | 'producer' | 'admin';

  // Render role-specific dashboard
  switch (userRole) {
    case 'buyer':
      return <BuyerDashboard />;
    case 'producer':
      return <ProducerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Invalid Role</h2>
            <p className="text-muted-foreground">Please contact support.</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;