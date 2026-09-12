import type { WatchlistQuery } from '@server/interfaces/api/watchlistInterfaces';
import { z } from 'zod';

export const WatchlistQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  mediaType: z.enum(['all', 'movie', 'tv']).optional(),
  query: z.coerce.string().trim().optional(),
  mediaStatus: z
    .enum([
      'all',
      'notrequested',
      'requested',
      'available',
      'partiallyavailable',
    ])
    .optional(),
  releaseState: z.enum(['all', 'released', 'upcoming']).optional(),
  status: z.coerce.string().optional(),
  primaryReleaseDateGte: z.coerce.string().optional(),
  primaryReleaseDateLte: z.coerce.string().optional(),
  firstAirDateGte: z.coerce.string().optional(),
  firstAirDateLte: z.coerce.string().optional(),
  studio: z.coerce.string().optional(),
  genre: z.coerce.string().optional(),
  language: z.coerce.string().optional(),
  watchRegion: z.coerce.string().optional(),
  withRuntimeGte: z.coerce.string().optional(),
  withRuntimeLte: z.coerce.string().optional(),
  voteAverageGte: z.coerce.string().optional(),
  voteAverageLte: z.coerce.string().optional(),
  voteCountGte: z.coerce.string().optional(),
  voteCountLte: z.coerce.string().optional(),
  watchProviders: z.coerce.string().optional(),
  certification: z.coerce.string().optional(),
  sortBy: z
    .enum([
      'watchlistAddedAsc',
      'watchlistAddedDesc',
      'title.asc',
      'title.desc',
      'releaseDate.asc',
      'releaseDate.desc',
      'voteAverage.desc',
      'popularity.asc',
      'popularity.desc',
      'vote_average.asc',
      'vote_average.desc',
      'release_date.asc',
      'release_date.desc',
      'primary_release_date.asc',
      'primary_release_date.desc',
      'first_air_date.asc',
      'first_air_date.desc',
      'original_title.asc',
      'original_title.desc',
      'original_name.asc',
      'original_name.desc',
    ])
    .optional(),
});

export const parseWatchlistQuery = (query: unknown): WatchlistQuery =>
  WatchlistQuerySchema.parse(query);
