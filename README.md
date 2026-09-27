# Neo4j Knowledge Agent

A command-line JavaScript AI agent built with LangGraph and OpenAI. It searches text properties in Neo4j to answer questions.

## Setup

Requires Node.js 20 or newer and a Neo4j database.

```sh
npm install
```

Copy `.env.example` to `.env` and set your OpenAI and Neo4j credentials. The `.env` file is ignored by Git; do not commit it.

Add knowledge to Neo4j using node properties named `name`, `title`, `text`, `content`, or `description`. For example:

```cypher
CREATE (:Knowledge {title: 'LangGraph', content: 'LangGraph builds stateful agents and workflows.'})
```

## Run

Pass a question as an argument, or run without one to be prompted:

```sh
npm start -- "What does LangGraph do?"
npm start
```

The LangGraph agent can call a Neo4j search tool. That tool uses one fixed, parameterized, read-only query; model-generated Cypher is never executed. It searches the supported text properties and returns matching values and node labels, with a limit of 10 results.

Run the project checks with `npm test`.
