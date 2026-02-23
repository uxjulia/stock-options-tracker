import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { useCreateOption, useUpdateOption } from "../../hooks/useOptions";
import { useAccounts } from "../../hooks/useAccounts";
import { calcBreakeven, calcProceeds } from "../../utils/calculations";
import { formatCurrency, formatPrice } from "../../utils/formatters";
import type { Option, OptionFormData } from "../../types/option";

const schema = z.object({
  account_id: z.coerce.number().int().positive("Select an account"),
  ticker: z.string().min(1, "Ticker required").max(10).toUpperCase(),
  direction: z.enum(["bought", "sold"]),
  option_type: z.enum(["call", "put"]),
  strike_price: z.coerce.number().positive("Strike price must be positive"),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  premium: z.coerce.number().positive("Premium must be positive"),
  date_opened: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  notes: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

interface OptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editOption?: Option;
}

export function OptionForm({ isOpen, onClose, editOption }: OptionFormProps) {
  const { data: accounts = [] } = useAccounts();
  const createOption = useCreateOption();
  const updateOption = useUpdateOption();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      direction: "sold",
      option_type: "put",
      quantity: 1,
      date_opened: format(new Date(), "yyyy-MM-dd"),
    },
  });

  useEffect(() => {
    if (editOption) {
      reset({
        account_id: editOption.account_id,
        ticker: editOption.ticker,
        direction: editOption.direction,
        option_type: editOption.option_type,
        strike_price: editOption.strike_price,
        expiration_date: editOption.expiration_date,
        quantity: editOption.quantity,
        premium: editOption.premium,
        date_opened: editOption.date_opened,
        notes: editOption.notes ?? "",
      });
    } else {
      reset({
        direction: "sold",
        option_type: "put",
        quantity: 1,
        date_opened: format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, [editOption, isOpen, reset]);

  const watchedValues = watch([
    "direction",
    "option_type",
    "strike_price",
    "premium",
    "quantity",
  ]);
  const [direction, optionType, strikePrice, premium, quantity] = watchedValues;

  const breakeven =
    strikePrice && premium
      ? calcBreakeven(optionType, Number(strikePrice), Number(premium))
      : null;

  const proceeds =
    strikePrice && premium && quantity
      ? calcProceeds(direction, Number(premium), Number(quantity))
      : null;

  const onSubmit = async (data: FormData) => {
    try {
      if (editOption) {
        await updateOption.mutateAsync({
          id: editOption.id,
          data: data as OptionFormData,
        });
      } else {
        await createOption.mutateAsync(data as OptionFormData);
      }
      onClose();
    } catch {
      // Error handling via mutation state
    }
  };

  const isLoading = createOption.isPending || updateOption.isPending;
  const error = createOption.error || updateOption.error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editOption ? "Edit Option" : "Add New Option"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Controller
              control={control}
              name="account_id"
              render={({ field }) => (
                <Select
                  label="Account"
                  required
                  options={accounts.map((a) => ({
                    value: a.id,
                    label: a.name,
                  }))}
                  placeholder="Select account..."
                  error={errors.account_id?.message}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Ticker Symbol"
              required
              placeholder="e.g. AAPL"
              error={errors.ticker?.message}
              {...register("ticker")}
              style={{ textTransform: "uppercase" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1">
              Direction <span className="text-loss ml-1">*</span>
            </label>
            <div className="flex gap-3">
              {(["sold", "bought"] as const).map((d) => (
                <label
                  key={d}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={d}
                    {...register("direction")}
                    className="accent-accent"
                  />
                  <span className="text-sm text-slate-300 capitalize">{d}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1">
              Type <span className="text-loss ml-1">*</span>
            </label>
            <div className="flex gap-3">
              {(["call", "put"] as const).map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={t}
                    {...register("option_type")}
                    className="accent-accent"
                  />
                  <span className="text-sm text-slate-300 capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Strike Price"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="240.00"
            required
            error={errors.strike_price?.message}
            {...register("strike_price")}
          />
          <Input
            label="Expiration Date"
            type="date"
            required
            error={errors.expiration_date?.message}
            {...register("expiration_date")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Premium (per share)"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="2.40"
            required
            error={errors.premium?.message}
            hint={direction === "sold" ? "Credit received" : "Debit paid"}
            {...register("premium")}
          />
          <Input
            label="Quantity (contracts)"
            type="number"
            min="1"
            step="1"
            placeholder="1"
            required
            error={errors.quantity?.message}
            hint="1 contract = 100 shares"
            {...register("quantity")}
          />
        </div>

        <Input
          label="Date Opened"
          type="date"
          required
          error={errors.date_opened?.message}
          {...register("date_opened")}
        />

        {/* Live calculations preview */}
        {breakeven !== null && (
          <div className="bg-bg-elevated border border-slate-700 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Breakeven</span>
              <span className="text-slate-200 font-mono">
                {formatPrice(breakeven)}
              </span>
            </div>
            {proceeds !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {direction === "sold" ? "Credit received" : "Debit paid"}
                </span>
                <span
                  className={`font-mono font-medium ${
                    direction === "sold" ? "text-profit" : "text-loss"
                  }`}
                >
                  {formatCurrency(Math.abs(proceeds), false)}
                </span>
              </div>
            )}
          </div>
        )}

        <Textarea
          label="Notes (optional)"
          placeholder="Any notes about this position..."
          {...register("notes")}
        />

        {error && (
          <p className="text-sm text-loss">
            {(error as Error).message || "An error occurred. Please try again."}
          </p>
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
          <Button type="submit" loading={isLoading} className="flex-1">
            {editOption ? "Save Changes" : "Add Option"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
