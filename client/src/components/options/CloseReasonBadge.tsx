import { Badge } from "../ui/Badge";
import type { CloseReason } from "../../types/option";

const CLOSE_REASON_LABELS: Record<CloseReason, string> = {
  expired: "Expired",
  assigned: "Assigned",
  closed_early: "Closed Early",
  rolled: "Rolled",
};

const CLOSE_REASON_VARIANTS: Record<
  CloseReason,
  "success" | "warning" | "info" | "neutral"
> = {
  expired: "success",
  assigned: "warning",
  closed_early: "neutral",
  rolled: "info",
};

interface CloseReasonBadgeProps {
  closeReason: CloseReason | null;
  rolledFromOptionId: number | null;
  onViewChain: () => void;
}

export const CloseReasonBadge = ({
  closeReason,
  rolledFromOptionId,
  onViewChain,
}: CloseReasonBadgeProps) => {
  const isPartOfChain =
    closeReason === "rolled" || rolledFromOptionId !== null;

  if (!closeReason && !isPartOfChain) return null;

  const label = closeReason ? CLOSE_REASON_LABELS[closeReason] : "Rolled";

  if (isPartOfChain) {
    return (
      <button
        type="button"
        onClick={onViewChain}
        title="View roll chain"
        className="cursor-pointer"
      >
        <Badge variant="info" size="sm">
          {label} ↗
        </Badge>
      </button>
    );
  }

  return (
    <Badge variant={CLOSE_REASON_VARIANTS[closeReason!]} size="sm">
      {label}
    </Badge>
  );
};
