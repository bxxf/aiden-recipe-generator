/**
 * Tool response helper - formats data for MCP tool responses.
 */

/** Format data as MCP tool response with both text and structured content */
export function toolResponse<T extends object>(data: T) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data
  };
}
