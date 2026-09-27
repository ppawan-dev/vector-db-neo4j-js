import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { createKnowledgeAgent } from './agent.js';
import { createNeo4jDriver, createNeo4jSearchTool } from './neo4j.js';

async function main() {
  const question = process.argv.slice(2).join(' ').trim();
  let prompt = question;

  if (!prompt) {
    const readline = createInterface({ input: stdin, output: stdout });
    try {
      prompt = (await readline.question('You: ')).trim();
    } finally {
      readline.close();
    }
  }

  if (!prompt) {
    throw new Error('Enter a question to search your Neo4j knowledge graph.');
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Set OPENAI_API_KEY in .env.');
  }

  const driver = createNeo4jDriver();
  try {
    await driver.verifyConnectivity();
    const searchTool = createNeo4jSearchTool(
      driver,
      process.env.NEO4J_DATABASE,
    );
    const agent = createKnowledgeAgent(
      searchTool,
      process.env.OPENAI_MODEL || 'gpt-4o-mini',
    );
    const result = await agent.invoke({
      messages: [{ role: 'user', content: prompt }],
    });
    const answer = result.messages.at(-1)?.content;
    console.log(
      'Agent: ' + typeof answer === 'string' ? answer : JSON.stringify(answer),
    );
  } finally {
    await driver.close();
  }
}

main().catch((error) => {
  console.error(`Agent error: ${error.message}`);
  process.exitCode = 1;
});
