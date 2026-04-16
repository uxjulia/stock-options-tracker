import type { Option } from "../../types/option";
import {
  getBreakevenColorClass,
  calcDaysUntilExpiry,
} from "../../utils/calculations";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  formatCurrency,
  formatDate,
  formatPrice,
} from "../../utils/formatters";
import { Pencil, SquareCheckBig, X } from "lucide-react";
import { CloseReasonBadge } from "./CloseReasonBadge";

export const OptionCard = ({
  option,
  showAccount,
  onEdit,
  onClose,
  onDelete,
  onViewChain,
}: {
  option: Option;
  showAccount: boolean;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
  onViewChain: () => void;
}) => {
  const daysUntilExpiry = calcDaysUntilExpiry(option.expiration_date);
  const isOpen = !option.date_closed;
  const isCritical = isOpen && daysUntilExpiry <= 3;
  const isWarning = isOpen && daysUntilExpiry > 3 && daysUntilExpiry <= 7;

  const expiryLabel = !isOpen
    ? "—"
    : daysUntilExpiry < 0
      ? "Expired"
      : daysUntilExpiry === 0
        ? "Today"
        : `${daysUntilExpiry}d`;

  const expiryColor = !isOpen
    ? "text-slate-600"
    : daysUntilExpiry < 0
      ? "text-slate-600"
      : isCritical
        ? "text-danger font-semibold"
        : isWarning
          ? "text-warning"
          : "text-slate-400";

  return (
    <div className="px-3 py-3 space-y-2">
      {/* Row 1: Ticker + badges + proceeds */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-slate-100">{option.ticker}</span>
          <Badge
            variant={option.direction === "sold" ? "success" : "info"}
            size="sm"
          >
            {option.direction === "sold" ? "SOLD" : "BUY"}
          </Badge>
          <Badge
            variant={option.option_type === "call" ? "info" : "warning"}
            size="sm"
          >
            {option.option_type.toUpperCase()}
          </Badge>
        </div>
        <span
          className={`font-mono text-sm font-medium shrink-0 ${option.proceeds >= 0 ? "text-profit" : "text-loss"}`}
        >
          {formatCurrency(option.proceeds, true)}
        </span>
      </div>

      {/* Row 2: Key numbers grid */}
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
        <div>
          <span className="text-slate-500 block">Strike</span>
          <span className="font-mono text-slate-200">
            {formatPrice(option.strike_price)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Price</span>
          <span
            className={`font-mono ${option.price_stale ? "text-slate-500" : "text-slate-300"}`}
          >
            {option.current_price ? (
              <>
                {formatPrice(option.current_price)}
                {option.price_is_manual && (
                  <span className="text-slate-500 ml-0.5">M</span>
                )}
              </>
            ) : (
              <span className="text-slate-600">—</span>
            )}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Breakeven</span>
          <span
            className={`font-mono ${getBreakevenColorClass(option, isOpen)}`}
          >
            {formatPrice(option.breakeven)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Expiry</span>
          <span
            className={
              isCritical
                ? "text-danger font-medium"
                : isWarning
                  ? "text-warning"
                  : "text-slate-400"
            }
          >
            {formatDate(option.expiration_date)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Exp In</span>
          <span className={expiryColor}>{expiryLabel}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Qty</span>
          <span className="text-slate-400">{option.quantity}</span>
        </div>
      </div>

      {/* Row 3: Account + close reason + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {showAccount && (
            <span className="text-xs text-slate-500 truncate">
              {option.account_name}
            </span>
          )}
          <CloseReasonBadge
            closeReason={option.close_reason}
            rolledFromOptionId={option.rolled_from_option_id}
            onViewChain={onViewChain}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isOpen && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              title="Close option"
            >
              <SquareCheckBig size={14} />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onEdit} title="Edit">
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} title="Delete">
            <X size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};
