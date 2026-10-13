import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from './Logo';
import { NavLinkItem } from './NavLinkItem';
import { UnitToggle } from './UnitToggle';
import {
  IconDashboard,
  IconExercises,
  IconHistory,
  IconLog,
  IconLogout,
  IconMenu,
  IconClose,
  IconRecords,
  IconSettings,
} from './icons';

interface NavItem {
  to: string;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', Icon: IconDashboard, end: true },
  { to: '/log', label: 'Log a session', Icon: IconLog },
  { to: '/history', label: 'History', Icon: IconHistory },
  { to: '/exercises', label: 'Exercises', Icon: IconExercises },
  { to: '/records', label: 'Records', Icon: IconRecords },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <div className={`scrim${menuOpen ? ' is-open' : ''}`} onClick={closeMenu} aria-hidden="true" />
      <aside className={`sidebar${menuOpen ? ' is-open' : ''}`}>
        <div className="sidebar__head">
          <Logo />
          <button
            className="btn btn--quiet btn--icon mobile-only"
            onClick={closeMenu}
            aria-label="Close navigation"
            type="button"
          >
            <IconClose size={18} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Primary">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLinkItem key={to} to={to} end={end} icon={<Icon size={18} />} onNavigate={closeMenu}>
              {label}
            </NavLinkItem>
          ))}
        </nav>

        <div className="sidebar__foot">
          <UnitToggle />
          <div className="sidebar__user">
            <strong className="truncate">{user?.displayName ?? 'Athlete'}</strong>
            <span className="muted truncate" style={{ fontSize: 'var(--fs-sm)' }}>
              {user?.email}
            </span>
          </div>
          <button className="btn btn--ghost btn--block" onClick={handleLogout} type="button">
            <IconLogout size={17} />
            Log out
          </button>
        </div>
      </aside>

      <div className="app-body">
        <header className="mobile-bar">
          <button
            className="btn btn--quiet btn--icon"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            type="button"
          >
            <IconMenu size={20} />
          </button>
          <Logo compact />
          <span
            className="avatar"
            style={{ width: 34, height: 34, fontSize: '0.95rem' }}
            aria-hidden="true"
          >
            {initials(user?.displayName ?? '?')}
          </span>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
