import { create } from "zustand";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;

  login: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("accessToken"),

  user: null,

  isAuthenticated: !!localStorage.getItem("accessToken"),

  login: (token, user) => {
    localStorage.setItem("accessToken", token);

    set({
      accessToken: token,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("accessToken");

    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));