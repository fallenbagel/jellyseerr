export interface TvdbBaseResponse<T> {
  data: T;
  errors: string;
}

export interface TvdbLoginResponse extends TvdbBaseResponse<{ token: string }> {
  data: { token: string };
}

export interface TvdbTvShowDetail {
  tvdbId: number;
  title: string;
  overview: string;
  slug: string;
  originalCountry: string;
  originalLanguage: string;
  language: string;
  firstAired: string;
  lastAired: string;
  tvMazeId: number;
  tmdbId: number;
  imdbId: string;
  lastUpdated: string;
  status: string;
  runtime: number;
  timeOfDay: TvdbTimeOfDay;
  originalNetwork: string;
  network: string;
  genres: string[];
  alternativeTitles: TvdbAlternativeTitle[];
  actors: TvdbActor[];
  images: TvdbImage[];
  seasons: TvdbSeason[];
  episodes: TvdbEpisode[];
}

export interface TvdbTimeOfDay {
  hours: number;
  minutes: number;
}

export interface TvdbAlternativeTitle {
  title: string;
}

export interface TvdbActor {
  name: string;
  character: string;
  image?: string;
}

export interface TvdbImage {
  coverType: string;
  url: string;
}

export interface TvdbSeason {
  seasonNumber: number;
}

export interface TvdbEpisode {
  tvdbShowId: number;
  tvdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  absoluteEpisodeNumber: number;
  title?: string;
  airDate: string;
  airDateUtc: string;
  runtime?: number;
  overview?: string;
  image?: string;
}

export interface TvdbEpisodeTranslation
  extends TvdbBaseResponse<TvdbEpisodeTranslation> {
  name: string;
  overview: string;
  language: string;
}
