# Tulospalvelu MCP

Read-only MCP server for the Palloliitto's result service API.

## Features

- Connect AI applications to Palloliitto's result service data.
- Search clubs, teams, players, competitions and venues data through the open search endpoint for football & futsal.
- Find and inspect match data.
- Discover competitions, historical season data.
- Return normalized, LLM-friendly JSON payloads over MCP `stdio`.

## Get started

Prerequisites:

- Node.js 20+

### Usage

1. Clone the repository

2. Build the application

   ```bash
   npm install
   npm run build
   ```

3. Install the MCP

- [Codex](https://developers.openai.com/codex/mcp#configure-with-the-cli)

  ```bash
  codex mcp add palloliitto \
  --env PALLOLIITTO_ACCEPT_HEADER=<your-accept-header> \
  -- node /absolute/path/to/palloliitto-mcp/dist/server.js
  ```

- [Claude Code](https://code.claude.com/docs/en/mcp#option-3-add-a-local-stdio-server)
- [Github Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers)

4. Enjoy!

### Development

```bash
npm install
npm run build
npm run typecheck
```

### Configuration

The server reads configuration from environment variables.

| Variable                         | Required | Default                               |
| -------------------------------- | -------- | ------------------------------------- |
| `PALLOLIITTO_BASE_URL`           | No       | `https://spl.torneopal.net/taso/rest` |
| `PALLOLIITTO_ACCEPT_HEADER`      | Yes      | -                                     |
| `PALLOLIITTO_REQUEST_TIMEOUT_MS` | No       | `10000`                               |

#### Acquiring PALLOLIITTO_ACCEPT_HEADER

- Open Palloliitto's [result service](https://tulospalvelu.palloliitto.fi/)
- Open browser's [developer tools](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Tools_and_setup/What_are_browser_developer_tools)
- Locate network tab
- Initiate search from the page
- Locate related network event `search?text=<your-search-string>`
- Look for `Accept` request header in Headers-tab and copy its value to use it as PALLOLIITTO_ACCEPT_HEADER env variable

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
