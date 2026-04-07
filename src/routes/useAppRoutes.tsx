// src/routes/useAppRoutes.tsx
import { useRoutes } from "react-router-dom";
import { appRoutes } from "./index";

export function useAppRoutes() {
  return useRoutes(appRoutes);
}
