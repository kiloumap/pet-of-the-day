export interface NavigationState {
  currentTab: string;
  navigationHistory: NavigationEntry[];
  modalStack: ModalState[];
  pendingNavigation: PendingNav | null;
}

export interface NavigationEntry {
  screen: string;
  params?: Record<string, any>;
  timestamp: number;
}

export interface ModalState {
  id: string;
  component: string;
  props?: Record<string, any>;
}

export interface PendingNav {
  destination: string;
  params?: Record<string, any>;
  reason: string;
}

export type RootStackParamList = {
  Home: undefined;
  MyPets: undefined;
  PetDetail: { petId: string };
  AddPet: undefined;
  Groups: undefined;
  Profile: undefined;
  Settings: undefined;
};