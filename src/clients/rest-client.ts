import { AppConfig } from "../lib/config.js";
import { assertNoUpstreamError } from "../lib/data.js";
import { HttpClient } from "../lib/http.js";

export class TasoRestClient {
  private readonly httpClient: HttpClient;

  constructor(config: AppConfig) {
    this.httpClient = new HttpClient({
      baseUrl: config.baseUrl,
      acceptHeaderValue: config.acceptHeaderValue,
      timeoutMs: config.requestTimeoutMs,
    });
  }

  private async request(path: string, query: Record<string, unknown> = {}): Promise<unknown> {
    const response = await this.httpClient.get(path, query as Record<string, string | number | boolean | null | undefined | string[]>);
    assertNoUpstreamError(response, path);
    return response;
  }

  getSeasons(params: { sportId?: string }) {
    return this.request("getSeasons", {
      sport_id: params.sportId,
    });
  }

  getCompetitions(params: {
    current?: number;
    seasonId?: string;
    organiser?: string;
    official?: number;
  }) {
    return this.request("getCompetitions", {
      current: params.current,
      season_id: params.seasonId,
      organiser: params.organiser,
      official: params.official,
    });
  }

  getCompetition(competitionId: string) {
    return this.request("getCompetition", {
      competition_id: competitionId,
    });
  }

  getCategories(params: {
    competitionId: string;
  }) {
    return this.request("getCategories", {
      competition_id: params.competitionId,
    });
  }

  getLeagueTable(params: {
    competitionId: string;
    categoryId: string;
    groupId: string;
    matches?: number;
  }) {
    return this.request("getGroup", {
      competition_id: params.competitionId,
      category_id: params.categoryId,
      group_id: params.groupId,
      matches: params.matches,
    });
  }

  getMatches(params: {
    seasonId?: string;
    competitionId?: string;
    categoryId?: string;
    groupId?: string;
    venueCity?: string;
    teamId?: string;
    startDate?: string;
    endDate?: string;
    date?: string;
    clubId?: string;
    details?: number;
    find?: string;
    page?: number;
    perPage?: number;
    pageSize?: number;
    pageNumber?: number;
    matchStatus?: string;
    officialOnly?: number;
    competitionOfficiality?: string[];
  }) {
    return this.request("getMatches", {
      season_id: params.seasonId,
      competition_id: params.competitionId,
      category_id: params.categoryId,
      group_id: params.groupId,
      venue_city: params.venueCity,
      team_id: params.teamId,
      start_date: params.startDate,
      end_date: params.endDate,
      date: params.date,
      club_id: params.clubId,
      details: params.details,
      find: params.find,
      page: params.page,
      per_page: params.perPage,
      page_size: params.pageSize,
      page_number: params.pageNumber,
      match_status: params.matchStatus,
      official_only: params.officialOnly,
      competition_officiality: params.competitionOfficiality,
    });
  }

  getMatch(matchId: string) {
    return this.request("getMatch", {
      match_id: matchId,
    });
  }

  getScore(matchId: string) {
    return this.request("getScore", {
      match_id: matchId,
    });
  }

  getTeams(params: { competitionId: string; categoryId?: string }) {
    return this.request("getTeams", {
      competition_id: params.competitionId,
      category_id: params.categoryId,
    });
  }

  getTeam(params: { teamId: string; competitionId?: string; categoryId?: string }) {
    return this.request("getTeam", {
      team_id: params.teamId,
      competition_id: params.competitionId,
      category_id: params.categoryId,
    });
  }

  getPlayer(playerId: string) {
    return this.request("getPlayer", {
      player_id: playerId,
    });
  }
}
