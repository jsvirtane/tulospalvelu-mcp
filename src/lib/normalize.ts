import {
  booleanFlagOrUndefined,
  compact,
  isObject,
  JsonObject,
  numberOrUndefined,
  stringOrUndefined,
} from "./data.js";

function toCamelCase(key: string): string {
  return key.replace(/_([a-zA-Z0-9])/g, (_, character: string) => character.toUpperCase());
}

function camelize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => camelize(item));
  }

  if (!isObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [toCamelCase(key), camelize(entryValue)]),
  );
}

function scoreTuple(home: unknown, away: unknown) {
  const homeScore = numberOrUndefined(home);
  const awayScore = numberOrUndefined(away);

  if (homeScore === undefined && awayScore === undefined) {
    return undefined;
  }

  return {
    home: homeScore ?? 0,
    away: awayScore ?? 0,
  };
}

function mapOfficial(raw: JsonObject, role: string, idKey: string, nameKey: string) {
  const officialId = stringOrUndefined(raw[idKey]);
  const officialName = stringOrUndefined(raw[nameKey]);

  if (!officialId && !officialName) {
    return undefined;
  }

  return compact({
    role,
    officialId,
    officialName,
  });
}

function normalizeMatchScore(raw: JsonObject) {
  return compact({
    live: scoreTuple(raw.live_A, raw.live_B),
    final: scoreTuple(raw.fs_A, raw.fs_B),
    halftime: scoreTuple(raw.hts_A, raw.hts_B),
    extraTime: scoreTuple(raw.es_A, raw.es_B),
    penalties: scoreTuple(raw.ps_A, raw.ps_B),
    periods: compact(
      [1, 2, 3, 4, 5]
        .map((periodNumber) =>
          scoreTuple(raw[`p${periodNumber}s_A`], raw[`p${periodNumber}s_B`])
            ? {
                period: periodNumber,
                ...(scoreTuple(raw[`p${periodNumber}s_A`], raw[`p${periodNumber}s_B`]) ?? {}),
              }
            : undefined,
        )
        .filter(Boolean),
    ),
    liveState: compact({
      period: stringOrUndefined(raw.live_period),
      time: stringOrUndefined(raw.live_time),
      timeMmss: stringOrUndefined(raw.live_time_mmss),
      minutes: stringOrUndefined(raw.live_minutes),
      timerStart: stringOrUndefined(raw.live_timer_start),
      timerStartTime: stringOrUndefined(raw.live_timer_start_time),
      timerOn: booleanFlagOrUndefined(raw.live_timer_on),
      foulsHome: numberOrUndefined(raw.live_fouls_A),
      foulsAway: numberOrUndefined(raw.live_fouls_B),
      serveTeam: stringOrUndefined(raw.live_serve_team),
    }),
  });
}

function normalizeMatchCore(raw: JsonObject) {
  return compact({
    matchId: stringOrUndefined(raw.match_id),
    matchNumber: stringOrUndefined(raw.match_number),
    matchReport: stringOrUndefined(raw.match_report),
    status: stringOrUndefined(raw.status),
    date: stringOrUndefined(raw.date),
    time: stringOrUndefined(raw.time),
    timeEnd: stringOrUndefined(raw.time_end),
    timeZone: stringOrUndefined(raw.time_zone),
    sunset: stringOrUndefined(raw.sunset),
    competition: compact({
      competitionId: stringOrUndefined(raw.competition_id),
      competitionName: stringOrUndefined(raw.competition_name),
      competitionStatus: stringOrUndefined(raw.competition_status),
      competitionOfficiality: stringOrUndefined(raw.competition_officiality),
      organiserId: stringOrUndefined(raw.organiser),
      seasonId: stringOrUndefined(raw.season_id),
    }),
    category: compact({
      categoryId: stringOrUndefined(raw.category_id),
      categoryName: stringOrUndefined(raw.category_name),
      categoryGroup: stringOrUndefined(raw.category_group),
      categoryGroupName: stringOrUndefined(raw.category_group_name),
      categoryGroupNameEn: stringOrUndefined(raw.category_group_name_en),
      categoryLive: booleanFlagOrUndefined(raw.category_live),
    }),
    group: compact({
      groupId: stringOrUndefined(raw.group_id),
      groupName: stringOrUndefined(raw.group_name),
      groupType: stringOrUndefined(raw.group_type),
    }),
    round: compact({
      roundId: stringOrUndefined(raw.round_id),
      roundName: stringOrUndefined(raw.round_name),
      roundDateBegin: stringOrUndefined(raw.round_date_begin),
      roundDateEnd: stringOrUndefined(raw.round_date_end),
      roundTeamId: stringOrUndefined(raw.round_team_id),
      roundClubId: stringOrUndefined(raw.round_club_id),
      roundClubName: stringOrUndefined(raw.round_club_name),
    }),
    homeTeam: compact({
      teamId: stringOrUndefined(raw.team_A_id),
      clubId: stringOrUndefined(raw.club_A_id),
      name: stringOrUndefined(raw.team_A_name),
      homeVenueId: stringOrUndefined(raw.team_A_home_venue_id),
    }),
    awayTeam: compact({
      teamId: stringOrUndefined(raw.team_B_id),
      clubId: stringOrUndefined(raw.club_B_id),
      name: stringOrUndefined(raw.team_B_name),
    }),
    venue: compact({
      venueId: stringOrUndefined(raw.venue_id),
      venueName: stringOrUndefined(raw.venue_name),
      competitionVenueName: stringOrUndefined(raw.venue_name_competition),
      cityName: stringOrUndefined(raw.venue_city_name),
      cityId: stringOrUndefined(raw.venue_city_id),
      areaName: stringOrUndefined(raw.venue_area_name),
      areaId: stringOrUndefined(raw.venue_area_id),
      suburbName: stringOrUndefined(raw.venue_suburb_name),
      locationId: stringOrUndefined(raw.venue_location_id),
      locationName: stringOrUndefined(raw.venue_location_name),
    }),
    attendance: numberOrUndefined(raw.attendance),
    score: normalizeMatchScore(raw),
  });
}

function normalizeLeagueTableStanding(raw: JsonObject) {
  return compact({
    teamId: stringOrUndefined(raw.team_id),
    teamName: stringOrUndefined(raw.team_name),
    currentStanding: numberOrUndefined(raw.current_standing),
    startingPoints: numberOrUndefined(raw.starting_points),
    points: numberOrUndefined(raw.points),
    matchesPlayed: numberOrUndefined(raw.matches_played),
    matchesWon: numberOrUndefined(raw.matches_won),
    matchesTied: numberOrUndefined(raw.matches_tied),
    matchesLost: numberOrUndefined(raw.matches_lost),
    goalsFor: numberOrUndefined(raw.goals_for),
    goalsAgainst: numberOrUndefined(raw.goals_against),
    pointsHome: numberOrUndefined(raw.points_home),
    matchesPlayedHome: numberOrUndefined(raw.matches_played_home),
    matchesWonHome: numberOrUndefined(raw.matches_won_home),
    matchesTiedHome: numberOrUndefined(raw.matches_tied_home),
    matchesLostHome: numberOrUndefined(raw.matches_lost_home),
    goalsForHome: numberOrUndefined(raw.goals_for_home),
    goalsAgainstHome: numberOrUndefined(raw.goals_against_home),
    pointsAway: numberOrUndefined(raw.points_away),
    matchesPlayedAway: numberOrUndefined(raw.matches_played_away),
    matchesWonAway: numberOrUndefined(raw.matches_won_away),
    matchesTiedAway: numberOrUndefined(raw.matches_tied_away),
    matchesLostAway: numberOrUndefined(raw.matches_lost_away),
    goalsForAway: numberOrUndefined(raw.goals_for_away),
    goalsAgainstAway: numberOrUndefined(raw.goals_against_away),
  });
}

function normalizeLeagueTablePlayerStatistic(raw: JsonObject) {
  return compact({
    playerId: stringOrUndefined(raw.player_id),
    playerName: stringOrUndefined(raw.player_name),
    firstName: stringOrUndefined(raw.first_name),
    lastName: stringOrUndefined(raw.last_name),
    teamId: stringOrUndefined(raw.team_id),
    teamName: stringOrUndefined(raw.team_name),
    goals: numberOrUndefined(raw.goals),
    assists: numberOrUndefined(raw.assists),
    warnings: numberOrUndefined(raw.warnings),
    suspensions: numberOrUndefined(raw.suspensions),
    playingTime: numberOrUndefined(raw.playing_time),
  });
}

export function normalizeSeason(raw: JsonObject) {
  return compact({
    seasonId: stringOrUndefined(raw.season_id),
    seasonDescription: stringOrUndefined(raw.season_description),
    sportId: stringOrUndefined(raw.sport_id),
  });
}

export function normalizeCompetition(raw: JsonObject) {
  return compact({
    competitionId: stringOrUndefined(raw.competition_id),
    competitionName: stringOrUndefined(raw.competition_name),
    competitionStatus: stringOrUndefined(raw.competition_status),
    competitionStartDate: stringOrUndefined(raw.competition_start_date),
    competitionEndDate: stringOrUndefined(raw.competition_end_date),
    seasonId: stringOrUndefined(raw.season_id),
    organiserId: stringOrUndefined(raw.organiser),
    organiserName: stringOrUndefined(raw.organiser_name),
    sportId: stringOrUndefined(raw.sport_id),
  });
}

export function normalizeCategory(raw: JsonObject) {
  return compact({
    competitionId: stringOrUndefined(raw.competition_id),
    competitionName: stringOrUndefined(raw.competition_name),
    categoryId: stringOrUndefined(raw.category_id),
    categoryName: stringOrUndefined(raw.category_name),
    categoryGroup: stringOrUndefined(raw.category_group),
    categoryGroupName: stringOrUndefined(raw.category_group_name),
    categoryLink: stringOrUndefined(raw.category_link),
    authorized: booleanFlagOrUndefined(raw.authorized),
  });
}

export function normalizeLeagueTableDetail(raw: JsonObject) {
  const teams = Array.isArray(raw.teams) ? raw.teams.filter(isObject) : [];
  const liveStandings = Array.isArray(raw.live_standings) ? raw.live_standings.filter(isObject) : [];
  const playerStatistics = Array.isArray(raw.player_statistics) ? raw.player_statistics.filter(isObject) : [];
  const matches = Array.isArray(raw.matches) ? raw.matches.filter(isObject) : [];

  return compact({
    competitionId: stringOrUndefined(raw.competition_id),
    competitionName: stringOrUndefined(raw.competition_name),
    seasonId: stringOrUndefined(raw.season_id),
    categoryId: stringOrUndefined(raw.category_id),
    categoryName: stringOrUndefined(raw.category_name),
    groupId: stringOrUndefined(raw.group_id),
    groupName: stringOrUndefined(raw.group_name),
    groupType: stringOrUndefined(raw.group_type),
    notices: compact({
      categoryNotice: stringOrUndefined(raw.category_notice),
      categoryNoticeFull: stringOrUndefined(raw.category_notice_full),
      groupNotice: stringOrUndefined(raw.group_notice),
      groupNoticeFull: stringOrUndefined(raw.group_notice_full),
    }),
    teams: compact(teams.map((team) => normalizeLeagueTableStanding(team))),
    liveStandings: compact(liveStandings.map((standing) => normalizeLeagueTableStanding(standing))),
    playerStatistics: compact(playerStatistics.map((player) => normalizeLeagueTablePlayerStatistic(player))),
    matches: matches.length > 0 ? compact(matches.map((match) => normalizeMatchSummary(match))) : undefined,
  });
}

export function normalizeMatchSummary(raw: JsonObject) {
  return compact({
    ...normalizeMatchCore(raw),
    refereeClassification: stringOrUndefined(raw.referee_classification),
  });
}

export function normalizeMatchDetail(raw: JsonObject) {
  const lineupItems = Array.isArray(raw.lineups) ? raw.lineups.filter(isObject) : [];
  const goalItems = Array.isArray(raw.goals) ? raw.goals.filter(isObject) : [];
  const bookingItems = Array.isArray(raw.bookings) ? raw.bookings.filter(isObject) : [];
  const eventItems = Array.isArray(raw.events) ? raw.events.filter(isObject) : [];

  return compact({
    ...normalizeMatchCore(raw),
    refereeClassification: stringOrUndefined(raw.referee_classification),
    assistantRefereeClassification: stringOrUndefined(raw.assistant_referee_classification),
    reportResult: stringOrUndefined(raw.report_result),
    periods: compact({
      periodCount: numberOrUndefined(raw.period_count),
      periodMinutes: numberOrUndefined(raw.period_min),
      extraPeriodCount: numberOrUndefined(raw.extra_period_count),
      extraPeriodMinutes: numberOrUndefined(raw.extra_period_min),
      penaltyShootoutCount: numberOrUndefined(raw.ps_count),
    }),
    conditions: compact({
      temperature: numberOrUndefined(raw.temperature),
      weather: stringOrUndefined(raw.weather),
    }),
    broadcast: compact({
      streamUrl: stringOrUndefined(raw.stream_url),
      ticketUrl: stringOrUndefined(raw.ticket_url),
      stream: stringOrUndefined(raw.stream),
      streamMedia: stringOrUndefined(raw.stream_media),
      streamMediaName: stringOrUndefined(raw.stream_media_name),
      streamImage: stringOrUndefined(raw.stream_img),
      tv: stringOrUndefined(raw.tv),
    }),
    notices: compact({
      notice: stringOrUndefined(raw.notice),
      resultNotice: stringOrUndefined(raw.result_notice),
    }),
    officials: compact(
      [
        mapOfficial(raw, "referee_1", "referee_1_id", "referee_1_name"),
        mapOfficial(raw, "referee_2", "referee_2_id", "referee_2_name"),
        mapOfficial(raw, "assistant_referee_1", "assistant_referee_1_id", "assistant_referee_1_name"),
        mapOfficial(raw, "assistant_referee_2", "assistant_referee_2_id", "assistant_referee_2_name"),
        mapOfficial(raw, "referee_observer", "referee_observer_id", "referee_observer_name"),
        mapOfficial(raw, "assistant_referee_observer", "assistant_referee_observer_id", "assistant_referee_observer_name"),
        mapOfficial(raw, "fourth_official", "fourth_official_id", "fourth_official_name"),
      ].filter(Boolean),
    ),
    lineups: compact(
      lineupItems.map((lineup) =>
        compact({
          lineupId: stringOrUndefined(lineup.lineup_id),
          matchId: stringOrUndefined(lineup.match_id),
          teamId: stringOrUndefined(lineup.team_id),
          playerId: stringOrUndefined(lineup.player_id),
          playerName: stringOrUndefined(lineup.player_name),
          firstName: stringOrUndefined(lineup.first_name),
          lastName: stringOrUndefined(lineup.last_name),
          shirtNumber: stringOrUndefined(lineup.shirt_number),
          shirtName: stringOrUndefined(lineup.shirt_name),
          isStarter: booleanFlagOrUndefined(lineup.start),
          captain: stringOrUndefined(lineup.captain),
          position: stringOrUndefined(lineup.position),
          positionFi: stringOrUndefined(lineup.position_fi),
          positionOrder: numberOrUndefined(lineup.position_order),
          playingTimeMinutes: numberOrUndefined(lineup.playing_time_min),
        }),
      ),
    ),
    goals: compact(
      goalItems.map((goal) =>
        compact({
          eventId: stringOrUndefined(goal.event_id),
          teamId: stringOrUndefined(goal.team_id),
          playerId: stringOrUndefined(goal.player_id),
          playerName: stringOrUndefined(goal.player_name),
          time: stringOrUndefined(goal.time),
          timeMinute: numberOrUndefined(goal.time_min),
          wallTime: stringOrUndefined(goal.wall_time),
          score: scoreTuple(goal.score_A, goal.score_B),
          description: stringOrUndefined(goal.description),
        }),
      ),
    ),
    bookings: compact(
      bookingItems.map((booking) =>
        compact({
          teamId: stringOrUndefined(booking.team_id),
          lineupId: stringOrUndefined(booking.lineup_id),
          playerId: stringOrUndefined(booking.player_id),
          playerName: stringOrUndefined(booking.player_name),
          time: stringOrUndefined(booking.time),
          timeMinute: numberOrUndefined(booking.time_min),
          wallTime: stringOrUndefined(booking.wall_time),
          code: stringOrUndefined(booking.code),
          description: stringOrUndefined(booking.description),
        }),
      ),
    ),
    events: compact(
      eventItems.map((event) =>
        compact({
          eventId: stringOrUndefined(event.event_id),
          teamId: stringOrUndefined(event.team_id),
          lineupId: stringOrUndefined(event.lineup_id),
          playerId: stringOrUndefined(event.player_id),
          playerName: stringOrUndefined(event.player_name),
          time: stringOrUndefined(event.time),
          timeMinute: numberOrUndefined(event.time_min),
          wallTime: stringOrUndefined(event.wall_time),
          period: stringOrUndefined(event.period),
          code: stringOrUndefined(event.code),
          description: stringOrUndefined(event.description),
        }),
      ),
    ),
  });
}

export function normalizeScore(raw: JsonObject) {
  return compact({
    matchId: stringOrUndefined(raw.match_id),
    matchNumber: stringOrUndefined(raw.match_number),
    competitionId: stringOrUndefined(raw.competition_id),
    categoryId: stringOrUndefined(raw.category_id),
    homeTeam: compact({
      teamId: stringOrUndefined(raw.team_A_id),
      name: stringOrUndefined(raw.team_A_name),
    }),
    awayTeam: compact({
      teamId: stringOrUndefined(raw.team_B_id),
      name: stringOrUndefined(raw.team_B_name),
    }),
    status: stringOrUndefined(raw.status),
    score: normalizeMatchScore(raw),
  });
}

export function normalizeTeamSummary(raw: JsonObject) {
  return compact({
    teamId: stringOrUndefined(raw.team_id),
    clubId: stringOrUndefined(raw.club_id),
    teamName: stringOrUndefined(raw.team_name),
    categoryId: stringOrUndefined(raw.category_id),
  });
}

export function normalizeTeamDetail(raw: JsonObject) {
  const players = Array.isArray(raw.players) ? raw.players.filter(isObject) : [];
  const officials = Array.isArray(raw.officials) ? raw.officials.filter(isObject) : [];
  const categories = Array.isArray(raw.categories) ? raw.categories.filter(isObject) : [];

  return compact({
    teamId: stringOrUndefined(raw.team_id),
    teamName: stringOrUndefined(raw.team_name),
    clubId: stringOrUndefined(raw.club_id),
    clubName: stringOrUndefined(raw.club_name),
    homeVenue: compact({
      venueId: stringOrUndefined(raw.home_venue_id),
      venueName: stringOrUndefined(raw.home_venue_name),
    }),
    players: compact(
      players.map((player) =>
        compact({
          playerId: stringOrUndefined(player.player_id),
          firstName: stringOrUndefined(player.first_name),
          lastName: stringOrUndefined(player.last_name),
          fullName: stringOrUndefined(player.player_name) ?? [stringOrUndefined(player.first_name), stringOrUndefined(player.last_name)].filter(Boolean).join(" "),
          shirtNumber: stringOrUndefined(player.shirt_number),
          shirtName: stringOrUndefined(player.shirt_name),
          captain: stringOrUndefined(player.captain),
          position: stringOrUndefined(player.position),
          birthday: stringOrUndefined(player.birthday),
          birthYear: stringOrUndefined(player.birthyear),
          heightCm: numberOrUndefined(player.height),
          weightKg: numberOrUndefined(player.weight),
          nationality: stringOrUndefined(player.nationality),
          imageUrl: stringOrUndefined(player.img_url),
          stats: compact({
            matches: numberOrUndefined(player.matches),
            goals: numberOrUndefined(player.goals),
            assists: numberOrUndefined(player.assists),
            warnings: numberOrUndefined(player.warnings),
            suspensions: numberOrUndefined(player.suspensions),
            playingTime: numberOrUndefined(player.playing_time),
          }),
        }),
      ),
    ),
    officials: compact(
      officials.map((official) =>
        compact({
          officialId: stringOrUndefined(official.official_id),
          firstName: stringOrUndefined(official.first_name),
          lastName: stringOrUndefined(official.last_name),
          officialRole: stringOrUndefined(official.official_role),
        }),
      ),
    ),
    categories: compact(
      categories.map((category) =>
        compact({
          competitionId: stringOrUndefined(category.competition_id),
          competitionName: stringOrUndefined(category.competition_name),
          competitionSeason: stringOrUndefined(category.competition_season),
          competitionStatus: stringOrUndefined(category.competition_status),
          categoryId: stringOrUndefined(category.category_id),
          categoryName: stringOrUndefined(category.category_name),
          categoryTeamName: stringOrUndefined(category.category_team_name),
        }),
      ),
    ),
  });
}

export function normalizePlayerDetail(raw: JsonObject) {
  const teams = Array.isArray(raw.teams) ? raw.teams.filter(isObject) : [];
  const matches = Array.isArray(raw.matches) ? raw.matches.filter(isObject) : [];

  return compact({
    playerId: stringOrUndefined(raw.player_id),
    firstName: stringOrUndefined(raw.first_name),
    lastName: stringOrUndefined(raw.last_name),
    fullName: [stringOrUndefined(raw.first_name), stringOrUndefined(raw.last_name)].filter(Boolean).join(" "),
    clubId: stringOrUndefined(raw.club_id),
    clubName: stringOrUndefined(raw.club_name),
    birthday: stringOrUndefined(raw.birthday),
    birthYear: stringOrUndefined(raw.birthyear),
    nationality: stringOrUndefined(raw.nationality),
    imageUrl: stringOrUndefined(raw.img_url),
    teams: compact(
      teams.map((team) =>
        compact({
          teamId: stringOrUndefined(team.team_id),
          teamName: stringOrUndefined(team.team_name),
          clubId: stringOrUndefined(team.club_id),
          clubName: stringOrUndefined(team.club_name),
          shirtNumber: stringOrUndefined(team.shirt_number),
          captain: stringOrUndefined(team.captain),
          position: stringOrUndefined(team.position),
        }),
      ),
    ),
    matches: compact(
      matches.map((match) =>
        compact({
          matchId: stringOrUndefined(match.match_id),
          matchNumber: stringOrUndefined(match.match_number),
          competitionId: stringOrUndefined(match.competition_id),
          competitionName: stringOrUndefined(match.competition_name),
          categoryId: stringOrUndefined(match.category_id),
          categoryName: stringOrUndefined(match.category_name),
          groupId: stringOrUndefined(match.group_id),
          groupName: stringOrUndefined(match.group_name),
          date: stringOrUndefined(match.date),
          teamId: stringOrUndefined(match.team_id),
          teamName: stringOrUndefined(match.team_name),
          playerGoals: numberOrUndefined(match.player_goals),
          playerWarnings: numberOrUndefined(match.player_warnings),
          playerSuspensions: numberOrUndefined(match.player_suspensions),
        }),
      ),
    ),
  });
}

export function normalizeSearchResult(raw: JsonObject) {
  return compact({
    type: stringOrUndefined(raw.type),
    id: stringOrUndefined(raw.id),
    text: stringOrUndefined(raw.text),
    data: isObject(raw.data) ? compact(camelize(raw.data)) : undefined,
  });
}
