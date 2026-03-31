import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { OptionForm } from "../components/options/OptionForm";
import { Spinner } from "../components/ui/Spinner";
import { useNextSteps } from "../hooks/useNextSteps";
import { useOptions } from "../hooks/useOptions";
import { useToggleIgnoreNextSteps } from "../hooks/useOptions";
import { formatPrice } from "../utils/formatters";
import type { NextStepRecommendation } from "../types/nextsteps";

export function NextStepsPage() {
  const { data: steps, isLoading } = useNextSteps();
  const [addOptionTicker, setAddOptionTicker] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center pt-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasSteps = steps && steps.length > 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100 mb-1">Next Steps</h1>
        <p className="text-sm text-slate-500">
          Wheel strategy recommendations to maintain a net stock delta of 0.
        </p>
      </div>

      {!hasSteps ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-lg font-medium mb-1">All clear!</p>
          <p className="text-sm">
            No next steps needed. Close options as assigned to see
            recommendations here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step) => (
            <NextStepItem
              key={step.ticker}
              step={step}
              onAddOption={(ticker) => setAddOptionTicker(ticker)}
            />
          ))}
        </div>
      )}

      <OptionForm
        isOpen={!!addOptionTicker}
        onClose={() => setAddOptionTicker(null)}
      />
    </div>
  );
}

function NextStepItem({
  step,
  onAddOption,
}: {
  step: NextStepRecommendation;
  onAddOption: (ticker: string) => void;
}) {
  const { data: options } = useOptions({
    ticker: step.ticker,
    status: "all",
    limit: 100,
    show_old: true,
  });
  const toggleIgnore = useToggleIgnoreNextSteps();

  // Find a representative option id for this ticker to toggle ignore
  const optionId = options?.data?.[0]?.id;

  const isPositiveDelta = step.net_stock_delta > 0;

  const recommendationLabel = {
    sell_covered_call: "Sell Covered Call",
    sell_csp: "Sell Cash-Secured Put",
    neutral: "No Action",
  }[step.recommendation];

  return (
    <div className="bg-bg-surface border border-slate-700/50 rounded-md p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg font-bold text-slate-100">
              {step.ticker}
            </span>
            {step.current_price && (
              <span className="text-sm text-slate-400 font-mono">
                {formatPrice(step.current_price)}
              </span>
            )}
            {step.open_contracts_count > 0 && (
              <Badge variant="neutral" size="sm">
                {step.open_contracts_count} open
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Net Delta:{" "}
            <span
              className={`font-mono font-medium ${
                step.net_stock_delta > 0 ? "text-profit" : "text-loss"
              }`}
            >
              {step.net_stock_delta > 0 ? "+" : ""}
              {step.net_stock_delta} shares
            </span>
          </p>
        </div>
        {step.recommendation !== "neutral" && (
          <Badge
            variant={
              step.recommendation === "sell_covered_call" ? "warning" : "info"
            }
          >
            {recommendationLabel}
          </Badge>
        )}
      </div>

      {!step.is_ignored && step.recommendation !== "neutral" && (
        <div
          className={`rounded-md p-3 mb-3 border text-sm text-slate-300 ${
            isPositiveDelta
              ? "bg-warning/10 border-warning/30"
              : "bg-accent/10 border-accent/30"
          }`}
        >
          {step.rationale}
        </div>
      )}

      {step.is_ignored && (
        <div className="rounded-md p-3 mb-3 bg-slate-700/30 border border-slate-600/30">
          <p className="text-sm text-slate-500 italic">
            This ticker is excluded from next steps recommendations.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {!step.is_ignored && step.recommendation !== "neutral" && (
          <Button size="sm" onClick={() => onAddOption(step.ticker)}>
            + Add Option
          </Button>
        )}
        {optionId && (
          <Button
            size="sm"
            variant="secondary"
            loading={toggleIgnore.isPending}
            onClick={() =>
              toggleIgnore.mutate({ id: optionId, ignore: !step.is_ignored })
            }
          >
            {step.is_ignored ? "Resume Tracking" : "Ignore"}
          </Button>
        )}
      </div>
    </div>
  );
}
