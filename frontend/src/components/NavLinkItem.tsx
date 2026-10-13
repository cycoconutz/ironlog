import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export function NavLinkItem({
  to,
  end,
  icon,
  children,
  onNavigate,
}: {
  to: string;
  end?: boolean;
  icon: ReactNode;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}
