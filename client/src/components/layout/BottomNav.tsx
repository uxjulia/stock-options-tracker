import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";
import {
  ChartCandlestick,
  ChartLine,
  House,
  ListTodo,
  Wallet,
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

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-bg-surface border-t border-slate-700/50 z-40 pb-safe">
      <div className="flex">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors",
                isActive ? "text-accent" : "text-slate-500 hover:text-slate-300"
              )
            }
          >
            {item.icon}
            <span className="leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
