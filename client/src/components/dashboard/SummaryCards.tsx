import { StatCard } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import { useOptions } from "../../hooks/useOptions";
import { usePnLSummary } from "../../hooks/usePnL";
import { formatCurrency, formatPercent } from "../../utils/formatters";
import { calcDaysUntilExpiry } from "../../utils/calculations";

export const SummaryCards = () => {
  const { data: openOptions, isLoading: loadingOptions } = useOptions({
    status: "open",
    limit: 200,
  });
  const { data: pnlSummary, isLoading: loadingPnl } = usePnLSummary();

  if (loadingOptions || loadingPnl) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-bg-surface border border-slate-700/50 rounded-md p-4 sm:p-6 flex items-center justify-center h-24"
          >
            <Spinner size="sm" />
          </div>
        ))}
      </div>
    );
  }

  const openCount = openOptions?.total ?? 0;
  const totalRealized = pnlSummary?.total_realized ?? 0;
  const winRate = pnlSummary?.win_rate ?? 0;

  const expiringThisWeek = (openOptions?.data ?? []).filter(
    (o) =>
      calcDaysUntilExpiry(o.expiration_date) <= 7 &&
      calcDaysUntilExpiry(o.expiration_date) >= 0
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Open Positions"
        value={openCount}
        subvalue="active options"
      />
      <StatCard
        label="Realized P&L"
        value={formatCurrency(totalRealized)}
        subvalue={`${pnlSummary?.total_trades ?? 0} closed trades`}
        valueClass={totalRealized >= 0 ? "text-profit" : "text-loss"}
      />
      <StatCard
        label="Win Rate"
        value={formatPercent(winRate)}
        subvalue={`${pnlSummary?.total_trades ?? 0} trades`}
        valueClass={
          winRate >= 70
            ? "text-profit"
            : winRate >= 50
              ? "text-warning"
              : "text-loss"
        }
      />
      <StatCard
        label="Expiring This Week"
        value={expiringThisWeek}
        subvalue="within 7 days"
        valueClass={expiringThisWeek > 0 ? "text-warning" : "text-slate-100"}
      />
    </div>
  );
};
