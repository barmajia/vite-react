// Factory Features - Aurora E-commerce Platform
// Export all factory components, hooks, and types

// Types
export type {
  ProductionStatus,
  QuoteStatus,
  FactoryAnalytics,
  ProductionOrder,
  ProductionLog,
  QuoteRequest,
  FactoryCertification,
  FactoryConnection,
  ProductionLogInsert,
  QuoteRequestInsert,
  QuoteRequestUpdate,
  FactoryCertificationInsert,
} from './types/factory';

// Hooks
export { useFactoryAnalytics } from './hooks/useFactoryAnalytics';
export {
  useProductionOrders,
  useUpdateProductionStatus,
  useProductionLogs,
} from './hooks/useProductionOrders';
export {
  useQuoteRequests,
  useUpdateQuoteRequest,
  useCreateQuoteRequest,
} from './hooks/useQuoteRequests';
export {
  useFactoryConnections,
  useUpdateConnectionStatus,
  useCreateFactoryConnection,
} from './hooks/useFactoryConnections';

// Components
export { StatCard, FactoryDashboardStats } from './components/StatCard';
export { SalesChart } from './components/SalesChart';
export { FactoryDashboard } from './components/FactoryDashboard';
export { ProductionPipeline } from './components/ProductionPipeline';
export { ProductionPipelineList } from './components/ProductionPipelineList';
export { QuoteRequestsList } from './components/QuoteRequestsList';
export { ConnectionRequestsList } from './components/ConnectionRequestsList';
