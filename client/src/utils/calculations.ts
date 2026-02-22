import type { OptionDirection, OptionType, CloseReason } from '../types/option';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export function calcBreakeven(optionType: OptionType, strikePrice: number, premium: number): number {
  if (optionType === 'call') return strikePrice + premium;
  return strikePrice - premium;
}

export function calcProceeds(
  direction: OptionDirection,
  premium: number,
  quantity: number,
  closeReason?: CloseReason | null,
  costToClose?: number | null
): number {
  const multiplier = 100;
  if (direction === 'sold') {
    const credit = premium * multiplier * quantity;
    const closeCost = closeReason === 'closed_early' ? (costToClose ?? 0) * multiplier * quantity : 0;
    return credit - closeCost;
  } else {
    const debit = premium * multiplier * quantity;
    const sellBack = closeReason === 'closed_early' ? (costToClose ?? 0) * multiplier * quantity : 0;
    return sellBack - debit;
  }
}

export function calcStockDelta(
  direction: OptionDirection,
  optionType: OptionType,
  quantity: number
): number {
  if (direction === 'sold' && optionType === 'call') return -100 * quantity;
  if (direction === 'bought' && optionType === 'call') return +100 * quantity;
  if (direction === 'sold' && optionType === 'put') return +100 * quantity;
  return -100 * quantity;
}

export function calcDaysOpen(dateOpened: string, dateClosed?: string | null): number {
  const start = parseISO(dateOpened);
  const end = dateClosed ? parseISO(dateClosed) : new Date();
  return Math.max(0, differenceInCalendarDays(end, start));
}

export function calcDaysUntilExpiry(expirationDate: string): number {
  return differenceInCalendarDays(parseISO(expirationDate), new Date());
}
