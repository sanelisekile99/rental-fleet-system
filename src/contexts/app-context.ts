import { createContext } from 'react';
import type { AppContextType } from './AppContext';

export const AppContext = createContext<AppContextType>({
  sidebarOpen: false,
  toggleSidebar: () => {},
  navigateToView: () => {},
  setNavigateFunction: () => {},
  selectedVehicleForRequest: null,
  setSelectedVehicleForRequest: () => {},
});