import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { useOptionStore } from "../../store/optionStore";
import { useAccounts } from "../../hooks/useAccounts";
import { useUIStore } from "../../store/uiStore";

export const OptionsFilters = () => {
  const { filters, setFilters, resetFilters } = useOptionStore();
  const { showOldOptions, setShowOldOptions } = useUIStore();
  const { data: accounts = [] } = useAccounts();

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="w-40">
        <Select
          label="Account"
          options={[
            { value: "", label: "All Accounts" },
            ...accounts.map((a) => ({ value: a.id, label: a.name })),
          ]}
          value={filters.account_id ?? ""}
          onChange={(e) =>
            setFilters({
              account_id: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>

      <div className="w-28">
        <Input
          label="Ticker"
          placeholder="e.g. AAPL"
          value={filters.ticker ?? ""}
          onChange={(e) =>
            setFilters({ ticker: e.target.value.toUpperCase() || undefined })
          }
          style={{ textTransform: "uppercase" }}
        />
      </div>

      <div className="w-32">
        <Select
          label="Type"
          options={[
            { value: "", label: "All Types" },
            { value: "call", label: "Call" },
            { value: "put", label: "Put" },
          ]}
          value={filters.option_type ?? ""}
          onChange={(e) =>
            setFilters({
              option_type: (e.target.value as "call" | "put") || undefined,
            })
          }
        />
      </div>

      <div className="w-36">
        <Select
          label="Direction"
          options={[
            { value: "", label: "All" },
            { value: "sold", label: "Sold" },
            { value: "bought", label: "Bought" },
          ]}
          value={filters.direction ?? ""}
          onChange={(e) =>
            setFilters({
              direction: (e.target.value as "bought" | "sold") || undefined,
            })
          }
        />
      </div>

      <div className="w-32">
        <Select
          label="Status"
          options={[
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
            { value: "all", label: "All" },
          ]}
          value={filters.status}
          onChange={(e) =>
            setFilters({ status: e.target.value as "open" | "closed" | "all" })
          }
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer pb-1">
        <input
          type="checkbox"
          className="w-4 h-4 rounded accent-accent"
          checked={showOldOptions}
          onChange={(e) => {
            setShowOldOptions(e.target.checked);
            setFilters({ show_old: e.target.checked });
          }}
        />
        <span className="text-sm text-slate-400 whitespace-nowrap">
          Show &gt;30 days
        </span>
      </label>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          resetFilters();
          setShowOldOptions(false);
        }}
        className="pb-1 self-end"
      >
        Reset
      </Button>
    </div>
  );
};
