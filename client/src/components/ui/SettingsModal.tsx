import { useState, useEffect, useCallback } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { useAuth } from "../../hooks/useAuth";
import {
  changePassword,
  createUser,
  listUsers,
  deleteUser,
  adminResetPassword,
} from "../../api/auth";
import type { User } from "../../types/auth";

type Tab = "password" | "add-user" | "manage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Password Tab ─────────────────────────────────────────────────────────────

function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(
        err?.response?.data?.error ??
          "Failed to change password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-slate-300 text-center">
          Password updated successfully!
        </p>
        <Button onClick={reset} className="w-full">
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Current Password"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Enter current password"
        required
      />
      <Input
        label="New Password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Min. 8 characters"
        required
      />
      <Input
        label="Confirm New Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Repeat new password"
        required
      />
      {error && <p className="text-red-400 text-sm -mt-1">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}

// ─── Add User Tab ─────────────────────────────────────────────────────────────

function AddUserTab() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successName, setSuccessName] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccessName("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await createUser(username.trim(), password);
      setSuccessName(username.trim());
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 409
          ? "Username already exists."
          : (err?.response?.data?.error ?? "Failed to create user.")
      );
    } finally {
      setLoading(false);
    }
  }

  if (successName) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-slate-300 text-center">
          User{" "}
          <span className="font-semibold text-slate-100">{successName}</span>{" "}
          created!
        </p>
        <Button onClick={reset} className="w-full">
          Add Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        required
        autoComplete="off"
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min. 8 characters"
        required
      />
      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Repeat password"
        required
      />
      {error && <p className="text-red-400 text-sm -mt-1">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating…" : "Create User"}
      </Button>
    </form>
  );
}

// ─── Manage Users Tab ─────────────────────────────────────────────────────────

function ManageUsersTab({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState("");
  // Per-row state: which row has the reset-password form open
  const [resetingId, setResetingId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setFetchError("");
    try {
      const data = await listUsers();
      setUsers(data);
    } catch {
      setFetchError("Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleDelete(id: number) {
    setDeleteLoadingId(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Failed to delete user.");
    } finally {
      setDeleteLoadingId(null);
    }
  }

  async function handleResetSubmit(e: React.FormEvent, id: number) {
    e.preventDefault();
    setResetError("");
    if (resetPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    setResetLoading(true);
    try {
      await adminResetPassword(id, resetPassword);
      setResetingId(null);
      setResetPassword("");
    } catch (err: any) {
      setResetError(err?.response?.data?.error ?? "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  }

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 text-sm mb-3">{fetchError}</p>
        <Button onClick={fetchUsers} variant="ghost" className="text-sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {users.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-6">
          No users found.
        </p>
      )}
      {users.map((u) => {
        const isSelf = u.id === currentUserId;
        const isReseting = resetingId === u.id;
        return (
          <div
            key={u.id}
            className="rounded-xl border border-slate-700/60 bg-bg-elevated overflow-hidden"
          >
            {/* User row */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSelf ? "bg-accent/20" : "bg-slate-700"}`}
              >
                <span
                  className={`text-xs font-semibold ${isSelf ? "text-accent" : "text-slate-300"}`}
                >
                  {u.username.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Name + badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {u.username}
                  </span>
                  {isSelf && (
                    <span className="text-[10px] font-semibold bg-accent/15 text-accent px-1.5 py-0.5 rounded-full">
                      you
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  Joined {new Date(u.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Actions */}
              {!isSelf && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Reset password toggle */}
                  <button
                    onClick={() => {
                      if (isReseting) {
                        setResetingId(null);
                        setResetPassword("");
                        setResetError("");
                      } else {
                        setResetingId(u.id);
                        setResetPassword("");
                        setResetError("");
                      }
                    }}
                    title="Reset password"
                    className={`p-1.5 rounded-lg transition-colors ${isReseting ? "text-accent bg-accent/10" : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={deleteLoadingId === u.id}
                    title="Delete user"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                  >
                    {deleteLoadingId === u.id ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Inline reset-password form */}
            {isReseting && (
              <form
                onSubmit={(e) => handleResetSubmit(e, u.id)}
                className="border-t border-slate-700/60 px-4 py-3 flex flex-col gap-3 bg-bg-surface/50"
              >
                <p className="text-xs text-slate-400">
                  Set new password for{" "}
                  <span className="font-medium text-slate-200">
                    {u.username}
                  </span>
                </p>
                <Input
                  label=""
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="New password (min. 8 chars)"
                  required
                  autoFocus
                />
                {resetError && (
                  <p className="text-red-400 text-xs -mt-1">{resetError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-sm"
                    onClick={() => {
                      setResetingId(null);
                      setResetPassword("");
                      setResetError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 text-sm"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Saving…" : "Save Password"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("password");

  // Reset to password tab whenever modal opens
  useEffect(() => {
    if (isOpen) setActiveTab("password");
  }, [isOpen]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "password", label: "Password" },
    { id: "add-user", label: "Add User" },
    { id: "manage", label: "Manage Users" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="sm">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-bg-elevated rounded-xl mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-xs font-medium py-2 px-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-bg-surface text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "password" && <PasswordTab />}
      {activeTab === "add-user" && <AddUserTab />}
      {activeTab === "manage" && user && (
        <ManageUsersTab currentUserId={user.id} />
      )}
    </Modal>
  );
}
