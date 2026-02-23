import type {
  OptionDirection,
  OptionType,
  CloseReason,
} from "../models/option.model";
import { differenceInCalendarDays, parseISO } from "date-fns";

export function calcBreakeven(
  optionType: OptionType,
  strikePrice: number,
  premium: number
): number {
  if (optionType === "call") return strikePrice + premium;
  return strikePrice - premium;
}

/**
 * Realized proceeds from a closed or open option.
 * For sold options: credit received minus cost to close (if applicable).
 * For bought options: negative (it's a debit).
 */
export function calcProceeds(
  direction: OptionDirection,
  premium: number,
  quantity: number,
  closeReason?: CloseReason | null,
  costToClose?: number | null
): number {
  const multiplier = 100;
  if (direction === "sold") {
    const credit = premium * multiplier * quantity;
    const closeCost =
      closeReason === "closed_early"
        ? (costToClose ?? 0) * multiplier * quantity
        : 0;
    return credit - closeCost;
  } else {
    // Bought option: debit paid
    const debit = premium * multiplier * quantity;
    // If closed early by selling it back, costToClose represents proceeds from selling
    const sellBack =
      closeReason === "closed_early"
        ? (costToClose ?? 0) * multiplier * quantity
        : 0;
    return sellBack - debit;
  }
}

/**
 * Net stock delta when an option is assigned.
 */
export function calcStockDelta(
  direction: OptionDirection,
  optionType: OptionType,
  quantity: number
): number {
  if (direction === "sold" && optionType === "call") return -100 * quantity;
  if (direction === "bought" && optionType === "call") return +100 * quantity;
  if (direction === "sold" && optionType === "put") return +100 * quantity;
  // bought put
  return -100 * quantity;
}

export function calcDaysOpen(
  dateOpened: string,
  dateClosed?: string | null
): number {
  const start = parseISO(dateOpened);
  const end = dateClosed ? parseISO(dateClosed) : new Date();
  return Math.max(0, differenceInCalendarDays(end, start));
}

export function calcDaysUntilExpiry(expirationDate: string): number {
  return differenceInCalendarDays(parseISO(expirationDate), new Date());
}

export function isExpired(expirationDate: string): boolean {
  return calcDaysUntilExpiry(expirationDate) < 0;
}
