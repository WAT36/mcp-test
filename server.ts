// server.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "local-date-server",
  version: "1.0.0",
});

// 入力なし→現在日時を返す最小ツール
server.registerTool(
  "current_date",
  {
    title: "Current Date Tool",
    description: "Return current date/time and weekday (ja-JP)",
    inputSchema: {},
    outputSchema: { now: z.string(), weekday: z.string() },
  },
  async () => {
    const d = new Date();
    const output = {
      now: d.toISOString(),
      weekday: d.toLocaleDateString("ja-JP", { weekday: "long" }),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  }
);

// === stdio で待ち受け（Cursor などがサブプロセスとして起動）===
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch((e) => {
  console.error("MCP server failed:", e);
  process.exit(1);
});
