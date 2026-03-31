import { useState } from "react";
import { SummaryCards } from "../components/dashboard/SummaryCards";
import { ExpirationAlerts } from "../components/dashboard/ExpirationAlerts";
import { OptionsTable } from "../components/options/OptionsTable";
import { OptionForm } from "../components/options/OptionForm";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { useOptions } from "../hooks/useOptions";
import { useUIStore } from "../store/uiStore";
import { Plus } from "lucide-react";

export function DashboardPage() {
  const [addOpen, setAddOpen] = useState(false);
  const { showOldOptions, setShowOldOptions } = useUIStore();
  const { data, isLoading } = useOptions({
    status: "open",
    show_old: showOldOptions,
    limit: 100,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus size={12} strokeWidth={3} /> Add Option
        </Button>
      </div>

      <SummaryCards />
      <ExpirationAlerts />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Open Positions
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-accent"
              checked={showOldOptions}
              onChange={(e) => setShowOldOptions(e.target.checked)}
            />
            <span className="text-xs text-slate-500">Show &gt;30 days old</span>
          </label>
        </div>

        <div className="bg-bg-surface border border-slate-700/50 rounded-md overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <OptionsTable options={data?.data ?? []} />
          )}
        </div>
      </div>

      <OptionForm isOpen={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
