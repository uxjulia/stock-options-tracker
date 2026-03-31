import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";
import { useAuth } from "../../hooks/useAuth";
import { SettingsModal } from "../ui/SettingsModal";
import {
  House,
  ChartCandlestick,
  ChartLine,
  ListTodo,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: <House size={20} />,
  },
  {
    to: "/options",
    label: "Options",
    icon: <ChartCandlestick size={20} />,
  },
  {
    to: "/pnl",
    label: "P&L",
    icon: <ChartLine size={20} />,
  },
  {
    to: "/next-steps",
    label: "Next Steps",
    icon: <ListTodo size={20} />,
  },
  {
    to: "/accounts",
    label: "Accounts",
    icon: <Wallet size={20} />,
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-bg-surface border-r border-slate-700/50 min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <span className="font-semibold text-slate-100">Option Tracker</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-slate-400 hover:text-slate-200 hover:bg-bg-elevated"
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 bg-accent/20 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-accent">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm text-slate-400 flex-1 truncate">
            {user?.username}
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={logout}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </aside>
  );
}
