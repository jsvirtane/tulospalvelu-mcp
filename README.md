# Palloliitto MCP

Read-only MCP server for the Palloliitto match center API.

## Features

- Search competitions, categories, clubs, teams, players, and venues through the open search endpoint.
- Discover seasons, competitions, and categories for football & futsal.
- List and inspect matches, teams, players, and current/final scores.
- Return normalized, LLM-friendly JSON payloads over MCP `stdio`.

## Requirements

- Node.js 20+

## Configuration

The server reads configuration from environment variables.

| Variable | Required | Default |
| --- | --- | --- |
| `PALLOLIITTO_BASE_URL` | No | `https://spl.torneopal.net/taso/rest` |
| `PALLOLIITTO_ACCEPT_HEADER` | Yes | - |
| `PALLOLIITTO_REQUEST_TIMEOUT_MS` | No | `10000` |

## Development

```bash
npm install
npm run build
npm run typecheck
```

## MCP Client Example

```json
{
  "mcpServers": {
    "palloliitto": {
      "command": "node",
      "args": ["/absolute/path/to/palloliitto-mcp/dist/server.js"],
      "env": {
        "PALLOLIITTO_BASE_URL": "https://spl.torneopal.net/taso/rest",
        "PALLOLIITTO_ACCEPT_HEADER": "json/n9tnjq45uuccbe8nbfy6q7ggmreqntvs"
      }
    }
  }
}
```

## Tools

- `search_entities`
- `list_seasons`
- `list_competitions`
- `get_competition`
- `list_categories`
- `list_matches`
- `get_match`
- `get_match_score`
- `list_teams`
- `get_team`
- `get_player`
