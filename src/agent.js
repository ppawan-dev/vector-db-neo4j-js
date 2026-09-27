import {
  END,
  START,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

export function createKnowledgeAgent(searchTool, modelName = "gpt-4o-mini") {
  const model = new ChatOpenAI({ model: modelName, temperature: 0 }).bindTools([
    searchTool,
  ]);

  return new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => ({
      messages: [await model.invoke(state.messages)],
    }))
    .addNode("tools", new ToolNode([searchTool]))
    .addEdge(START, "agent")
    .addConditionalEdges("agent", (state) => {
      const lastMessage = state.messages.at(-1);
      return lastMessage?.tool_calls?.length ? "tools" : END;
    })
    .addEdge("tools", "agent")
    .compile();
}