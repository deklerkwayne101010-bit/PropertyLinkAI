import { IMigrationManager, MigrationStatus } from '../shared/interfaces';
import { MigrationScript } from './types';

/**
 * Migration Manager - Handles database migrations for modules
 * Supports module-specific migrations with rollback capabilities
 */
export class MigrationManager implements IMigrationManager {
  private migrations = new Map<string, MigrationScript[]>();
  private executedMigrations = new Map<string, Set<string>>();

  /**
   * Register migrations for a module
   */
  registerMigrations(moduleId: string, migrations: MigrationScript[]): void {
    this.migrations.set(moduleId, migrations);
    this.executedMigrations.set(moduleId, new Set());
  }

  /**
   * Run migrations for a specific module
   */
  async migrate(moduleId: string): Promise<void> {
    const migrations = this.migrations.get(moduleId);
    if (!migrations) {
      throw new Error(`No migrations registered for module '${moduleId}'`);
    }

    const executed = this.executedMigrations.get(moduleId)!;

    // Sort migrations by version
    const pendingMigrations = migrations
      .filter(m => !executed.has(m.version))
      .sort((a, b) => a.version.localeCompare(b.version));

    if (pendingMigrations.length === 0) {
      console.log(`No pending migrations for module '${moduleId}'`);
      return;
    }

    console.log(`Running ${pendingMigrations.length} migrations for module '${moduleId}'`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`Running migration ${migration.version}: ${migration.description || 'No description'}`);

        // Get database connection (this would be injected)
        const db = this.getDatabaseConnection();

        await migration.up(db);

        // Mark as executed
        executed.add(migration.version);

        // Record migration execution (in a real system, this would be stored in DB)
        await this.recordMigrationExecution(moduleId, migration.version);

        console.log(`✅ Migration ${migration.version} completed`);

      } catch (error) {
        console.error(`❌ Migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    console.log(`All migrations completed for module '${moduleId}'`);
  }

  /**
   * Rollback migrations for a specific module
   */
  async rollback(moduleId: string, steps: number = 1): Promise<void> {
    const migrations = this.migrations.get(moduleId);
    if (!migrations) {
      throw new Error(`No migrations registered for module '${moduleId}'`);
    }

    const executed = this.executedMigrations.get(moduleId)!;

    // Get executed migrations in reverse order
    const executedMigrations = migrations
      .filter(m => executed.has(m.version))
      .sort((a, b) => b.version.localeCompare(a.version))
      .slice(0, steps);

    if (executedMigrations.length === 0) {
      console.log(`No migrations to rollback for module '${moduleId}'`);
      return;
    }

    console.log(`Rolling back ${executedMigrations.length} migrations for module '${moduleId}'`);

    for (const migration of executedMigrations) {
      try {
        console.log(`Rolling back migration ${migration.version}: ${migration.description || 'No description'}`);

        const db = this.getDatabaseConnection();

        await migration.down(db);

        // Remove from executed set
        executed.delete(migration.version);

        // Remove migration record
        await this.removeMigrationRecord(moduleId, migration.version);

        console.log(`✅ Migration ${migration.version} rolled back`);

      } catch (error) {
        console.error(`❌ Rollback of migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    console.log(`Rollback completed for module '${moduleId}'`);
  }

  /**
   * Get migration status for a module
   */
  async getStatus(moduleId: string): Promise<MigrationStatus[]> {
    const migrations = this.migrations.get(moduleId) || [];
    const executed = this.executedMigrations.get(moduleId) || new Set();

    return migrations.map(migration => {
      const status: MigrationStatus = {
        version: migration.version,
        executed: executed.has(migration.version)
      };

      if (executed.has(migration.version)) {
        status.timestamp = new Date(); // In real system, get from DB
      }

      return status;
    });
  }

  /**
   * Get all registered modules with migrations
   */
  getRegisteredModules(): string[] {
    return Array.from(this.migrations.keys());
  }

  /**
   * Check if a module has pending migrations
   */
  hasPendingMigrations(moduleId: string): boolean {
    const migrations = this.migrations.get(moduleId);
    const executed = this.executedMigrations.get(moduleId);

    if (!migrations || !executed) {
      return false;
    }

    return migrations.some(m => !executed.has(m.version));
  }

  /**
   * Get pending migrations count for a module
   */
  getPendingMigrationsCount(moduleId: string): number {
    const migrations = this.migrations.get(moduleId);
    const executed = this.executedMigrations.get(moduleId);

    if (!migrations || !executed) {
      return 0;
    }

    return migrations.filter(m => !executed.has(m.version)).length;
  }

  private getDatabaseConnection(): any {
    // This would be injected or retrieved from a connection pool
    // For now, return a mock
    return {
      // Mock database operations
      createTable: async (name: string, schema: any) => {
        console.log(`Creating table ${name} with schema:`, schema);
      },
      dropTable: async (name: string) => {
        console.log(`Dropping table ${name}`);
      },
      alterTable: async (name: string, changes: any) => {
        console.log(`Altering table ${name} with changes:`, changes);
      },
      execute: async (sql: string, params?: any[]) => {
        console.log(`Executing SQL: ${sql}`, params);
      }
    };
  }

  private async recordMigrationExecution(moduleId: string, version: string): Promise<void> {
    // In a real system, this would insert into a migrations table
    console.log(`Recording migration execution: ${moduleId} v${version}`);
  }

  private async removeMigrationRecord(moduleId: string, version: string): Promise<void> {
    // In a real system, this would delete from a migrations table
    console.log(`Removing migration record: ${moduleId} v${version}`);
  }
}

/**
 * Helper function to create a migration script
 */
export function createMigration(
  version: string,
  up: (db: any) => Promise<void>,
  down: (db: any) => Promise<void>,
  description?: string
): MigrationScript {
  const migration: MigrationScript = {
    version,
    up,
    down
  };

  if (description !== undefined) {
    migration.description = description;
  }

  return migration;
}

/**
 * Helper function to create a table migration
 */
export function createTableMigration(
  version: string,
  tableName: string,
  schema: any,
  description?: string
): MigrationScript {
  return createMigration(
    version,
    async (db) => {
      await db.createTable(tableName, schema);
    },
    async (db) => {
      await db.dropTable(tableName);
    },
    description || `Create table ${tableName}`
  );
}

// Export singleton instance
export const migrationManager = new MigrationManager();