import React, { ReactNode, createContext } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/hooks/use-auth';

// Create context
export const AppContext = createContext<{
  importTimetableData: () => Promise<void>;
}>({
  importTimetableData: async () => {},
});

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Function to import timetable data
  const importTimetableData = async () => {
    try {
      await apiRequest("GET", "/api/timetable/import", undefined);
      console.log("Timetable data imported successfully");
    } catch (error) {
      console.error("Error importing timetable data:", error);
    }
  };

  return (
    <AppContext.Provider value={{ importTimetableData }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </AppContext.Provider>
  );
};
