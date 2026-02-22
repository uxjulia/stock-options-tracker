import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useCreateAccount, useUpdateAccount } from '../../hooks/useAccounts';
import type { Account } from '../../types/account';

const schema = z.object({
  name: z.string().min(1, 'Account name is required').max(100),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  editAccount?: Account;
}

export function AccountForm({ isOpen, onClose, editAccount }: AccountFormProps) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (editAccount) {
      reset({ name: editAccount.name, description: editAccount.description ?? '' });
    } else {
      reset({ name: '', description: '' });
    }
  }, [editAccount, isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    if (editAccount) {
      await updateAccount.mutateAsync({ id: editAccount.id, data });
    } else {
      await createAccount.mutateAsync(data);
    }
    onClose();
  };

  const isLoading = createAccount.isPending || updateAccount.isPending;
  const error = createAccount.error || updateAccount.error;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editAccount ? 'Edit Account' : 'Add Account'} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Account Name"
          required
          placeholder="e.g. Fidelity, Schwab"
          error={errors.name?.message}
          {...register('name')}
        />
        <Textarea
          label="Description (optional)"
          placeholder="Notes about this account..."
          {...register('description')}
        />
        {error && (
          <p className="text-sm text-loss">
            {(error as Error).message.includes('UNIQUE') || (error as Error).message.includes('409')
              ? 'An account with that name already exists.'
              : 'An error occurred. Please try again.'}
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} className="flex-1">
            {editAccount ? 'Save Changes' : 'Add Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
