import React, { createContext, useContext, ReactNode } from 'react';

// Define a simplified context type without auth features
interface AuthContextType {
  user: null;
  loading: boolean;
  signOut: () => void;
  setUser: () => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signOut: () => {},
  setUser: () => {},
});

// Define the props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create a simplified provider component with no auth functionality
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Simple mock values
  const value = {
    user: null,
    loading: false,
    signOut: () => {},
    setUser: () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
