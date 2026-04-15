import type {
  Option,
  OptionDirection,
  OptionType,
  CloseReason,
} from "../types/option";
import { differenceInCalendarDays, parseISO } from "date-fns";

export const calcBreakeven = (
  optionType: OptionType,
  strikePrice: number,
  premium: number
): number => {
  if (optionType === "call") return strikePrice + premium;
  return strikePrice - premium;
};

export const calcProceeds = (
  direction: OptionDirection,
  premium: number,
  quantity: number,
  closeReason?: CloseReason | null,
  costToClose?: number | null
): number => {
  const multiplier = 100;
  if (direction === "sold") {
    const credit = premium * multiplier * quantity;
    const closeCost =
      closeReason === "closed_early"
        ? (costToClose ?? 0) * multiplier * quantity
        : 0;
    return credit - closeCost;
  } else {
    const debit = premium * multiplier * quantity;
    const sellBack =
      closeReason === "closed_early"
        ? (costToClose ?? 0) * multiplier * quantity
        : 0;
    return sellBack - debit;
  }
};

export const calcStockDelta = (
  direction: OptionDirection,
  optionType: OptionType,
  quantity: number
): number => {
  if (direction === "sold" && optionType === "call") return -100 * quantity;
  if (direction === "bought" && optionType === "call") return +100 * quantity;
  if (direction === "sold" && optionType === "put") return +100 * quantity;
  return -100 * quantity;
};

export const calcDaysOpen = (
  dateOpened: string,
  dateClosed?: string | null
): number => {
  const start = parseISO(dateOpened);
  const end = dateClosed ? parseISO(dateClosed) : new Date();
  return Math.max(0, differenceInCalendarDays(end, start));
};

export const calcDaysUntilExpiry = (expirationDate: string): number => {
  return differenceInCalendarDays(parseISO(expirationDate), new Date());
};

export const getBreakevenColorClass = (
  option: Option,
  isOpen: boolean
): string => {
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
};
