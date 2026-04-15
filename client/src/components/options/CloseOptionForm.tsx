import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { useCloseOption } from "../../hooks/useOptions";
import { calcProceeds } from "../../utils/calculations";
import { formatCurrency } from "../../utils/formatters";
import type { Option } from "../../types/option";

const schema = z.object({
  close_reason: z.enum(["assigned", "expired", "closed_early"]),
  date_closed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cost_to_close: z.coerce.number().positive().optional(),
});

type FormData = z.infer<typeof schema>;

interface CloseOptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  option: Option;
}

const CLOSE_REASON_DESCRIPTIONS = {
  assigned: "The option was exercised and shares were assigned.",
  expired: "The option expired worthless — maximum profit.",
  closed_early: "You bought back / sold the option before expiration.",
};

export const CloseOptionForm = ({
  isOpen,
  onClose,
  option,
}: CloseOptionFormProps) => {
  const closeOption = useCloseOption();

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      close_reason: "expired",
      date_closed: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const [closeReason, costToClose] = watch(["close_reason", "cost_to_close"]);

  const netProceeds = calcProceeds(
    option.direction,
    option.premium,
    option.quantity,
    closeReason as "closed_early" | "expired" | "assigned" | null | undefined,
    costToClose ? Number(costToClose) : null
  );

  const onSubmit = async (data: FormData) => {
    await closeOption.mutateAsync({
      id: option.id,
      data: {
        close_reason: data.close_reason,
        date_closed: data.date_closed,
        cost_to_close:
          data.close_reason === "closed_early" ? data.cost_to_close : undefined,
      },
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Close Option — ${option.ticker} ${option.strike_price}${option.option_type.charAt(0).toUpperCase()}`}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          control={control}
          name="close_reason"
          render={({ field }) => (
            <Select
              label="Close Reason"
              required
              options={[
                { value: "expired", label: "Expired Worthless" },
                { value: "assigned", label: "Assigned" },
                { value: "closed_early", label: "Closed Early" },
              ]}
              value={field.value}
              onChange={field.onChange}
              error={errors.close_reason?.message}
            />
          )}
        />

        {closeReason && (
          <p className="text-xs text-slate-500">
            {
              CLOSE_REASON_DESCRIPTIONS[
                closeReason as keyof typeof CLOSE_REASON_DESCRIPTIONS
              ]
            }
          </p>
        )}

        <Input
          label="Date Closed"
          type="date"
          required
          {...register("date_closed")}
          error={errors.date_closed?.message}
        />

        {closeReason === "closed_early" && (
          <Input
            label="Cost to Close (per share)"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.45"
            hint={
              option.direction === "sold"
                ? "Amount paid to buy back"
                : "Amount received from sale"
            }
            {...register("cost_to_close")}
            error={errors.cost_to_close?.message}
          />
        )}

        {/* P&L preview */}
        <div className="bg-bg-elevated border border-slate-700 rounded-lg p-3 space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
            Net Proceeds
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">
              Premium {option.direction === "sold" ? "received" : "paid"}
            </span>
            <span className="font-mono text-slate-300">
              {formatCurrency(option.premium * 100 * option.quantity)}
            </span>
          </div>
          {closeReason === "closed_early" &&
            costToClose &&
            Number(costToClose) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cost to close</span>
                <span className="font-mono text-loss">
                  -{formatCurrency(Number(costToClose) * 100 * option.quantity)}
                </span>
              </div>
            )}
          <div className="flex justify-between text-sm border-t border-slate-700 pt-1 mt-1">
            <span className="text-slate-300 font-medium">Total</span>
            <span
              className={`font-mono font-bold ${netProceeds >= 0 ? "text-profit" : "text-loss"}`}
            >
              {formatCurrency(netProceeds, true)}
            </span>
          </div>
        </div>

        {closeReason === "assigned" && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
            <p className="text-xs text-warning">
              <strong>Assignment:</strong>{" "}
              {option.direction === "sold" && option.option_type === "put"
                ? `You will be assigned +${option.quantity * 100} shares of ${option.ticker} at $${option.strike_price}.`
                : option.direction === "sold" && option.option_type === "call"
                  ? `${option.quantity * 100} shares of ${option.ticker} will be called away at $${option.strike_price}.`
                  : option.direction === "bought" &&
                      option.option_type === "call"
                    ? `You will receive +${option.quantity * 100} shares of ${option.ticker} at $${option.strike_price}.`
                    : `You will sell ${option.quantity * 100} shares of ${option.ticker} at $${option.strike_price}.`}{" "}
              Check Next Steps for recommendations.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={closeOption.isPending}
            className="flex-1"
          >
            Close Option
          </Button>
        </div>
      </form>
    </Modal>
  );
};
