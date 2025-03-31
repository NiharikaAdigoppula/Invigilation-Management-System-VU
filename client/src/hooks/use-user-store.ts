import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  username: string;
  isAdmin: boolean;
}

interface UserState {
  user: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  switchUserType: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAdmin: true,
  isAuthenticated: false,
  
  setUser: (user) => set({ 
    user, 
    isAdmin: user ? user.isAdmin : true,
    isAuthenticated: !!user
  }),
  
  logout: () => set({
    user: null,
    isAdmin: true,
    isAuthenticated: false
  }),
  
  switchUserType: () => set((state) => {
    // If user is not logged in, default to admin
    if (!state.user) {
      return {
        user: {
          id: 1,
          name: "Admin",
          username: "admin",
          isAdmin: true
        },
        isAdmin: true,
        isAuthenticated: true
      };
    }
    
    // If current type is admin, switch to faculty
    if (state.isAdmin) {
      return {
        user: {
          id: 2,
          name: "Dr. M. Umadevi",
          username: "umadevi",
          isAdmin: false
        },
        isAdmin: false,
        isAuthenticated: true
      };
    }
    
    // If current type is faculty, switch to admin
    return {
      user: {
        id: 1,
        name: "Admin",
        username: "admin",
        isAdmin: true
      },
      isAdmin: true,
      isAuthenticated: true
    };
  })
}));
