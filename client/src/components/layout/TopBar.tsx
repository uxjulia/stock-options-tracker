import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { SettingsModal } from "../ui/SettingsModal";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/options": "Options",
  "/pnl": "P&L",
  "/next-steps": "Next Steps",
  "/accounts": "Accounts",
};

export function TopBar() {
  const location = useLocation();
  const { logout } = useAuth();
  const title = pageTitles[location.pathname] ?? "Option Tracker";
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header
      className="lg:hidden sticky top-0 z-30 bg-bg-surface border-b border-slate-700/50 px-4 py-3 flex items-center justify-between"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
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
        <span className="font-semibold text-slate-100">{title}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowSettings(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Settings"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
        <button
          onClick={logout}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Sign out"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </header>
  );
}
