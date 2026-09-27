import assert from 'node:assert/strict';
import test from 'node:test';
import { createNeo4jSearchTool, SEARCH_QUERY } from '../src/neo4j.js';

test('Neo4j search uses fixed read-only Cypher and parameterizes the query', async () => {
  let receivedQuery;
  let receivedParameters;
  let sessionClosed = false;
  const driver = {
    session: () => ({
      run: async (query, parameters) => {
        receivedQuery = query;
        receivedParameters = parameters;
        return {
          records: [
            {
              get: (key) =>
                ({
                  labels: ['Knowledge'],
                  matches: ['LangGraph builds agents.'],
                })[key],
            },
          ],
        };
      },
      close: async () => {
        sessionClosed = true;
      },
    }),
  };

  const search = createNeo4jSearchTool(driver);
  const result = await search.invoke({ query: 'LangGraph' });

  assert.equal(receivedQuery, SEARCH_QUERY);
  assert.deepEqual(receivedParameters, { query: 'LangGraph' });
  assert.match(SEARCH_QUERY, /LIMIT 10/);
  assert.doesNotMatch(
    SEARCH_QUERY,
    /\b(CREATE|DELETE|DETACH|SET|REMOVE|MERGE)\b/i,
  );
  assert.equal(
    result,
    JSON.stringify([
      { labels: ['Knowledge'], matches: ['LangGraph builds agents.'] },
    ]),
  );
  assert.equal(sessionClosed, true);
});

test('Neo4j search validates the requested text', async () => {
  const search = createNeo4jSearchTool({
    session: () => {
      throw new Error('Should not connect');
    },
  });
  await assert.rejects(search.invoke({ query: 'x' }));
});
