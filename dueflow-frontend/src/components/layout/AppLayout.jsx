import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectToken } from '../../features/auth/authSlice';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const token = useSelector(selectToken);
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return (
    <div className="min-h-screen">
      <Sidebar open={menu} onClose={() => setMenu(false)} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setMenu(true)} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
