export interface TvdbBaseResponse<T> {
  data: T;
  errors: string;
}

export interface TvdbLoginResponse {
  token: string;
}

interface TvDetailsAliases {
  language: string;
  name: string;
}

interface TvDetailsStatus {
  id: number;
  name: string;
  recordType: string;
  keepUpdated: boolean;
}

export interface TvdbTvDetails {
  id: number;
  name: string;
  slug: string;
  image: string;
  nameTranslations: string[];
  overwiewTranslations: string[];
  aliases: TvDetailsAliases[];
  firstAired: Date;
  lastAired: Date;
  nextAired: Date | string;
  score: number;
  status: TvDetailsStatus;
  originalCountry: string;
  originalLanguage: string;
  defaultSeasonType: string;
  isOrderRandomized: boolean;
  lastUpdated: Date;
  averageRuntime: number;
  seasons: TvdbSeasonDetails[];
  episodes: TvdbEpisode[];
}

interface TvdbCompanyType {
  companyTypeId: number;
  companyTypeName: string;
}

interface TvdbParentCompany {
  id?: number;
  name?: string;
  relation?: {
    id?: number;
    typeName?: string;
  };
}

interface TvdbCompany {
  id: number;
  name: string;
  slug: string;
  nameTranslations?: string[];
  overviewTranslations?: string[];
  aliases?: string[];
  country: string;
  primaryCompanyType: number;
  activeDate: string;
  inactiveDate?: string;
  companyType: TvdbCompanyType;
  parentCompany: TvdbParentCompany;
  tagOptions?: string[];
}

interface TvdbType {
  id: number;
  name: string;
  type: string;
  alternateName?: string;
}

interface TvdbArtwork {
  id: number;
  image: string;
  thumbnail: string;
  language: string;
  type: number;
  score: number;
  width: number;
  height: number;
  includesText: boolean;
}

export interface TvdbEpisode {
  id: number;
  seriesId: number;
  name: string;
  aired: string;
  runtime: number;
  nameTranslations: string[];
  overview?: string;
  overviewTranslations: string[];
  image: string;
  imageType: number;
  isMovie: number;
  seasons?: string[];
  number: number;
  absoluteNumber: number;
  seasonNumber: number;
  lastUpdated: string;
  finaleType?: string;
  year: string;
}

export interface TvdbSeasonDetails {
  id: number;
  seriesId: number;
  type: TvdbType;
  number: number;
  nameTranslations: string[];
  overviewTranslations: string[];
  image: string;
  imageType: number;
  companies: {
    studio: TvdbCompany[];
    network: TvdbCompany[];
    production: TvdbCompany[];
    distributor: TvdbCompany[];
    special_effects: TvdbCompany[];
  };
  lastUpdated: string;
  year: string;
  episodes: TvdbEpisode[];
  trailers: string[];
  artwork: TvdbArtwork[];
  tagOptions?: string[];
  firstAired: string;
}

export interface TvdbEpisodeTranslation {
  name: string;
  overview: string;
  language: string;
}
