import { executeQuery } from '../../src/lib/neo4j';

/**
 * Syncs user values from Ignition phase to Neo4j
 * @param userId Unique ID of the user
 * @param userName Display name or first name of the user
 * @param values Array of values with weights (3-5 for Ignition)
 */
export async function syncUserIgnitionToGraph(
  userId: string,
  userName: string,
  values: { name: string; weight: number }[]
) {
  console.log(`[NEO4J SYNC] Syncing Ignition for user ${userId} (${values.length} values)`);

  const cypher = `
    MERGE (u:User {id: $userId})
    SET u.name = $userName, u.updatedAt = datetime()
    WITH u
    UNWIND $values as val
    MERGE (v:Value {name: val.name})
    MERGE (u)-[r:PRIORITIZES]->(v)
    SET r.weight = val.weight, r.updatedAt = datetime()
  `;

  try {
    await executeQuery(cypher, { userId, userName, values });
    return { success: true };
  } catch (error) {
    console.error(`[NEO4J SYNC ERROR] Failed to sync user ${userId}:`, error);
    return { success: false, error };
  }
}

/**
 * Fetches the interactive graph data for the "Command Canvas"
 * @param userId Unique ID of the user
 */
export async function getUserGraphData(userId: string) {
  const cypher = `
    MATCH (u:User {id: $userId})-[r:PRIORITIZES]->(v:Value)
    RETURN 
      { id: u.id, label: u.name, type: 'user' } as user,
      collect({ id: v.name, label: v.name, type: 'value', weight: r.weight }) as values
  `;

  try {
    const result = await executeQuery(cypher, { userId });
    if (result.records.length === 0) return { nodes: [], links: [] };

    const record = result.records[0].get(0);
    const nodes = [record.user, ...record.values];
    const links = record.values.map((v: any) => ({
      source: record.user.id,
      target: v.id,
      value: v.weight * 10, // Scale for visual weighting
      type: 'PRIORITIZES'
    }));

    return { nodes, links };
  } catch (error) {
    console.error(`[NEO4J ERROR] Failed to fetch graph data for ${userId}:`, error);
    return { nodes: [], links: [] };
  }
}

/**
 * Advanced: Find Shortest Path to Fulfillment (Draft)
 * Calculates paths from User values to suggested Roles or Projects
 */
export async function getFulfillmentPaths(userId: string) {
  // This is a placeholder for actual GDS logic or advanced path weighting
  const cypher = `
    MATCH (u:User {id: $userId})-[r:PRIORITIZES]->(v:Value)-[s:SUPPORTS]->(target)
    RETURN target, sum(r.weight * s.score) as alignmentScore
    ORDER BY alignmentScore DESC
    LIMIT 5
  `;
  // For now, we return empty as we haven't mapped Roles/Projects in Neo4j yet
  return [];
}
