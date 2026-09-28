import { createContext, useContext, useState, type ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  company: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, company: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 800));
    setUser({
      id: "u_001",
      email,
      name: email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      role: "Logistics Manager",
      company: "Pacific Bulk Carriers Ltd.",
    });
  };

  const signup = async (name: string, email: string, _password: string, company: string) => {
    await new Promise((r) => setTimeout(r, 1000));
    setUser({ id: "u_002", email, name, role: "Logistics Manager", company });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
