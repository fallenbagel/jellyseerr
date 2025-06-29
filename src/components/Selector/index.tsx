import CachedImage from '@app/components/Common/CachedImage';
import { SmallLoadingSpinner } from '@app/components/Common/LoadingSpinner';
import Tooltip from '@app/components/Common/Tooltip';
import RegionSelector from '@app/components/RegionSelector';
import { encodeURIExtraParams } from '@app/hooks/useDiscover';
import useSettings from '@app/hooks/useSettings';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type {
  TmdbCompanySearchResponse,
  TmdbGenre,
  TmdbKeywordSearchResponse,
} from '@server/api/themoviedb/interfaces';
import type { GenreSliderItem } from '@server/interfaces/api/discoverInterfaces';
import type { UserResultsResponse } from '@server/interfaces/api/userInterfaces';
import type {
  Keyword,
  ProductionCompany,
  WatchProviderDetails,
} from '@server/models/common';
import { orderBy } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import type { MultiValue, SingleValue } from 'react-select';
import AsyncSelect from 'react-select/async';
import useSWR from 'swr';

const messages = defineMessages('components.Selector', {
  searchKeywords: 'Search keywords…',
  searchGenres: 'Select genres…',
  searchStudios: 'Search studios…',
  searchUsers: 'Select users…',
  starttyping: 'Starting typing to search.',
  nooptions: 'No results.',
  showmore: 'Show More',
  showless: 'Show Less',
  searchStatus: 'Select status...',
  returningSeries: 'Returning Series',
  planned: 'Planned',
  inProduction: 'In Production',
  ended: 'Ended',
  canceled: 'Canceled',
  pilot: 'Pilot',
});

type SingleVal = {
  label: string;
  value: number;
};

type BaseSelectorMultiProps = {
  defaultValue?: string;
  isMulti: true;
  onChange: (value: MultiValue<SingleVal> | null) => void;
};

type BaseSelectorSingleProps = {
  defaultValue?: string;
  isMulti?: false;
  onChange: (value: SingleValue<SingleVal> | null) => void;
};

export const CompanySelector = ({
  defaultValue,
  isMulti,
  onChange,
}: BaseSelectorSingleProps | BaseSelectorMultiProps) => {
  const intl = useIntl();
  const [defaultDataValue, setDefaultDataValue] = useState<
    { label: string; value: number }[] | null
  >(null);

  useEffect(() => {
    const loadDefaultCompany = async (): Promise<void> => {
      if (!defaultValue) {
        return;
      }

      const res = await fetch(`/api/v1/studio/${defaultValue}`);
      if (!res.ok) throw new Error();
      const studio: ProductionCompany = await res.json();

      setDefaultDataValue([
        {
          label: studio.name ?? '',
          value: studio.id ?? 0,
        },
      ]);
    };

    loadDefaultCompany();
  }, [defaultValue]);

  const loadCompanyOptions = async (inputValue: string) => {
    if (inputValue === '') {
      return [];
    }

    const res = await fetch(
      `/api/v1/search/company?query=${encodeURIExtraParams(inputValue)}`
    );
    if (!res.ok) {
      throw new Error('Network response was not ok');
    }
    const results: TmdbCompanySearchResponse = await res.json();

    return results.results.map((result) => ({
      label: result.name,
      value: result.id,
    }));
  };

  return (
    <AsyncSelect
      key={`company-selector-${defaultDataValue}`}
      className="react-select-container"
      classNamePrefix="react-select"
      isMulti={isMulti}
      defaultValue={defaultDataValue}
      defaultOptions
      cacheOptions
      isClearable
      noOptionsMessage={({ inputValue }) =>
        inputValue === ''
          ? intl.formatMessage(messages.starttyping)
          : intl.formatMessage(messages.nooptions)
      }
      loadOptions={loadCompanyOptions}
      placeholder={intl.formatMessage(messages.searchStudios)}
      onChange={(value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange(value as any);
      }}
    />
  );
};

type GenreSelectorProps = (BaseSelectorMultiProps | BaseSelectorSingleProps) & {
  type: 'movie' | 'tv';
};

export const GenreSelector = ({
  isMulti,
  defaultValue,
  onChange,
  type,
}: GenreSelectorProps) => {
  const intl = useIntl();
  const [defaultDataValue, setDefaultDataValue] = useState<
    { label: string; value: number }[] | null
  >(null);

  useEffect(() => {
    const loadDefaultGenre = async (): Promise<void> => {
      if (!defaultValue) {
        return;
      }

      const genres = defaultValue.split(',');

      const res = await fetch(`/api/v1/genres/${type}`);
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      const response: TmdbGenre[] = await res.json();

      const genreData = genres
        .filter((genre) => response.find((gd) => gd.id === Number(genre)))
        .map((g) => response.find((gd) => gd.id === Number(g)))
        .map((g) => ({
          label: g?.name ?? '',
          value: g?.id ?? 0,
        }));

      setDefaultDataValue(genreData);
    };

    loadDefaultGenre();
  }, [defaultValue, type]);

  const loadGenreOptions = async (inputValue: string) => {
    const res = await fetch(`/api/v1/discover/genreslider/${type}`);
    if (!res.ok) throw new Error();
    const results: GenreSliderItem[] = await res.json();

    return results
      .map((result) => ({
        label: result.name,
        value: result.id,
      }))
      .filter(({ label }) =>
        label.toLowerCase().includes(inputValue.toLowerCase())
      );
  };

  return (
    <AsyncSelect
      key={`genre-select-${defaultDataValue}`}
      className="react-select-container"
      classNamePrefix="react-select"
      defaultValue={isMulti ? defaultDataValue : defaultDataValue?.[0]}
      defaultOptions
      cacheOptions
      isMulti={isMulti}
      loadOptions={loadGenreOptions}
      placeholder={intl.formatMessage(messages.searchGenres)}
      onChange={(value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange(value as any);
      }}
    />
  );
};

export const StatusSelector = ({
  isMulti,
  defaultValue,
  onChange,
}: BaseSelectorMultiProps | BaseSelectorSingleProps) => {
  const intl = useIntl();
  const [defaultDataValue, setDefaultDataValue] = useState<
    { label: string; value: number }[] | null
  >(null);

  const options = useMemo(
    () => [
      { name: intl.formatMessage(messages.returningSeries), id: 0 },
      { name: intl.formatMessage(messages.planned), id: 1 },
      { name: intl.formatMessage(messages.inProduction), id: 2 },
      { name: intl.formatMessage(messages.ended), id: 3 },
      { name: intl.formatMessage(messages.canceled), id: 4 },
      { name: intl.formatMessage(messages.pilot), id: 5 },
    ],
    [intl]
  );

  useEffect(() => {
    const loadDefaultStatus = async (): Promise<void> => {
      if (!defaultValue) {
        return;
      }
      const statuses = defaultValue.split('|');

      const statusData = options
        .filter((opt) => statuses.find((s) => Number(s) === opt.id))
        .map((o) => ({
          label: o.name,
          value: o.id,
        }));

      setDefaultDataValue(statusData);
    };

    loadDefaultStatus();
  }, [defaultValue, options]);

  const loadStatusOptions = async () => {
    return options
      .map((result) => ({
        label: result.name,
        value: result.id,
      }))
      .filter(({ label }) => label.toLowerCase());
  };

  return (
    <AsyncSelect
      key={`status-select-${defaultDataValue}`}
      className="react-select-container"
      classNamePrefix="react-select"
      defaultValue={isMulti ? defaultDataValue : defaultDataValue?.[0]}
      defaultOptions
      isMulti={isMulti}
      loadOptions={loadStatusOptions}
      placeholder={intl.formatMessage(messages.searchStatus)}
      onChange={(value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange(value as any);
      }}
    />
  );
};

export const KeywordSelector = ({
  isMulti,
  defaultValue,
  onChange,
}: BaseSelectorMultiProps | BaseSelectorSingleProps) => {
  const intl = useIntl();
  const [defaultDataValue, setDefaultDataValue] = useState<
    { label: string; value: number }[] | null
  >(null);

  useEffect(() => {
    const loadDefaultKeywords = async (): Promise<void> => {
      if (!defaultValue) {
        return;
      }

      const keywords = await Promise.all(
        defaultValue.split(',').map(async (keywordId) => {
          const res = await fetch(`/api/v1/keyword/${keywordId}`);
          if (!res.ok) {
            throw new Error('Network response was not ok');
          }
          const keyword: Keyword = await res.json();

          return keyword;
        })
      );

      setDefaultDataValue(
        keywords.map((keyword) => ({
          label: keyword.name,
          value: keyword.id,
        }))
      );
    };

    loadDefaultKeywords();
  }, [defaultValue]);

  const loadKeywordOptions = async (inputValue: string) => {
    const res = await fetch(
      `/api/v1/search/keyword?query=${encodeURIExtraParams(inputValue)}`
    );
    if (!res.ok) {
      throw new Error('Network response was not ok');
    }
    const results: TmdbKeywordSearchResponse = await res.json();

    return results.results.map((result) => ({
      label: result.name,
      value: result.id,
    }));
  };

  return (
    <AsyncSelect
      key={`keyword-select-${defaultDataValue}`}
      inputId="data"
      isMulti={isMulti}
      className="react-select-container"
      classNamePrefix="react-select"
      noOptionsMessage={({ inputValue }) =>
        inputValue === ''
          ? intl.formatMessage(messages.starttyping)
          : intl.formatMessage(messages.nooptions)
      }
      defaultValue={defaultDataValue}
      loadOptions={loadKeywordOptions}
      placeholder={intl.formatMessage(messages.searchKeywords)}
      onChange={(value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange(value as any);
      }}
    />
  );
};

type WatchProviderSelectorProps = {
  type: 'movie' | 'tv';
  region?: string;
  activeProviders?: number[];
  onChange: (region: string, value: number[]) => void;
};

export const WatchProviderSelector = ({
  type,
  onChange,
  region,
  activeProviders,
}: WatchProviderSelectorProps) => {
  const intl = useIntl();
  const { currentSettings } = useSettings();
  const [showMore, setShowMore] = useState(false);
  const [watchRegion, setWatchRegion] = useState(
    region
      ? region
      : currentSettings.discoverRegion
      ? currentSettings.discoverRegion
      : 'US'
  );
  const [activeProvider, setActiveProvider] = useState<number[]>(
    activeProviders ?? []
  );
  const { data, isLoading } = useSWR<WatchProviderDetails[]>(
    `/api/v1/watchproviders/${
      type === 'movie' ? 'movies' : 'tv'
    }?watchRegion=${watchRegion}`
  );

  useEffect(() => {
    onChange(watchRegion, activeProvider);
    // removed onChange as a dependency as we only need to call it when the value(s) change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProvider, watchRegion]);

  const orderedData = useMemo(() => {
    if (!data) {
      return [];
    }

    return orderBy(data, ['display_priority'], ['asc']);
  }, [data]);

  const toggleProvider = (id: number) => {
    if (activeProvider.includes(id)) {
      setActiveProvider(activeProvider.filter((p) => p !== id));
    } else {
      setActiveProvider([...activeProvider, id]);
    }
  };

  const initialProviders = orderedData.slice(0, 24);
  const otherProviders = orderedData.slice(24);

  return (
    <>
      <RegionSelector
        value={watchRegion}
        name="watchRegion"
        onChange={(_name, value) => {
          if (value !== watchRegion) {
            setActiveProvider([]);
          }
          setWatchRegion(value);
        }}
        disableAll
        watchProviders
      />
      {isLoading ? (
        <SmallLoadingSpinner />
      ) : (
        <div className="grid">
          <div className="provider-icons grid gap-2">
            {initialProviders.map((provider) => {
              const isActive = activeProvider.includes(provider.id);
              return (
                <Tooltip
                  content={provider.name}
                  key={`prodiver-${provider.id}`}
                >
                  <div
                    className={`provider-container w-full cursor-pointer rounded-lg ring-1 ${
                      isActive
                        ? 'bg-gray-600 ring-indigo-500 hover:bg-gray-500'
                        : 'bg-gray-700 ring-gray-500 hover:bg-gray-600'
                    }`}
                    onClick={() => toggleProvider(provider.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        toggleProvider(provider.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="relative m-2 aspect-1">
                      <CachedImage
                        type="tmdb"
                        src={`https://image.tmdb.org/t/p/original${provider.logoPath}`}
                        alt=""
                        fill
                        className="rounded-lg object-contain"
                      />
                    </div>
                    {isActive && (
                      <div className="pointer-events-none absolute -top-1 -left-1 flex items-center justify-center text-indigo-100 opacity-90">
                        <CheckCircleIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </Tooltip>
              );
            })}
          </div>
          {showMore && otherProviders.length > 0 && (
            <div className="provider-icons relative top-2 grid gap-2">
              {otherProviders.map((provider) => {
                const isActive = activeProvider.includes(provider.id);
                return (
                  <Tooltip
                    content={provider.name}
                    key={`prodiver-${provider.id}`}
                  >
                    <div
                      className={`provider-container w-full cursor-pointer rounded-lg ring-1 transition ${
                        isActive
                          ? 'bg-gray-600 ring-indigo-500 hover:bg-gray-500'
                          : 'bg-gray-700 ring-gray-500 hover:bg-gray-600'
                      }`}
                      onClick={() => toggleProvider(provider.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          toggleProvider(provider.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="relative m-2 aspect-1">
                        <CachedImage
                          type="tmdb"
                          src={`https://image.tmdb.org/t/p/original${provider.logoPath}`}
                          alt=""
                          fill
                          className="rounded-lg object-contain"
                        />
                      </div>
                      {isActive && (
                        <div className="pointer-events-none absolute -top-1 -left-1 flex items-center justify-center text-indigo-100 opacity-90">
                          <CheckCircleIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          )}
          {otherProviders.length > 0 && (
            <button
              className="relative top-4 flex items-center justify-center space-x-2 text-sm text-gray-400 transition hover:text-gray-200"
              type="button"
              onClick={() => setShowMore(!showMore)}
            >
              <div className="h-0.5 flex-1 bg-gray-600" />
              {showMore ? (
                <>
                  <ArrowUpIcon className="h-4 w-4" />
                  <span>{intl.formatMessage(messages.showless)}</span>
                  <ArrowUpIcon className="h-4 w-4" />
                </>
              ) : (
                <>
                  <ArrowDownIcon className="h-4 w-4" />
                  <span>{intl.formatMessage(messages.showmore)}</span>
                  <ArrowDownIcon className="h-4 w-4" />
                </>
              )}
              <div className="h-0.5 flex-1 bg-gray-600" />
            </button>
          )}
        </div>
      )}
    </>
  );
};

export const UserSelector = ({
  isMulti,
  defaultValue,
  onChange,
}: BaseSelectorMultiProps | BaseSelectorSingleProps) => {
  const intl = useIntl();
  const [defaultDataValue, setDefaultDataValue] = useState<
    { label: string; value: number }[] | null
  >(null);

  useEffect(() => {
    const loadUsers = async (): Promise<void> => {
      if (!defaultValue) {
        return;
      }

      const users = defaultValue.split(',');

      const res = await fetch(`/api/v1/user`);
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      const response: UserResultsResponse = await res.json();

      const genreData = users
        .filter((u) => response.results.find((user) => user.id === Number(u)))
        .map((u) => response.results.find((user) => user.id === Number(u)))
        .map((u) => ({
          label: u?.displayName ?? '',
          value: u?.id ?? 0,
        }));

      setDefaultDataValue(genreData);
    };

    loadUsers();
  }, [defaultValue]);

  const loadUserOptions = async (inputValue: string) => {
    const res = await fetch(
      `/api/v1/user${inputValue ? `?q=${encodeURIComponent(inputValue)}` : ''}`
    );
    if (!res.ok) throw new Error();
    const results: UserResultsResponse = await res.json();

    return results.results
      .map((result) => ({
        label: result.displayName,
        value: result.id,
      }))
      .filter(({ label }) =>
        label.toLowerCase().includes(inputValue.toLowerCase())
      );
  };

  return (
    <AsyncSelect
      key={`user-select-${defaultDataValue}`}
      className="react-select-container"
      classNamePrefix="react-select"
      defaultValue={isMulti ? defaultDataValue : defaultDataValue?.[0]}
      defaultOptions
      cacheOptions
      isMulti={isMulti}
      loadOptions={loadUserOptions}
      placeholder={intl.formatMessage(messages.searchUsers)}
      onChange={(value) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange(value as any);
      }}
    />
  );
};

export const ApprovalSpecificationSelector = ({
  defaultValue,
  onChange,
}: BaseSelectorSingleProps) => {
  const loadApprovalSpecOptions = () => {
    return [
      { label: 'Genre', value: 'genre' },
      { label: 'Release Year', value: 'release-year' },
      { label: 'User', value: 'user' },
    ];
  };

  return (
    <AsyncSelect
      key={`user-select-${defaultValue}`}
      className="react-select-container"
      classNamePrefix="react-select"
      defaultValue={defaultValue}
      defaultOptions
      cacheOptions
      isMulti={false}
      loadOptions={loadApprovalSpecOptions}
      onChange={(value) => {
        onChange(value as any);
      }}
    />
  );
};
