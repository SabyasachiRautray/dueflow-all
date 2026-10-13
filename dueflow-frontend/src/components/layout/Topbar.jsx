import { useDispatch, useSelector } from 'react-redux';
import { LogOut, Menu } from 'lucide-react';
import { logout, selectUser } from '../../features/auth/authSlice';
import { api } from '../../services';
import Badge from '../ui/Badge';

export default function Topbar({ onMenu }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const signOut = () => {
    dispatch(logout());
    dispatch(api.util.resetApiState()); // drop cached tenant data
  };
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-8">
      <button type="button" onClick={onMenu} aria-label="Open menu" className="rounded p-2 text-slate-600 hover:bg-slate-100 lg:hidden"><Menu size={20} /></button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium leading-tight text-slate-900">{user?.name || user?.email}</div>
          <div className="mt-0.5"><Badge value={user?.role} tone="blue" /></div>
        </div>
        <button type="button" onClick={signOut} aria-label="Sign out" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><LogOut size={18} /></button>
      </div>
    </header>
  );
}
