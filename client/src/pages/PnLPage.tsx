import { useState } from "react";
import { PnLChart } from "../components/pnl/PnLChart";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import {
  usePnLByAccount,
  usePnLByTicker,
  usePnLSummary,
  useResumeTracking,
  useResetDeltaFromPnL,
} from "../hooks/usePnL";
import { formatCurrency, formatPercent } from "../utils/formatters";

type Tab = "account" | "ticker";

export const PnLPage = () => {
  const [tab, setTab] = useState<Tab>("account");
  const [year, setYear] = useState<number | undefined>();

  const { data: summary, isLoading: summaryLoading } = usePnLSummary();
  const { data: byAccount, isLoading: accountLoading } = usePnLByAccount(year);
  const { data: byTicker, isLoading: tickerLoading } = usePnLByTicker({ year });

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    undefined,
    currentYear,
    currentYear - 1,
    currentYear - 2,
  ];

  const accountChartData = (byAccount ?? []).map((a) => ({
    name: a.account_name,
    value: a.realized_pnl,
  }));

  const tickerChartData = (byTicker ?? []).slice(0, 15).map((t) => ({
    name: t.ticker,
    value: t.realized_pnl,
  }));

  const monthlyChartData = (summary?.by_month ?? []).map((m) => ({
    name: m.month.slice(5), // show "MM" portion
    value: m.realized_pnl,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-100">P&L Analytics</h1>
        <div className="flex items-center gap-3">
          <select
            className="bg-bg-elevated border border-slate-600 rounded-md px-3 py-1.5 text-sm text-slate-300"
            value={year ?? ""}
            onChange={(e) =>
              setYear(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">All Time</option>
            {yearOptions.filter(Boolean).map((y) => (
              <option key={y} value={y!}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      {summaryLoading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Total Realized
            </p>
            <p
              className={`text-2xl font-bold ${(summary?.total_realized ?? 0) >= 0 ? "text-profit" : "text-loss"}`}
            >
              {formatCurrency(summary?.total_realized ?? 0, true)}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Trades
            </p>
            <p className="text-2xl font-bold text-slate-100">
              {summary?.total_trades ?? 0}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Win Rate
            </p>
            <p
              className={`text-2xl font-bold ${(summary?.win_rate ?? 0) >= 70 ? "text-profit" : "text-warning"}`}
            >
              {formatPercent(summary?.win_rate ?? 0)}
            </p>
          </Card>
        </div>
      )}

      {/* Monthly chart */}
      {summary && summary.by_month.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Monthly P&L
          </h2>
          <PnLChart data={monthlyChartData} />
        </Card>
      )}

      {/* Tab switch */}
      <div>
        <div className="flex gap-1 bg-bg-elevated rounded-md p-1 w-fit mb-4">
          {(["account", "ticker"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-bg-surface text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              By {t === "account" ? "Account" : "Ticker"}
            </button>
          ))}
        </div>

        {tab === "account" ? (
          <div className="space-y-4">
            <Card>
              {accountLoading ? (
                <Spinner />
              ) : (
                <PnLChart data={accountChartData} />
              )}
            </Card>
            <div className="bg-bg-surface border border-slate-700/50 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Trades
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Realized P&L
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                      Win Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {(byAccount ?? []).map((row) => (
                    <tr
                      key={row.account_id}
                      className="hover:bg-bg-elevated/50"
                    >
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {row.account_name}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">
                        {row.trade_count}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-medium ${row.realized_pnl >= 0 ? "text-profit" : "text-loss"}`}
                      >
                        {formatCurrency(row.realized_pnl, true)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 hidden sm:table-cell">
                        {row.trade_count > 0
                          ? formatPercent(
                              Math.round(
                                (row.win_count / row.trade_count) * 100
                              )
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <TickerTable
            byTicker={byTicker ?? []}
            isLoading={tickerLoading}
            chartData={tickerChartData}
          />
        )}
      </div>
    </div>
  );
};

function TickerTable({
  byTicker,
  isLoading,
  chartData,
}: {
  byTicker: import("../types/pnl").PnLByTicker[];
  isLoading: boolean;
  chartData: { name: string; value: number }[];
}) {
  const resumeTracking = useResumeTracking();
  const resetDelta = useResetDeltaFromPnL();

  return (
    <div className="space-y-4">
      <Card>{isLoading ? <Spinner /> : <PnLChart data={chartData} />}</Card>
      <div className="bg-bg-surface border border-slate-700/50 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ticker
              </th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Trades
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Realized P&L
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                Win Rate
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                Stock Delta
              </th>
              <th className="py-3 px-4 hidden md:table-cell" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {byTicker.map((row) => {
              const hasDelta =
                row.net_stock_delta !== 0 || row.hold_target !== 0;
              const isPending =
                (resumeTracking.isPending &&
                  resumeTracking.variables === row.ticker) ||
                (resetDelta.isPending && resetDelta.variables === row.ticker);

              return (
                <tr key={row.ticker} className="hover:bg-bg-elevated/50">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-100">
                    {row.ticker}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    {row.trade_count}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-medium ${row.realized_pnl >= 0 ? "text-profit" : "text-loss"}`}
                  >
                    {formatCurrency(row.realized_pnl, true)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 hidden sm:table-cell">
                    {row.trade_count > 0
                      ? formatPercent(
                          Math.round((row.win_count / row.trade_count) * 100)
                        )
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-right hidden md:table-cell">
                    {hasDelta ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className={`font-mono font-medium ${row.net_stock_delta > 0 ? "text-profit" : row.net_stock_delta < 0 ? "text-loss" : "text-slate-400"}`}
                        >
                          {row.net_stock_delta > 0 ? "+" : ""}
                          {row.net_stock_delta}
                        </span>
                        {row.hold_target !== 0 && (
                          <span className="text-xs text-slate-500">
                            target {row.hold_target} · eff{" "}
                            <span
                              className={
                                row.effective_delta > 0
                                  ? "text-profit"
                                  : row.effective_delta < 0
                                    ? "text-loss"
                                    : "text-slate-400"
                              }
                            >
                              {row.effective_delta > 0 ? "+" : ""}
                              {row.effective_delta}
                            </span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {hasDelta && (
                      <div className="flex items-center justify-end gap-1.5">
                        {row.hold_target !== 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={isPending}
                            onClick={() => resumeTracking.mutate(row.ticker)}
                            title="Clear hold target and resume tracking full net delta"
                          >
                            Resume Tracking
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={isPending}
                          onClick={() => resetDelta.mutate(row.ticker)}
                          title="Permanently reset net delta to 0. Current shares become the new starting point."
                        >
                          Reset Delta
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
