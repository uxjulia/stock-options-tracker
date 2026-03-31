import { useState } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { OptionForm } from "./OptionForm";
import { CloseOptionForm } from "./CloseOptionForm";
import { useDeleteOption } from "../../hooks/useOptions";
import {
  formatCurrency,
  formatDate,
  formatPrice,
} from "../../utils/formatters";
import { calcDaysUntilExpiry } from "../../utils/calculations";
import type { Option } from "../../types/option";
import { Pencil, SquareCheckBig, X } from "lucide-react";

interface OptionsTableProps {
  options: Option[];
  showAccount?: boolean;
}

export function OptionsTable({
  options,
  showAccount = true,
}: OptionsTableProps) {
  const [editOption, setEditOption] = useState<Option | null>(null);
  const [closeOption, setCloseOption] = useState<Option | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Option | null>(null);
  const deleteOption = useDeleteOption();

  if (options.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-lg mb-1">No options found</p>
        <p className="text-sm">Add an option to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {showAccount && (
                <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Account
                </th>
              )}
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ticker
              </th>
              <th className="text-left py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Strike
              </th>
              <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Price
              </th>
              <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                B/Even
              </th>
              <th className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Exp
              </th>
              <th className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                Exp In
              </th>
              <th className="text-center py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                Qty
              </th>
              <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Proceeds
              </th>
              <th className="text-right py-3 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden xl:table-cell">
                Days
              </th>
              <th className="py-3 px-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {options.map((option) => (
              <OptionRow
                key={option.id}
                option={option}
                showAccount={showAccount}
                onEdit={() => setEditOption(option)}
                onClose={() => setCloseOption(option)}
                onDelete={() => setDeleteTarget(option)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {editOption && (
        <OptionForm
          isOpen={!!editOption}
          onClose={() => setEditOption(null)}
          editOption={editOption}
        />
      )}

      {closeOption && (
        <CloseOptionForm
          isOpen={!!closeOption}
          onClose={() => setCloseOption(null)}
          option={closeOption}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteOption.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Delete Option"
        message={`Are you sure you want to delete the ${deleteTarget?.ticker} ${deleteTarget?.option_type} option? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteOption.isPending}
      />
    </>
  );
}

function getBreakevenColorClass(option: Option, isOpen: boolean): string {
  if (!option.current_price || !isOpen) return "text-slate-400";

  const { direction, option_type, current_price, breakeven } = option;

  if (current_price === breakeven) return "text-slate-400";

  // Bought call / Sold put: good if price is above breakeven
  // Sold call / Bought put: good if price is below breakeven
  const priceAboveBreakeven = current_price > breakeven;
  const isGood =
    (option_type === "call" && direction === "bought") ||
    (option_type === "put" && direction === "sold")
      ? priceAboveBreakeven
      : !priceAboveBreakeven;

  return isGood ? "text-profit" : "text-loss";
}

function OptionRow({
  option,
  showAccount,
  onEdit,
  onClose,
  onDelete,
}: {
  option: Option;
  showAccount: boolean;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const daysUntilExpiry = calcDaysUntilExpiry(option.expiration_date);
  const isOpen = !option.date_closed;
  const isCritical = isOpen && daysUntilExpiry <= 3;
  const isWarning = isOpen && daysUntilExpiry > 3 && daysUntilExpiry <= 7;

  return (
    <tr className="hover:bg-bg-surface/50 transition-colors">
      {showAccount && (
        <td className="py-3 px-3 text-slate-400 text-xs whitespace-nowrap">
          {option.account_name}
        </td>
      )}
      <td className="py-3 px-3">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-100">{option.ticker}</span>
          <Badge
            variant={option.direction === "sold" ? "success" : "info"}
            size="sm"
          >
            {option.direction === "sold" ? "SOLD" : "BUY"}
          </Badge>
        </div>
      </td>
      <td className="py-3 px-3">
        <Badge
          variant={option.option_type === "call" ? "info" : "warning"}
          size="sm"
        >
          {option.option_type.toUpperCase()}
        </Badge>
      </td>
      <td className="py-3 px-3 text-right font-mono text-slate-200">
        {formatPrice(option.strike_price)}
      </td>
      <td className="py-3 px-3 text-right font-mono text-slate-300">
        {option.current_price ? (
          <span className={option.price_stale ? "text-slate-500" : ""}>
            {formatPrice(option.current_price)}
            {option.price_is_manual && (
              <span className="text-xs text-slate-500 ml-1">M</span>
            )}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>
      <td
        className={`py-3 px-3 text-right font-mono ${getBreakevenColorClass(option, isOpen)}`}
      >
        {formatPrice(option.breakeven)}
      </td>
      <td className="py-3 px-3 text-center">
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
      </td>
      <td className="py-3 px-3 text-center hidden sm:table-cell">
        {isOpen ? (
          <span
            className={
              daysUntilExpiry < 0
                ? "text-slate-600"
                : isCritical
                  ? "text-danger font-semibold"
                  : isWarning
                    ? "text-warning font-medium"
                    : "text-slate-400"
            }
          >
            {daysUntilExpiry < 0
              ? "Expired"
              : daysUntilExpiry === 0
                ? "Today"
                : `${daysUntilExpiry}d`}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>
      <td className="py-3 px-3 text-center text-slate-400 hidden sm:table-cell">
        {option.quantity}
      </td>
      <td className="py-3 px-3 text-right font-mono">
        <span className={option.proceeds >= 0 ? "text-profit" : "text-loss"}>
          {formatCurrency(option.proceeds, true)}
        </span>
      </td>
      <td className="py-3 px-3 text-right text-slate-500 hidden xl:table-cell">
        {option.days_open}d
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-1 justify-end">
          {option.close_reason && (
            <Badge
              variant={
                option.close_reason === "expired"
                  ? "success"
                  : option.close_reason === "assigned"
                    ? "warning"
                    : "neutral"
              }
              size="sm"
            >
              {option.close_reason}
            </Badge>
          )}
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
      </td>
    </tr>
  );
}
