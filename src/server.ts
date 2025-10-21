import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// 1) MCPサーバー本体
const server = new McpServer({
  name: "date-info-server",
  version: "1.0.0",
});

// 2) ツール登録（今日の日付を返すだけ）
server.registerTool(
  "current_date",
  {
    title: "Current Date Tool",
    description: "Return current date/time and weekday in ja-JP",
    inputSchema: {}, // 入力なし
    outputSchema: {
      // 返却の構造化出力（任意）
      now: z.string(),
      weekday: z.string(),
    },
  },
  async () => {
    const d = new Date();
    const output = {
      now: d.toISOString(),
      weekday: d.toLocaleDateString("ja-JP", { weekday: "long" }),
    };
    return {
      // LLM向けのテキスト応答
      content: [{ type: "text", text: JSON.stringify(output) }],
      // 構造化データ（Apps/Inspector等が利用）
      structuredContent: output,
    };
  }
);

// 3) HTTPエンドポイント（/mcp にJSON-RPCを出す）
const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  // リクエスト毎にTransportを作成するのが推奨
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => transport.close());

  // サーバーをトランスポートへ接続
  await server.connect(transport);

  // リクエスト処理（JSON-RPC）
  await transport.handleRequest(req, res, req.body);
});

const port = parseInt(process.env.PORT || "3001", 10);
app
  .listen(port, () => {
    console.log(`✅ MCP server running at http://localhost:${port}/mcp`);
  })
  .on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });
