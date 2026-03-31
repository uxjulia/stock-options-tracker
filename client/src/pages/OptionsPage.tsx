import { useState } from "react";
import { OptionsTable } from "../components/options/OptionsTable";
import { OptionsFilters } from "../components/options/OptionsFilters";
import { OptionForm } from "../components/options/OptionForm";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { useOptions } from "../hooks/useOptions";
import { useOptionStore } from "../store/optionStore";
import { useUIStore } from "../store/uiStore";

export function OptionsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const { filters } = useOptionStore();
  const { showOldOptions } = useUIStore();

  const { data, isLoading, isFetching } = useOptions({
    ...filters,
    show_old: showOldOptions,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / filters.limit);
  const { setFilters } = useOptionStore();

  return (
    <div className="space-y-4 max-w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Options</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          + Add Option
        </Button>
      </div>

      <div className="bg-bg-surface border border-slate-700/50 rounded-md p-4">
        <OptionsFilters />
      </div>

      <div className="bg-bg-surface border border-slate-700/50 rounded-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="px-3 py-2 border-b border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {total} result{total !== 1 ? "s" : ""}
                {isFetching && !isLoading && (
                  <Spinner size="sm" className="inline ml-2" />
                )}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={filters.page <= 1}
                    onClick={() => setFilters({ page: filters.page - 1 })}
                  >
                    ←
                  </Button>
                  <span className="text-xs text-slate-500">
                    {filters.page} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={filters.page >= totalPages}
                    onClick={() => setFilters({ page: filters.page + 1 })}
                  >
                    →
                  </Button>
                </div>
              )}
            </div>
            <OptionsTable options={data?.data ?? []} />
          </>
        )}
      </div>

      <OptionForm isOpen={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
