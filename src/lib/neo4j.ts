import neo4j, { Driver } from 'neo4j-driver';
import { config } from '../config';

let driver: Driver | null = null;

/**
 * Get Neo4j Driver instance (Singleton)
 * Returns null if Neo4j is not configured
 */
export const getNeo4jDriver = (): Driver | null => {
  if (driver) return driver;

  const { neo4jUri, neo4jUser, neo4jPassword } = config;

  if (!neo4jUri || !neo4jPassword) {
    if (process.env.NODE_ENV === 'production' || process.env.STRICT_CONFIG === 'true') {
      console.error('❌ [NEO4J ERROR] Missing Neo4j configuration (URI or Password)');
    }
    return null;
  }

  try {
    // For PSC and standard Aura, we typically use bolt+s or bolt
    driver = neo4j.driver(
      neo4jUri,
      neo4j.auth.basic(neo4jUser || 'neo4j', neo4jPassword),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionTimeout: 30000, // 30 seconds
        // Trust strategy for PSC typically uses the system certs or is omitted if not needed
      }
    );
    
    console.log('✅ [NEO4J] Driver initialized successfully');
    return driver;
  } catch (error) {
    console.error('❌ [NEO4J ERROR] Failed to initialize driver:', error);
    return null;
  }
};

/**
 * Execute a Cypher query
 */
export const executeQuery = async (
  cypher: string,
  params: Record<string, any> = {}
) => {
  const driver = getNeo4jDriver();
  if (!driver) {
    throw new Error('Neo4j Driver not initialized. Check your environment variables.');
  }

  const session = driver.session();
  try {
    const result = await session.executeWrite(tx => tx.run(cypher, params));
    return result;
  } finally {
    await session.close();
  }
};

/**
 * Close the driver (Manual cleanup)
 */
export const closeNeo4jDriver = async () => {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('🔒 [NEO4J] Driver closed');
  }
};
