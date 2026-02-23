import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login, loginLoading, isAuthenticated } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (data: FormData) => {
    setLoginError(null);
    try {
      await login(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setLoginError(
        axiosErr?.response?.data?.error ??
          "Login failed. Check your credentials."
      );
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Option Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-bg-surface border border-slate-700/50 rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username"
              autoComplete="username"
              autoFocus
              error={errors.username?.message}
              {...register("username")}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />

            {loginError && (
              <div className="bg-loss/10 border border-loss/30 rounded-lg px-3 py-2">
                <p className="text-sm text-loss">{loginError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              loading={loginLoading}
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
