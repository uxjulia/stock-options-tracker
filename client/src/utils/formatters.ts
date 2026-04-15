export const formatCurrency = (value: number, showSign = false): string => {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);

  if (showSign) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
};

export const formatDate = (isoDate: string): string => {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year.slice(2)}`;
};

export const formatDateFull = (isoDate: string): string => {
  if (!isoDate) return "—";
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatPercent = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const formatPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
