/**
 * Route Configuration for Services Tables
 * 
 * This file resolves the ambiguity between the duplicate service table systems:
 * - System A (Legacy): service_providers, service_listings, service_orders, service_bookings
 * - System B (Active): svc_providers, svc_listings, svc_orders, service_bookings
 * 
 * Decision: Use System B (svc_*) for all new development
 * 
 * @see RLS_POLICY.md for Row Level Security policies
 * @see create-services-tables.sql for System B schema
 */

// Service table mapping configuration
export const SERVICE_TABLES = {
  // Active system (System B)
  providers: 'svc_providers',
  listings: 'svc_listings',
  orders: 'svc_orders',
  portfolio: 'svc_portfolio',
  reviews: 'svc_reviews',
  
  // Legacy system (System A) - DEPRECATED
  // These tables exist but should not be used for new features
  legacy: {
    providers: 'service_providers',
    listings: 'service_listings',
    orders: 'service_orders',
    bookings: 'service_bookings', // Note: service_bookings is still in use
  },
} as const;

// Type definitions for service tables
export type ServiceTable = typeof SERVICE_TABLES[keyof typeof SERVICE_TABLES];
export type LegacyServiceTable = typeof SERVICE_TABLES.legacy[keyof typeof SERVICE_TABLES.legacy];

/**
 * Get the correct table name for a given service entity
 * @param entity - The entity type (providers, listings, orders, etc.)
 * @returns The table name to use in queries
 */
export function getServiceTable(entity: keyof typeof SERVICE_TABLES): string {
  if (entity === 'legacy') {
    console.warn('⚠️ WARNING: Using legacy service tables. Migrate to svc_* tables.');
    return SERVICE_TABLES.legacy.providers; // Default to providers
  }
  return SERVICE_TABLES[entity];
}

/**
 * Supabase query helper for service providers
 * 
 * @example
 * // Instead of:
 * supabase.from('service_providers').select('*')
 * 
 * // Use:
 * supabase.from(getServiceTable('providers')).select('*')
 */
export const ServiceQueries = {
  /**
   * Get active service providers
   */
  getActiveProviders: () => ({
    table: getServiceTable('providers'),
    select: '*',
    filter: { status: 'active', is_verified: true },
  }),

  /**
   * Get service listings by provider
   */
  getListingsByProvider: (providerId: string) => ({
    table: getServiceTable('listings'),
    select: '*',
    filter: { provider_id: providerId, status: 'active' },
  }),

  /**
   * Get service orders for a user
   */
  getUserOrders: (userId: string) => ({
    table: getServiceTable('orders'),
    select: '*',
    filter: { user_id: userId },
  }),
};

/**
 * Migration status tracking
 * 
 * Use this to track which features have been migrated from legacy to active system
 */
export const MIGRATION_STATUS = {
  providers: {
    migrated: true,
    legacyTable: 'service_providers',
    activeTable: 'svc_providers',
    migratedAt: '2026-03-10',
  },
  listings: {
    migrated: true,
    legacyTable: 'service_listings',
    activeTable: 'svc_listings',
    migratedAt: '2026-03-10',
  },
  orders: {
    migrated: true,
    legacyTable: 'service_orders',
    activeTable: 'svc_orders',
    migratedAt: '2026-03-15',
  },
  portfolio: {
    migrated: true,
    legacyTable: null, // Only exists in svc_* system
    activeTable: 'svc_portfolio',
    migratedAt: null,
  },
  bookings: {
    migrated: false,
    note: 'service_bookings is still the primary table for bookings',
    legacyTable: 'service_bookings',
    activeTable: 'service_bookings', // Same table
  },
};

/**
 * Check if a table is part of the active service system
 */
export function isActiveServiceTable(tableName: string): boolean {
  const activeTables = Object.values(SERVICE_TABLES).filter(
    (t) => typeof t === 'string'
  );
  return activeTables.includes(tableName as ServiceTable);
}

/**
 * Check if a table is part of the legacy service system
 */
export function isLegacyServiceTable(tableName: string): boolean {
  const legacyTables = Object.values(SERVICE_TABLES.legacy);
  return legacyTables.includes(tableName as LegacyServiceTable);
}

/**
 * Get migration information for a table
 */
export function getMigrationInfo(tableName: string): {
  migrated: boolean;
  recommendedTable: string;
  note?: string;
} | null {
  for (const [key, info] of Object.entries(MIGRATION_STATUS)) {
    if (info.legacyTable === tableName || info.activeTable === tableName) {
      return {
        migrated: info.migrated,
        recommendedTable: info.activeTable,
        note: info.note,
      };
    }
  }
  return null;
}

// Export for database queries
export default {
  tables: SERVICE_TABLES,
  queries: ServiceQueries,
  migration: MIGRATION_STATUS,
  isActiveServiceTable,
  isLegacyServiceTable,
  getMigrationInfo,
  getServiceTable,
};
