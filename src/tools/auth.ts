import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import type { FellowClient } from '@/fellow/client';
import { toolResponse } from '@/tools/response';

export function registerAuthTools(server: McpServer, fellow: FellowClient) {
  server.registerTool(
    'auth.login',
    {
      title: 'Fellow Login',
      description: 'Login to Fellow and store session locally (keychain when available).',
      inputSchema: {
        email: z.string().email(),
        password: z.string().min(1),
        timezone: z.string().default('Europe/Prague')
      },
      outputSchema: {
        ok: z.boolean(),
        email: z.string()
      }
    },
    async ({ email, password, timezone }) => toolResponse(await fellow.login({ email, password, timezone }))
  );

  server.registerTool(
    'auth.status',
    {
      title: 'Auth Status',
      description: 'Check if the MCP server has a stored Fellow session.',
      inputSchema: {},
      outputSchema: { ok: z.boolean(), loggedIn: z.boolean(), email: z.string().optional() }
    },
    async () => toolResponse(await fellow.status())
  );

  server.registerTool(
    'auth.logout',
    {
      title: 'Logout',
      description: 'Clear stored Fellow session.',
      inputSchema: {},
      outputSchema: { ok: z.boolean() }
    },
    async () => {
      await fellow.logout();
      return toolResponse({ ok: true });
    }
  );
}
