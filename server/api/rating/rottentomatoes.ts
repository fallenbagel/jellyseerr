import ExternalAPI from '@server/api/externalapi';
import cacheManager from '@server/lib/cache';
import { getSettings } from '@server/lib/settings';

interface RTAlgoliaSearchResponse {
  results: {
    hits: RTAlgoliaHit[];
    index: 'content_rt' | 'people_rt';
  }[];
}

interface RTAlgoliaHit {
  emsId: string;
  emsVersionId: string;
  tmsId: string;
  type: string;
  title: string;
  titles: string[];
  description: string;
  releaseYear: number;
  rating: string;
  genres: string[];
  updateDate: string;
  isEmsSearchable: boolean;
  rtId: number;
  vanity: string;
  aka: string[];
  posterImageUrl: string;
  rottenTomatoes: {
    audienceScore: number;
    criticsIconUrl: string;
    wantToSeeCount: number;
    audienceIconUrl: string;
    scoreSentiment: string;
    certifiedFresh: boolean;
    criticsScore: number;
  };
}

export interface RTRating {
  title: string;
  year: number;
  criticsRating: 'Certified Fresh' | 'Fresh' | 'Rotten';
  criticsScore: number;
  audienceRating?: 'Upright' | 'Spilled';
  audienceScore?: number;
  url: string;
}

/**
 * This is a best-effort API. The Rotten Tomatoes API is technically
 * private and getting access costs money/requires approval.
 *
 * They do, however, have a "public" api that they use to request the
 * data on their own site. We use this to get ratings for movies/tv shows.
 *
 * Unfortunately, we need to do it by searching for the movie name, so it's
 * not always accurate.
 */
class RottenTomatoes extends ExternalAPI {
  constructor() {
    const settings = getSettings();
    super(
      'https://79frdp12pn-dsn.algolia.net/1/indexes/*',
      {
        'x-algolia-agent': 'Algolia for JavaScript (4.14.3); Browser (lite)',
        'x-algolia-api-key': '175588f6e5f8319b27702e4cc4013561',
        'x-algolia-application-id': '79FRDP12PN',
      },
      {
        headers: {
          'x-algolia-usertoken': settings.clientId,
        },
        nodeCache: cacheManager.getCache('rt').data,
      }
    );
  }

  /**
   * Search the RT algolia api for the movie title
   *
   * We compare the release date to make sure its the correct
   * match. But it's not guaranteed to have results.
   *
   * @param name Movie name
   * @param year Release Year
   */
  public async getMovieRatings(
    name: string,
    year: number
  ): Promise<RTRating | null> {
    try {
      const data = await this.post<RTAlgoliaSearchResponse>('/queries', {
        requests: [
          {
            indexName: 'content_rt',
            query: name,
            params: 'filters=isEmsSearchable%20%3D%201&hitsPerPage=20',
          },
        ],
      });

      const contentResults = data.results.find((r) => r.index === 'content_rt');

      if (!contentResults) {
        return null;
      }

      // First, attempt to match exact name and year
      let movie = contentResults.hits.find(
        (movie) => movie.releaseYear === year && movie.title === name
      );

      // If we don't find a movie, try to match partial name and year
      if (!movie) {
        movie = contentResults.hits.find(
          (movie) => movie.releaseYear === year && movie.title.includes(name)
        );
      }

      // If we still dont find a movie, try to match just on year
      if (!movie) {
        movie = contentResults.hits.find((movie) => movie.releaseYear === year);
      }

      // One last try, try exact name match only
      if (!movie) {
        movie = contentResults.hits.find((movie) => movie.title === name);
      }

      if (!movie) {
        return null;
      }

      return {
        title: movie.title,
        url: `https://www.rottentomatoes.com/m/${movie.vanity}`,
        criticsRating: movie.rottenTomatoes.certifiedFresh
          ? 'Certified Fresh'
          : movie.rottenTomatoes.criticsScore >= 60
          ? 'Fresh'
          : 'Rotten',
        criticsScore: movie.rottenTomatoes.criticsScore,
        audienceRating:
          movie.rottenTomatoes.audienceScore >= 60 ? 'Upright' : 'Spilled',
        audienceScore: movie.rottenTomatoes.audienceScore,
        year: Number(movie.releaseYear),
      };
    } catch (e) {
      throw new Error(
        `[RT API] Failed to retrieve movie ratings: ${e.message}`
      );
    }
  }

  public async getTVRatings(
    name: string,
    year?: number
  ): Promise<RTRating | null> {
    try {
      const data = await this.post<RTAlgoliaSearchResponse>('/queries', {
        requests: [
          {
            indexName: 'content_rt',
            query: name,
            params: 'filters=isEmsSearchable%20%3D%201&hitsPerPage=20',
          },
        ],
      });

      const contentResults = data.results.find((r) => r.index === 'content_rt');

      if (!contentResults) {
        return null;
      }

      let tvshow: RTAlgoliaHit | undefined = contentResults.hits[0];

      if (year) {
        tvshow = contentResults.hits.find(
          (series) => series.releaseYear === year
        );
      }

      if (!tvshow) {
        return null;
      }

      return {
        title: tvshow.title,
        url: `https://www.rottentomatoes.com/tv/${tvshow.vanity}`,
        criticsRating:
          tvshow.rottenTomatoes.criticsScore >= 60 ? 'Fresh' : 'Rotten',
        criticsScore: tvshow.rottenTomatoes.criticsScore,
        audienceRating:
          tvshow.rottenTomatoes.audienceScore >= 60 ? 'Upright' : 'Spilled',
        audienceScore: tvshow.rottenTomatoes.audienceScore,
        year: Number(tvshow.releaseYear),
      };
    } catch (e) {
      throw new Error(`[RT API] Failed to retrieve tv ratings: ${e.message}`);
    }
  }
}

export default RottenTomatoes;
