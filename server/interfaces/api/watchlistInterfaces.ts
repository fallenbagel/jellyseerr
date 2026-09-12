import type { MediaStatus } from '@server/constants/media';

export type WatchlistItemMediaType = 'movie' | 'tv';

export interface WatchlistMediaInfo {
  status: MediaStatus;
  hasActiveRequest?: boolean;
  mediaUrl?: string;
  mediaUrl4k?: string;
}

export interface WatchlistItem {
  id: number;
  ratingKey: string;
  tmdbId: number;
  mediaType: WatchlistItemMediaType;
  title: string;
  originalTitle?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  overview?: string | null;
  releaseDate?: string | null;
  genreIds?: number[];
  studioIds?: number[];
  originalLanguage?: string | null;
  certification?: string | null;
  runtime?: number | null;
  voteAverage?: number | null;
  voteCount?: number | null;
  popularity?: number | null;
  watchProviders?: number[];
  metadataUpdated?: boolean;
  mediaInfo?: WatchlistMediaInfo;
  createdAt?: string;
}

export interface WatchlistResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: WatchlistItem[];
}

export type WatchlistMediaFilter = 'all' | 'movie' | 'tv';
export type WatchlistStatusFilter =
  | 'all'
  | 'notrequested'
  | 'requested'
  | 'available'
  | 'partiallyavailable';
export type WatchlistReleaseState = 'all' | 'released' | 'upcoming';

export interface WatchlistQuery {
  page?: number;
  mediaType?: WatchlistMediaFilter;
  query?: string;
  mediaStatus?: WatchlistStatusFilter;
  releaseState?: WatchlistReleaseState;
  status?: string;
  primaryReleaseDateGte?: string;
  primaryReleaseDateLte?: string;
  firstAirDateGte?: string;
  firstAirDateLte?: string;
  studio?: string;
  genre?: string;
  language?: string;
  watchRegion?: string;
  withRuntimeGte?: string;
  withRuntimeLte?: string;
  voteAverageGte?: string;
  voteAverageLte?: string;
  voteCountGte?: string;
  voteCountLte?: string;
  watchProviders?: string;
  certification?: string;
  sortBy?: string;
}
