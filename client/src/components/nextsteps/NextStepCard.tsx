import { useState } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useAcknowledgedDelta } from "../../hooks/useNextSteps";
import { formatPrice } from "../../utils/formatters";
import type { NextStepRecommendation } from "../../types/nextsteps";

interface NextStepCardProps {
  recommendation: NextStepRecommendation;
  onAddOption?: (ticker: string) => void;
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  sell_covered_call: "Sell Covered Call",
  sell_csp: "Sell Cash-Secured Put",
  neutral: "No Action Needed",
};

export const NextStepCard = ({
  recommendation,
  onAddOption,
}: NextStepCardProps) => {
  const { setDelta, isPending } = useAcknowledgedDelta();
  const [showHoldTarget, setShowHoldTarget] = useState(false);
  const [holdTargetInput, setHoldTargetInput] = useState("");

  const {
    ticker,
    current_price,
    net_stock_delta,
    acknowledged_delta,
    effective_delta,
    open_contracts_count,
    recommendation: rec,
    rationale,
  } = recommendation;

  const isPositiveEffective = effective_delta > 0;

  const handleHoldAsIs = () => {
    // Sets hold target = net_stock_delta, making effective_delta = 0
    setDelta({ ticker, delta: net_stock_delta });
  };

  const handleSaveHoldTarget = () => {
    const val = parseInt(holdTargetInput, 10);
    if (!isNaN(val) && val >= 0) {
      setDelta({ ticker, delta: val });
      setHoldTargetInput("");
      setShowHoldTarget(false);
    }
  };

  const handleOpenHoldTarget = () => {
    setHoldTargetInput(
      acknowledged_delta > 0 ? String(acknowledged_delta) : ""
    );
    setShowHoldTarget(true);
  };

  return (
    <div className="bg-bg-surface border border-slate-700/50 rounded-md p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-slate-100">{ticker}</span>
            {current_price && (
              <span className="text-sm text-slate-400 font-mono">
                {formatPrice(current_price)}
              </span>
            )}
            {open_contracts_count > 0 && (
              <Badge variant="neutral" size="sm">
                {open_contracts_count} open
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-sm text-slate-400">
              Net Delta:{" "}
              <span
                className={`font-mono font-medium ${
                  net_stock_delta > 0 ? "text-profit" : "text-loss"
                }`}
              >
                {net_stock_delta > 0 ? "+" : ""}
                {net_stock_delta} shares
              </span>
            </span>
            {acknowledged_delta !== 0 && (
              <span className="text-sm text-slate-500">
                Hold Target:{" "}
                <span className="font-mono">{acknowledged_delta} shares</span>
                {" · "}Effective:{" "}
                <span
                  className={`font-mono font-medium ${
                    effective_delta > 0
                      ? "text-profit"
                      : effective_delta < 0
                        ? "text-loss"
                        : "text-slate-300"
                  }`}
                >
                  {effective_delta > 0 ? "+" : ""}
                  {effective_delta} shares
                </span>
              </span>
            )}
          </div>
        </div>
        {rec !== "neutral" && (
          <Badge variant={rec === "sell_covered_call" ? "warning" : "info"}>
            {RECOMMENDATION_LABELS[rec]}
          </Badge>
        )}
      </div>

      {/* Rationale */}
      {rec !== "neutral" && (
        <div
          className={`rounded-lg p-3 mb-3 border text-sm text-slate-300 ${
            isPositiveEffective
              ? "bg-warning/10 border-warning/30"
              : "bg-accent/10 border-accent/30"
          }`}
        >
          {rationale}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {rec !== "neutral" && onAddOption && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onAddOption(ticker)}
          >
            Add Option →
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          loading={isPending}
          onClick={handleHoldAsIs}
        >
          Hold as-is
        </Button>
        {!showHoldTarget && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleOpenHoldTarget}
            title="Set the number of shares you want to hold. Recommendations are based on the difference between your net delta and this target."
          >
            Set Hold Target
          </Button>
        )}
      </div>

      {/* Inline hold target input */}
      {showHoldTarget && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
          <span className="text-sm text-slate-400">Shares to hold:</span>
          <input
            type="number"
            value={holdTargetInput}
            onChange={(e) => setHoldTargetInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveHoldTarget()}
            className="w-24 px-2 py-1 text-sm bg-bg-base border border-slate-600 rounded-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            placeholder="0"
            min="0"
            autoFocus
          />
          <Button
            size="sm"
            variant="secondary"
            loading={isPending}
            onClick={handleSaveHoldTarget}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHoldTarget(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
