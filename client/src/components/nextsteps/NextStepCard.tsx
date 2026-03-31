import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useToggleIgnoreNextSteps } from "../../hooks/useOptions";
import { formatPrice } from "../../utils/formatters";
import type { NextStepRecommendation } from "../../types/nextsteps";
import type { Option } from "../../types/option";

interface NextStepCardProps {
  recommendation: NextStepRecommendation;
  relatedOptions?: Option[];
  onAddOption?: (ticker: string) => void;
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  sell_covered_call: "Sell Covered Call",
  sell_csp: "Sell Cash-Secured Put",
  neutral: "No Action Needed",
};

export function NextStepCard({
  recommendation,
  onAddOption,
}: NextStepCardProps) {
  const toggleIgnore = useToggleIgnoreNextSteps();

  const isPositiveDelta = recommendation.net_stock_delta > 0;

  return (
    <div className="bg-bg-surface border border-slate-700/50 rounded-md p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-slate-100">
              {recommendation.ticker}
            </span>
            {recommendation.current_price && (
              <span className="text-sm text-slate-400 font-mono">
                {formatPrice(recommendation.current_price)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              Net Stock Delta:{" "}
              <span
                className={`font-mono font-medium ${
                  recommendation.net_stock_delta > 0
                    ? "text-profit"
                    : recommendation.net_stock_delta < 0
                      ? "text-loss"
                      : "text-slate-300"
                }`}
              >
                {recommendation.net_stock_delta > 0 ? "+" : ""}
                {recommendation.net_stock_delta} shares
              </span>
            </span>
          </div>
        </div>
        {recommendation.recommendation !== "neutral" && (
          <Badge
            variant={
              recommendation.recommendation === "sell_covered_call"
                ? "warning"
                : "info"
            }
          >
            {RECOMMENDATION_LABELS[recommendation.recommendation]}
          </Badge>
        )}
      </div>

      {!recommendation.is_ignored &&
        recommendation.recommendation !== "neutral" && (
          <div
            className={`rounded-lg p-3 mb-3 border ${
              isPositiveDelta
                ? "bg-warning/10 border-warning/30"
                : "bg-accent/10 border-accent/30"
            }`}
          >
            <p className="text-sm text-slate-300">{recommendation.rationale}</p>
          </div>
        )}

      {recommendation.is_ignored && (
        <div className="rounded-lg p-3 mb-3 bg-slate-700/30 border border-slate-600/30">
          <p className="text-sm text-slate-500 italic">
            This ticker is ignored for next steps recommendations.
          </p>
        </div>
      )}

      {recommendation.open_contracts_count > 0 && (
        <p className="text-xs text-slate-500 mb-3">
          {recommendation.open_contracts_count} open contract
          {recommendation.open_contracts_count > 1 ? "s" : ""} currently active
          on this ticker.
        </p>
      )}

      <div className="flex gap-2">
        {!recommendation.is_ignored &&
          recommendation.recommendation !== "neutral" &&
          onAddOption && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onAddOption(recommendation.ticker)}
            >
              Add Option →
            </Button>
          )}
        <Button
          size="sm"
          variant="secondary"
          loading={toggleIgnore.isPending}
          onClick={() => {
            // Find an option for this ticker to toggle
            // We'll need to pass the option id from parent
          }}
          className="text-xs"
        >
          {recommendation.is_ignored ? "Resume Tracking" : "Ignore"}
        </Button>
      </div>
    </div>
  );
}
