import type {
  TmdbSeasonWithEpisodes,
  TmdbTvDetails,
} from '@server/api/indexer/themoviedb/interfaces';

export interface TvShowIndexer {
  getTvShow({
    tvId,
    language,
  }: {
    tvId: number;
    language?: string;
  }): Promise<TmdbTvDetails>;
  getTvSeason({
    tvId,
    seasonId,
    seasonNumber,
    language,
  }: {
    tvId: number;
    seasonId: number;
    seasonNumber: number;
    language?: string;
  }): Promise<TmdbSeasonWithEpisodes>;
}
