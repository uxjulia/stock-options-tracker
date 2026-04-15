import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { AccountForm } from "../components/accounts/AccountForm";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Spinner } from "../components/ui/Spinner";
import {
  useAccounts,
  useDeleteAccount,
  useUpdateAccount,
} from "../hooks/useAccounts";
import { formatCurrency } from "../utils/formatters";
import type { Account } from "../types/account";
import { Ban, CircleCheck, Pencil, X, Plus } from "lucide-react";

export const AccountsPage = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const { data: accounts = [], isLoading } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const updateAccount = useUpdateAccount();

  if (isLoading) {
    return (
      <div className="flex justify-center pt-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Accounts</h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus size={12} strokeWidth={3} /> Add Account
        </Button>
      </div>

      <div className="space-y-3">
        {accounts.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg mb-1">No accounts yet</p>
            <p className="text-sm">Add a brokerage account to get started</p>
          </div>
        )}
        {accounts.map((account) => (
          <Card key={account.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-slate-100 truncate">
                    {account.name}
                  </h2>
                  {account.is_active === 0 && (
                    <Badge variant="neutral">Inactive</Badge>
                  )}
                </div>
                {account.description && (
                  <p className="text-sm text-slate-500 mb-3">
                    {account.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="text-slate-400">
                    <span className="text-slate-200 font-medium">
                      {account.trade_count}
                    </span>{" "}
                    trades
                  </span>
                  <span className="text-slate-400">
                    <span className="text-slate-200 font-medium">
                      {account.open_count}
                    </span>{" "}
                    open
                  </span>
                  <span
                    className={
                      account.realized_pnl >= 0 ? "text-profit" : "text-loss"
                    }
                  >
                    {formatCurrency(account.realized_pnl, true)} realized
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditAccount(account)}
                  title="Edit account"
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateAccount.mutate({
                      id: account.id,
                      data: { is_active: !account.is_active },
                    })
                  }
                  title={account.is_active ? "Deactivate" : "Activate"}
                >
                  {account.is_active ? (
                    <Ban size={14} />
                  ) : (
                    <CircleCheck size={14} />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(account)}
                  title="Delete account"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AccountForm isOpen={addOpen} onClose={() => setAddOpen(false)} />
      <AccountForm
        isOpen={!!editAccount}
        onClose={() => setEditAccount(null)}
        editAccount={editAccount ?? undefined}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteAccount.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Remove Account"
        message={`Remove "${deleteTarget?.name}"? If it has options, it will be deactivated instead of deleted.`}
        confirmLabel="Remove"
        loading={deleteAccount.isPending}
      />
    </div>
  );
};
