import { useOptions } from '../../hooks/useOptions';
import { formatDate, formatPrice } from '../../utils/formatters';
import { calcDaysUntilExpiry } from '../../utils/calculations';
import { cn } from '../../utils/cn';

export function ExpirationAlerts() {
  const { data } = useOptions({ status: 'open', limit: 200 });
  const options = data?.data ?? [];

  const expiring = options
    .filter((o) => {
      const days = calcDaysUntilExpiry(o.expiration_date);
      return days >= 0 && days <= 7;
    })
    .sort((a, b) =>
      calcDaysUntilExpiry(a.expiration_date) - calcDaysUntilExpiry(b.expiration_date)
    );

  if (expiring.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Expiration Alerts
      </h2>
      <div className="space-y-2">
        {expiring.map((option) => {
          const days = calcDaysUntilExpiry(option.expiration_date);
          const isCritical = days <= 3;
          return (
            <div
              key={option.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border text-sm',
                isCritical
                  ? 'bg-danger/10 border-danger/30'
                  : 'bg-warning/10 border-warning/30'
              )}
            >
              <span className="text-base">{isCritical ? '🔴' : '🟠'}</span>
              <div className="flex-1 flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="font-semibold text-slate-100">
                  {option.ticker}
                </span>
                <span className="text-slate-300">
                  {option.strike_price}{option.option_type.charAt(0).toUpperCase()}
                </span>
                <span className={isCritical ? 'text-danger' : 'text-warning'}>
                  {days === 0 ? 'Expires today' : `${days} day${days === 1 ? '' : 's'}`}
                </span>
                <span className="text-slate-500">{option.account_name}</span>
                <span className="text-slate-400 capitalize">{option.direction}</span>
                <span className="text-slate-400 font-mono">{formatPrice(option.premium)}/sh</span>
              </div>
              <span className="text-slate-500 text-xs whitespace-nowrap">
                {formatDate(option.expiration_date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
