import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { ViewType, Vehicle } from '@/types';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  navigateToView: (view: ViewType) => void;
  setNavigateFunction: (fn: (view: ViewType) => void) => void;
  selectedVehicleForRequest: Vehicle | null;
  setSelectedVehicleForRequest: (vehicle: Vehicle | null) => void;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  navigateToView: () => {},
  setNavigateFunction: () => {},
  selectedVehicleForRequest: null,
  setSelectedVehicleForRequest: () => {},
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

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
