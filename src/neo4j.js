import { tool } from "@langchain/core/tools";
import neo4j from "neo4j-driver";
import { z } from "zod";

export const SEARCH_QUERY = `
MATCH (node)
WITH node, [value IN [node.name, node.title, node.text, node.content, node.description]
  WHERE value IS NOT NULL AND toLower(toString(value)) CONTAINS toLower($query)] AS matches
WHERE size(matches) > 0
RETURN labels(node) AS labels, matches
LIMIT 10
`;

export function createNeo4jDriver(env = process.env) {
  const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = env;
  if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
    throw new Error("Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in .env.");
  }

  return neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
  );
}

export function createNeo4jSearchTool(driver, database) {
  return tool(
    async ({ query }) => {
      const session = driver.session(database ? { database } : undefined);
      try {
        const result = await session.run(SEARCH_QUERY, { query });
        return JSON.stringify(
          result.records.map((record) => ({
            labels: record.get("labels"),
            matches: record.get("matches"),
          })),
        );
      } finally {
        await session.close();
      }
    },
    {
      name: "search_neo4j_knowledge",
      description:
        "Search Neo4j node properties named name, title, text, content, or description for text relevant to the user's question.",
      schema: z.object({
        query: z.string().min(2).max(500).describe("Text to search for in the knowledge graph."),
      }),
    },
  );
}