import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { SettingsModal } from "../ui/SettingsModal";
import { LogOut, Settings, TrendingUp } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/options": "Options",
  "/pnl": "P&L",
  "/next-steps": "Next Steps",
  "/accounts": "Accounts",
};

export const TopBar = () => {
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
          <TrendingUp size={18} color="white" />
        </div>
        <span className="font-semibold text-slate-100">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowSettings(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Settings"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={logout}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </header>
  );
};
