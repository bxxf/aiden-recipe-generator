import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import type { SheetProfileStore } from '@/sheet/store';
import { toolResponse } from '@/tools/response';

const SheetProfileSchema = z.object({
  title: z.string(),
  origin: z.string().optional(),
  roast: z.string().optional(),
  processing: z.string().optional(),
  varietal: z.string().optional(),
  brewRatio: z.string().optional(),
  bloomRatio: z.string().optional(),
  bloomTime: z.string().optional(),
  bloomTemp: z.string().optional(),
  ssPulsesNumber: z.string().optional(),
  ssPulsesInterval: z.string().optional(),
  ssPulseTemps: z.string().optional(),
  batchPulsesNumber: z.string().optional(),
  batchPulsesInterval: z.string().optional(),
  batchPulseTemps: z.string().optional()
});

export function registerSheetTools(server: McpServer, sheetStore: SheetProfileStore) {
  server.registerTool(
    'sheet.sync',
    {
      title: 'Sync Community Sheet',
      description: 'Fetch the public CSV export and update the local cache of community profiles.',
      inputSchema: { csvUrl: z.string().url().optional() },
      outputSchema: { ok: z.boolean(), csvUrl: z.string(), profileCount: z.number() }
    },
    async ({ csvUrl }) => toolResponse(await sheetStore.sync({ csvUrl }))
  );

  server.registerTool(
    'sheet.list',
    {
      title: 'List All Community Recipes',
      description: 'Get all community recipes from the cached sheet. Use this to browse available recipes.',
      inputSchema: {},
      outputSchema: { ok: z.boolean(), count: z.number(), profiles: z.array(SheetProfileSchema) }
    },
    async () => {
      const profiles = await sheetStore.getProfiles();
      return toolResponse({ ok: true, count: profiles.length, profiles });
    }
  );

  server.registerTool(
    'sheet.search',
    {
      title: 'Search Community Recipes',
      description:
        'Filter community recipes by origin, roast, processing, or free text. Returns matching profiles with full brewing parameters.',
      inputSchema: {
        query: z.string().optional().describe('Free text search (roaster name, coffee name, varietal)'),
        origin: z.string().optional().describe('Coffee origin (e.g., Ethiopia, Colombia, Brazil)'),
        roast: z.string().optional().describe('Roast level (light, medium, dark)'),
        processing: z.string().optional().describe('Processing method (washed, natural, honey)'),
        limit: z.number().int().min(1).max(100).default(20)
      },
      outputSchema: { ok: z.boolean(), count: z.number(), profiles: z.array(SheetProfileSchema) }
    },
    async ({ query, origin, roast, processing, limit }) => {
      const all = await sheetStore.getProfiles();

      const matches = all.filter((p) => {
        if (query) {
          const q = query.toLowerCase();
          const searchable = [p.title, p.origin, p.roast, p.processing, p.varietal]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!searchable.includes(q)) return false;
        }
        if (origin && !p.origin?.toLowerCase().includes(origin.toLowerCase())) return false;
        if (roast && !p.roast?.toLowerCase().includes(roast.toLowerCase())) return false;
        if (processing && !p.processing?.toLowerCase().includes(processing.toLowerCase())) return false;
        return true;
      });

      return toolResponse({ ok: true, count: matches.length, profiles: matches.slice(0, limit) });
    }
  );
}
