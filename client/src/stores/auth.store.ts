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

  user: JSON.parse(localStorage.getItem("user") || "null"),

  isAuthenticated: !!localStorage.getItem("accessToken"),

  login: (token, user) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(user));

    set({
      accessToken: token,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));