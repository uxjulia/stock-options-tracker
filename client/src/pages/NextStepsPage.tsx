import { useState } from "react";
import { Spinner } from "../components/ui/Spinner";
import { OptionForm } from "../components/options/OptionForm";
import { NextStepCard } from "../components/nextsteps/NextStepCard";
import { useNextSteps } from "../hooks/useNextSteps";

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
          Wheel strategy recommendations based on your net stock delta.
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
            <NextStepCard
              key={step.ticker}
              recommendation={step}
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
