import { NavLink } from 'react-router-dom';
import { NAV } from '../../config/navigation';

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">D</div>
          <div>
            <div className="text-base font-semibold leading-none text-white">Dueflow</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">MSME payables agent</div>
          </div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6 pt-2">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">{g.group}</div>
              {g.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'}`
                  }
                >
                  <Icon size={16} /> {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
