import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../api/auth';

export function useAuth() {
  const { user, token, setAuth, logout: storeLogout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      storeLogout();
    },
  });

  return {
    user,
    token,
    isAuthenticated: !!token,
    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: () => logoutMutation.mutate(),
  };
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
