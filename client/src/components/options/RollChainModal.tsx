import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { useRollChain } from "../../hooks/useOptions";
import {
  formatCurrency,
  formatDate,
  formatPrice,
} from "../../utils/formatters";
import type { Option } from "../../types/option";

interface RollChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  optionId: number;
}

const LegRow = ({
  option,
  index,
  isLast,
}: {
  option: Option;
  index: number;
  isLast: boolean;
}) => {
  const isClosed = !!option.date_closed;

  return (
    <div className="relative">
      {/* Connector line between legs */}
      {!isLast && (
        <div className="absolute left-[18px] top-full w-1 h-4 bg-slate-600 z-10" />
      )}

      <div className="bg-bg-elevated border border-slate-700 rounded-sm p-3 space-y-2">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-slate-500 w-6">
              #{index + 1}
            </span>
            <span className="font-semibold text-slate-100 text-sm">
              {formatPrice(option.strike_price)}{" "}
              {option.option_type.toUpperCase()}
            </span>
            <Badge
              variant={option.direction === "sold" ? "success" : "info"}
              size="sm"
            >
              {option.direction === "sold" ? "SOLD" : "BUY"}
            </Badge>
            {isClosed ? (
              <Badge
                variant={
                  option.close_reason === "rolled"
                    ? "info"
                    : option.close_reason === "expired"
                      ? "success"
                      : option.close_reason === "assigned"
                        ? "warning"
                        : "neutral"
                }
                size="sm"
              >
                {option.close_reason === "rolled"
                  ? "Rolled"
                  : (option.close_reason ?? "closed")}
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                Open
              </Badge>
            )}
          </div>
          <span
            className={`font-mono text-sm font-medium ${!isClosed ? "text-slate-400" : option.proceeds >= 0 ? "text-profit" : "text-loss"}`}
          >
            {isClosed ? formatCurrency(option.proceeds, true) : "—"}
          </span>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs ml-7">
          <div>
            <span className="text-slate-500 block">Opened</span>
            <span className="text-slate-300">
              {formatDate(option.date_opened)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Expiry</span>
            <span className="text-slate-300">
              {formatDate(option.expiration_date)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Premium</span>
            <span className="font-mono text-slate-300">
              {formatPrice(option.premium)}
            </span>
          </div>
          {option.cost_to_close !== null && (
            <div>
              <span className="text-slate-500 block">Cost to Close</span>
              <span className="font-mono text-loss">
                {formatPrice(option.cost_to_close)}
              </span>
            </div>
          )}
          {option.roll_net_premium !== null && (
            <div>
              <span className="text-slate-500 block">Net from Roll</span>
              <span
                className={`font-mono ${option.roll_net_premium >= 0 ? "text-profit" : "text-loss"}`}
              >
                {formatCurrency(
                  option.roll_net_premium * 100 * option.quantity,
                  true
                )}
              </span>
            </div>
          )}
          {option.date_closed && (
            <div>
              <span className="text-slate-500 block">Closed</span>
              <span className="text-slate-300">
                {formatDate(option.date_closed)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const RollChainModal = ({
  isOpen,
  onClose,
  optionId,
}: RollChainModalProps) => {
  const { data: chain, isLoading } = useRollChain(isOpen ? optionId : null);

  const chainTotal =
    chain
      ?.filter((o) => !!o.date_closed)
      .reduce((sum, o) => sum + o.proceeds, 0) ?? 0;

  const openLeg = chain?.find((o) => !o.date_closed);
  const ticker = chain?.[0]?.ticker ?? "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ticker ? `Roll Chain — ${ticker}` : "Roll Chain"}
      size="md"
    >
      {isLoading ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          Loading chain...
        </div>
      ) : !chain || chain.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          No chain data found.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Leg list with connectors */}
          <div className="space-y-4">
            {chain.map((option, i) => (
              <LegRow
                key={option.id}
                option={option}
                index={i}
                isLast={i === chain.length - 1}
              />
            ))}
          </div>

          {/* Chain summary */}
          <div className="bg-bg-elevated border border-slate-700 rounded-sm p-3 space-y-1 mt-2">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
              Chain Summary
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Legs</span>
              <span className="text-slate-300">{chain.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Closed legs P&amp;L</span>
              <span
                className={`font-mono ${chainTotal >= 0 ? "text-profit" : "text-loss"}`}
              >
                {formatCurrency(chainTotal, true)}
              </span>
            </div>
            {openLeg && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Open leg</span>
                <span className="text-slate-300 font-mono">
                  {formatPrice(openLeg.strike_price)} exp{" "}
                  {formatDate(openLeg.expiration_date)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
