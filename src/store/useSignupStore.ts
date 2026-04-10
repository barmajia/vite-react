import { create } from "zustand";

interface SellerSignupData {
  businessName: string;
  email: string;
  phone: string;
  location: string;
  specialization?: string;
  productionCapacity?: string;
  step: number;
}

interface SignupStoreState {
  // Current Form Data (RAM)
  sellerData: SellerSignupData;
  isLoading: boolean;

  // Actions to mutate State
  updateSellerData: (data: Partial<SellerSignupData>) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setIsLoading: (isLoading: boolean) => void;
  resetForm: () => void;
}

const initialSellerData: SellerSignupData = {
  businessName: "",
  email: "",
  phone: "",
  location: "",
  specialization: "",
  productionCapacity: "",
  step: 1,
};

// Zustand Controller (Acts as temporary in-memory RAM)
export const useSignupStore = create<SignupStoreState>((set) => ({
  sellerData: initialSellerData,
  isLoading: false,

  updateSellerData: (newData) =>
    set((state) => ({
      sellerData: { ...state.sellerData, ...newData },
    })),

  // Step Controllers
  setStep: (step) =>
    set((state) => ({ sellerData: { ...state.sellerData, step } })),
  
  nextStep: () =>
    set((state) => ({
      sellerData: { ...state.sellerData, step: state.sellerData.step + 1 },
    })),
    
  prevStep: () =>
    set((state) => ({
      sellerData: {
        ...state.sellerData,
        step: Math.max(1, state.sellerData.step - 1),
      },
    })),

  setIsLoading: (isLoading) => set({ isLoading }),

  // Cleanup
  resetForm: () => set({ sellerData: initialSellerData, isLoading: false }),
}));
