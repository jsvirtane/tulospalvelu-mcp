import "dotenv/config";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { TasoRestClient } from "./clients/rest-client.js";
import { TasoSearchClient } from "./clients/search-client.js";
import { loadConfig } from "./lib/config.js";
import { extractCollection, extractSingle, asObject } from "./lib/data.js";
import { InputError } from "./lib/errors.js";
import { resolveDateFilters } from "./lib/dates.js";
import {
  normalizeCategory,
  normalizeCompetition,
  normalizeLeagueTableDetail,
  normalizeMatchDetail,
  normalizeMatchSummary,
  normalizePlayerDetail,
  normalizeScore,
  normalizeSearchResult,
  normalizeSeason,
  normalizeTeamDetail,
  normalizeTeamSummary,
} from "./lib/normalize.js";
import { errorResult, successResult } from "./lib/result.js";

const SEARCH_ENTITY_TYPES = ["competition", "category", "club", "team", "player", "venue", "match"] as const;
const SPORTS = ["football", "futsal"] as const;
const MATCH_STATUSES = ["Planned", "Cancelled", "Fixture", "Live", "Break", "Played"] as const;
const COMPETITION_OFFICIALITY = ["official", "practice", "hobby", "tournament"] as const;

function ensureTeamHistoryInputs(competitionId?: string, categoryId?: string): void {
  if ((competitionId && !categoryId) || (!competitionId && categoryId)) {
    throw new InputError("get_team requires both competitionId and categoryId when requesting historical team data.");
  }
}

function ensureMatchQueryIsValid(input: {
  seasonId?: string;
  competitionId?: string;
  categoryId?: string;
  groupId?: string;
  teamId?: string;
  clubId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  venueCity?: string;
  matchStatus?: string;
  officialOnly?: boolean;
  competitionOfficiality?: readonly string[];
  text?: string;
  includeDetails?: boolean;
}) {
  if (input.text) {
    const forbiddenFields = [
      input.seasonId && "seasonId",
      input.competitionId && "competitionId",
      input.categoryId && "categoryId",
      input.groupId && "groupId",
      input.teamId && "teamId",
      input.clubId && "clubId",
      input.date && "date",
      input.venueCity && "venueCity",
      input.matchStatus && "matchStatus",
      input.officialOnly !== undefined && "officialOnly",
      input.competitionOfficiality && input.competitionOfficiality.length > 0 && "competitionOfficiality",
      input.includeDetails && "includeDetails",
    ].filter(Boolean);

    if (forbiddenFields.length > 0) {
      throw new InputError(
        `list_matches text mode only supports startDate, endDate, pageNumber, and pageSize. Unsupported fields: ${forbiddenFields.join(", ")}.`,
      );
    }

    return;
  }

  if (!input.seasonId && !input.competitionId) {
    throw new InputError("list_matches requires seasonId or competitionId unless text search mode is used.");
  }
}

async function main() {
  const config = loadConfig();
  const restClient = new TasoRestClient(config);
  const searchClient = new TasoSearchClient(config);

  const server = new McpServer({
    name: "palloliitto-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "search_entities",
    {
      title: "Search Entities",
      description: "Search Palloliitto entities such as competitions, categories, clubs, teams, players, venues, and matches.",
      inputSchema: {
        text: z.string().min(2),
        types: z.array(z.enum(SEARCH_ENTITY_TYPES)).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ text, types, limit }) => {
      try {
        const response = asObject(await searchClient.search(text));
        const rawItems = extractCollection(response, "results");
        const normalizedItems = rawItems
          .map((item) => normalizeSearchResult(item))
          .filter((item) => !types || (item.type && types.includes(item.type as (typeof SEARCH_ENTITY_TYPES)[number])));
        const items = typeof limit === "number" ? normalizedItems.slice(0, limit) : normalizedItems;

        return successResult({
          count: items.length,
          items,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "list_seasons",
    {
      title: "List Seasons",
      description: "List seasons for a sport. Football is the default.",
      inputSchema: {
        sport: z.enum(SPORTS).optional(),
      },
    },
    async ({ sport }) => {
      try {
        const response = await restClient.getSeasons({ sportId: sport ?? "football" });
        const items = extractCollection(response, "seasons").map((season) => normalizeSeason(season));

        return successResult({
          count: items.length,
          items,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "list_competitions",
    {
      title: "List Competitions",
      description: "List competitions by season and organiser filters.",
      inputSchema: {
        seasonId: z.string().optional(),
        organiser: z.string().optional(),
        current: z.boolean().optional(),
        official: z.boolean().optional(),
      },
    },
    async ({ seasonId, organiser, current, official }) => {
      try {
        const response = await restClient.getCompetitions({
          seasonId,
          organiser,
          current: current === undefined ? 1 : Number(current),
          official: official === undefined ? undefined : Number(official),
        });
        const items = extractCollection(response, "competitions").map((competition) => normalizeCompetition(competition));

        return successResult({
          count: items.length,
          items,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_competition",
    {
      title: "Get Competition",
      description: "Get a single competition by its Palloliitto competition ID.",
      inputSchema: {
        competitionId: z.string().min(1),
      },
    },
    async ({ competitionId }) => {
      try {
        const response = await restClient.getCompetition(competitionId);
        const competition = normalizeCompetition(extractSingle(response, "competition"));

        return successResult(competition);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "list_categories",
    {
      title: "List Categories",
      description: "List categories for a competition.",
      inputSchema: {
        competitionId: z.string().min(1),
      },
    },
    async ({ competitionId }) => {
      try {
        const response = await restClient.getCategories({ competitionId });
        const items = extractCollection(response, "categories").map((category) => normalizeCategory(category));

        return successResult({
          count: items.length,
          items,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_league_table",
    {
      title: "Get League Table",
      description: "Get detailed league table data, standings, player statistics, and optionally matches for a single group.",
      inputSchema: {
        competitionId: z.string().min(1),
        categoryId: z.string().min(1),
        groupId: z.string().min(1),
        includeMatches: z.boolean().optional(),
      },
    },
    async ({ competitionId, categoryId, groupId, includeMatches }) => {
      try {
        const response = await restClient.getLeagueTable({
          competitionId,
          categoryId,
          groupId,
          matches: includeMatches ? 1 : undefined,
        });
        const leagueTable = normalizeLeagueTableDetail(extractSingle(response, "group"));

        return successResult(leagueTable);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "list_matches",
    {
      title: "List Matches",
      description: "List matches by date and filters, or run Taso text search mode.",
      inputSchema: {
        seasonId: z.string().optional(),
        competitionId: z.string().optional(),
        categoryId: z.string().optional(),
        groupId: z.string().optional(),
        teamId: z.string().optional(),
        clubId: z.string().optional(),
        date: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        venueCity: z.string().optional(),
        matchStatus: z.enum(MATCH_STATUSES).optional(),
        officialOnly: z.boolean().optional(),
        competitionOfficiality: z.array(z.enum(COMPETITION_OFFICIALITY)).optional(),
        text: z.string().min(2).optional(),
        includeDetails: z.boolean().optional(),
        pageNumber: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      },
    },
    async (input) => {
      try {
        ensureMatchQueryIsValid(input);
        const resolvedDates = resolveDateFilters({
          date: input.date,
          startDate: input.startDate,
          endDate: input.endDate,
        });

        const response = await restClient.getMatches(
          input.text
            ? {
                find: input.text,
                startDate: resolvedDates.startDate,
                endDate: resolvedDates.endDate,
                page: input.pageNumber,
                perPage: input.pageSize,
              }
            : {
                seasonId: input.seasonId,
                competitionId: input.competitionId,
                categoryId: input.categoryId,
                groupId: input.groupId,
                teamId: input.teamId,
                clubId: input.clubId,
                date: resolvedDates.date,
                startDate: resolvedDates.startDate,
                endDate: resolvedDates.endDate,
                venueCity: input.venueCity,
                matchStatus: input.matchStatus,
                officialOnly: input.officialOnly === undefined ? undefined : Number(input.officialOnly),
                competitionOfficiality: input.competitionOfficiality,
                details: input.includeDetails ? 1 : undefined,
                pageSize: input.pageSize,
                pageNumber: input.pageNumber,
              },
        );

        const items = extractCollection(response, "matches").map((match) =>
          input.includeDetails ? normalizeMatchDetail(match) : normalizeMatchSummary(match),
        );

        return successResult({
          count: items.length,
          items,
          query: {
            mode: input.text ? "text_search" : "filtered_list",
            text: input.text,
            resolvedDateFilters: resolvedDates,
          },
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_match",
    {
      title: "Get Match",
      description: "Get detailed match data for a single match ID.",
      inputSchema: {
        matchId: z.string().min(1),
      },
    },
    async ({ matchId }) => {
      try {
        const response = await restClient.getMatch(matchId);
        const match = normalizeMatchDetail(extractSingle(response, "match"));

        return successResult(match);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_match_score",
    {
      title: "Get Match Score",
      description: "Get the current or final score for a single match ID.",
      inputSchema: {
        matchId: z.string().min(1),
      },
    },
    async ({ matchId }) => {
      try {
        const response = await restClient.getScore(matchId);
        const score = normalizeScore(extractSingle(response, "score"));

        return successResult(score);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "list_teams",
    {
      title: "List Teams",
      description: "List teams in a competition, optionally filtered by category.",
      inputSchema: {
        competitionId: z.string().min(1),
        categoryId: z.string().optional(),
      },
    },
    async ({ competitionId, categoryId }) => {
      try {
        const response = await restClient.getTeams({ competitionId, categoryId });
        const items = extractCollection(response, "teams").map((team) => normalizeTeamSummary(team));

        return successResult({
          count: items.length,
          items,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_team",
    {
      title: "Get Team",
      description: "Get current roster data for a team, or historical roster data when competitionId and categoryId are both provided.",
      inputSchema: {
        teamId: z.string().min(1),
        competitionId: z.string().optional(),
        categoryId: z.string().optional(),
      },
    },
    async ({ teamId, competitionId, categoryId }) => {
      try {
        ensureTeamHistoryInputs(competitionId, categoryId);
        const response = await restClient.getTeam({ teamId, competitionId, categoryId });
        const team = normalizeTeamDetail(extractSingle(response, "team"));

        return successResult(team);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_player",
    {
      title: "Get Player",
      description: "Get player details by Palloliitto player ID.",
      inputSchema: {
        playerId: z.string().min(1),
      },
    },
    async ({ playerId }) => {
      try {
        const response = await restClient.getPlayer(playerId);
        const player = normalizePlayerDetail(extractSingle(response, "player"));

        return successResult(player);
      } catch (error) {
        return errorResult(error);
      }
    },
  );
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown startup error.";
  console.error(message);
  process.exit(1);
});
