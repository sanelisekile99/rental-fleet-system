import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { ViewType, Vehicle } from '@/types';
import { AppContext } from './app-context';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  navigateToView: (view: ViewType) => void;
  setNavigateFunction: (fn: (view: ViewType) => void) => void;
  selectedVehicleForRequest: Vehicle | null;
  setSelectedVehicleForRequest: (vehicle: Vehicle | null) => void;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigateFunction, setNavigateFunction] = useState<((view: ViewType) => void) | null>(null);
  const [selectedVehicleForRequest, setSelectedVehicleForRequest] = useState<Vehicle | null>(null);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const navigateToView = (view: ViewType) => {
    if (navigateFunction) {
      navigateFunction(view);
    }
  };

  const setNavigateFunc = (fn: (view: ViewType) => void) => {
    setNavigateFunction(() => fn);
  };

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        navigateToView,
        setNavigateFunction: setNavigateFunc,
        selectedVehicleForRequest,
        setSelectedVehicleForRequest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
