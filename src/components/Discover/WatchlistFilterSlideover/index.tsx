import Button from '@app/components/Common/Button';
import MultiRangeSlider from '@app/components/Common/MultiRangeSlider';
import SlideOver from '@app/components/Common/SlideOver';
import type { FilterOptions } from '@app/components/Discover/constants';
import { countActiveFilters } from '@app/components/Discover/constants';
import LanguageSelector from '@app/components/LanguageSelector';
import {
  CompanySelector,
  GenreSelector,
  USCertificationSelector,
  WatchProviderSelector,
} from '@app/components/Selector';
import useSettings from '@app/hooks/useSettings';
import {
  useBatchUpdateQueryParams,
  useUpdateQueryParams,
} from '@app/hooks/useUpdateQueryParams';
import defineMessages from '@app/utils/defineMessages';
import { XCircleIcon } from '@heroicons/react/24/outline';
import Datepicker from '@seerr-team/react-tailwindcss-datepicker';
import { useIntl } from 'react-intl';

const messages = defineMessages(
  'components.Discover.WatchlistFilterSlideover',
  {
    filters: 'Filters',
    activefilters:
      '{count, plural, one {# Active Filter} other {# Active Filters}}',
    mediaType: 'Media Type',
    allMedia: 'All',
    movies: 'Movies',
    series: 'Series',
    search: 'Search',
    searchPlaceholder: 'Search your watchlist…',
    mediaStatus: 'Media Status',
    allStatus: 'All',
    notRequested: 'Not Requested',
    requested: 'Requested',
    available: 'Available',
    partiallyAvailable: 'Partially Available',
    releaseState: 'Release State',
    released: 'Released',
    upcoming: 'Upcoming',
    releaseDate: 'Release Date',
    from: 'From',
    to: 'To',
    studio: 'Studio',
    genres: 'Genres',
    originalLanguage: 'Original Language',
    contentRating: 'Content Rating',
    runtime: 'Runtime',
    runtimeText: '{minValue}-{maxValue} minute runtime',
    tmdbuserscore: 'TMDB User Score',
    ratingText: 'Ratings between {minValue} and {maxValue}',
    tmdbuservotecount: 'TMDB User Vote Count',
    voteCount: 'Number of votes between {minValue} and {maxValue}',
    streamingservices: 'Streaming Services',
    clearfilters: 'Clear Active Filters',
  }
);

type WatchlistFilterSlideoverProps = {
  show: boolean;
  onClose: () => void;
  currentFilters: FilterOptions;
};

const WatchlistFilterSlideover = ({
  show,
  onClose,
  currentFilters,
}: WatchlistFilterSlideoverProps) => {
  const intl = useIntl();
  const { currentSettings } = useSettings();
  const updateQueryParams = useUpdateQueryParams({});
  const batchUpdateQueryParams = useBatchUpdateQueryParams({});
  const selectorType = currentFilters.mediaType === 'tv' ? 'tv' : 'movie';

  const updateFilter = (key: string, value?: string) => {
    updateQueryParams(key, value || undefined);
  };

  return (
    <SlideOver
      show={show}
      title={intl.formatMessage(messages.filters)}
      subText={intl.formatMessage(messages.activefilters, {
        count: countActiveFilters(currentFilters),
      })}
      onClose={onClose}
    >
      <div className="flex flex-col space-y-4">
        <div>
          <div className="mb-2 text-lg font-semibold">
            {intl.formatMessage(messages.mediaType)}
          </div>
          <select
            className="w-full rounded-md"
            value={currentFilters.mediaType ?? 'all'}
            onChange={(e) => updateFilter('mediaType', e.target.value)}
          >
            <option value="all">{intl.formatMessage(messages.allMedia)}</option>
            <option value="movie">{intl.formatMessage(messages.movies)}</option>
            <option value="tv">{intl.formatMessage(messages.series)}</option>
          </select>
        </div>
        <div>
          <div className="mb-2 text-lg font-semibold">
            {intl.formatMessage(messages.search)}
          </div>
          <input
            className="w-full rounded-md"
            type="search"
            value={currentFilters.query ?? ''}
            placeholder={intl.formatMessage(messages.searchPlaceholder)}
            onChange={(e) => updateFilter('query', e.target.value)}
          />
        </div>
        <div>
          <div className="mb-2 text-lg font-semibold">
            {intl.formatMessage(messages.mediaStatus)}
          </div>
          <select
            className="w-full rounded-md"
            value={currentFilters.mediaStatus ?? 'all'}
            onChange={(e) => updateFilter('mediaStatus', e.target.value)}
          >
            <option value="all">
              {intl.formatMessage(messages.allStatus)}
            </option>
            <option value="notrequested">
              {intl.formatMessage(messages.notRequested)}
            </option>
            <option value="requested">
              {intl.formatMessage(messages.requested)}
            </option>
            <option value="available">
              {intl.formatMessage(messages.available)}
            </option>
            <option value="partiallyavailable">
              {intl.formatMessage(messages.partiallyAvailable)}
            </option>
          </select>
        </div>
        <div>
          <div className="mb-2 text-lg font-semibold">
            {intl.formatMessage(messages.releaseState)}
          </div>
          <select
            className="w-full rounded-md"
            value={currentFilters.releaseState ?? 'all'}
            onChange={(e) => updateFilter('releaseState', e.target.value)}
          >
            <option value="all">
              {intl.formatMessage(messages.allStatus)}
            </option>
            <option value="released">
              {intl.formatMessage(messages.released)}
            </option>
            <option value="upcoming">
              {intl.formatMessage(messages.upcoming)}
            </option>
          </select>
        </div>
        <div>
          <div className="mb-2 text-lg font-semibold">
            {intl.formatMessage(messages.releaseDate)}
          </div>
          <div className="relative z-40 flex space-x-2">
            {(['primaryReleaseDateGte', 'primaryReleaseDateLte'] as const).map(
              (key, index) => (
                <div className="flex min-w-0 flex-col" key={key}>
                  <div className="mb-2">
                    {intl.formatMessage(
                      index === 0 ? messages.from : messages.to
                    )}
                  </div>
                  <Datepicker
                    primaryColor="indigo"
                    value={{
                      startDate: currentFilters[key] ?? null,
                      endDate: currentFilters[key] ?? null,
                    }}
                    onChange={(value) =>
                      updateFilter(key, value?.startDate as string | undefined)
                    }
                    inputName={key}
                    useRange={false}
                    asSingle
                    containerClassName="datepicker-wrapper"
                    inputClassName="pr-1 text-base leading-5 sm:pr-4"
                  />
                </div>
              )
            )}
          </div>
        </div>
        <span className="text-lg font-semibold">
          {intl.formatMessage(messages.genres)}
        </span>
        <GenreSelector
          type={selectorType}
          defaultValue={currentFilters.genre}
          isMulti
          onChange={(value) =>
            updateFilter('genre', value?.map((v) => v.value).join(','))
          }
        />
        <span className="text-lg font-semibold">
          {intl.formatMessage(messages.studio)}
        </span>
        <CompanySelector
          defaultValue={currentFilters.studio}
          onChange={(value) => updateFilter('studio', value?.value.toString())}
        />
        <span className="text-lg font-semibold">
          {intl.formatMessage(messages.originalLanguage)}
        </span>
        <LanguageSelector
          value={currentFilters.language}
          serverValue={currentSettings.originalLanguage}
          isUserSettings
          setFieldValue={(_key, value) => updateFilter('language', value)}
        />
        <span className="text-lg font-semibold">
          {intl.formatMessage(messages.contentRating)}
        </span>
        <USCertificationSelector
          type={selectorType}
          certification={currentFilters.certification}
          onChange={(params) => batchUpdateQueryParams(params)}
        />
        <span className="text-lg font-semibold">
          {intl.formatMessage(messages.runtime)}
        </span>
        <MultiRangeSlider
          min={0}
          max={400}
          defaultMaxValue={
            currentFilters.withRuntimeLte
              ? Number(currentFilters.withRuntimeLte)
              : undefined
          }
          defaultMinValue={
            currentFilters.withRuntimeGte
              ? Number(currentFilters.withRuntimeGte)
              : undefined
          }
          onUpdateMin={(min) =>
            updateFilter(
              'withRuntimeGte',
              min !== 0 ? min.toString() : undefined
            )
          }
          onUpdateMax={(max) =>
            updateFilter(
              'withRuntimeLte',
              max !== 400 ? max.toString() : undefined
            )
          }
          subText={intl.formatMessage(messages.runtimeText, {
            minValue: currentFilters.withRuntimeGte ?? 0,
            maxValue: currentFilters.withRuntimeLte ?? 400,
          })}
        />
        <span className="text-lg font-semibold">
          {intl.formatMessage(messages.tmdbuserscore)}
        </span>
        <MultiRangeSlider
          min={1}
          max={10}
          defaultMaxValue={
            currentFilters.voteAverageLte
              ? Number(currentFilters.voteAverageLte)
              : undefined
          }
          defaultMinValue={
            currentFilters.voteAverageGte
              ? Number(currentFilters.voteAverageGte)
              : undefined
          }
          onUpdateMin={(min) =>
            updateFilter(
              'voteAverageGte',
              min !== 1 ? min.toString() : undefined
            )
          }
          onUpdateMax={(max) =>
            updateFilter(
              'voteAverageLte',
              max !== 10 ? max.toString() : undefined
            )
          }
          subText={intl.formatMessage(messages.ratingText, {
            minValue: currentFilters.voteAverageGte ?? 1,
            maxValue: currentFilters.voteAverageLte ?? 10,
          })}
        />
        <span className="text-lg font-semibold">
          {intl.formatMessage(messages.tmdbuservotecount)}
        </span>
        <MultiRangeSlider
          min={0}
          max={1000}
          defaultMaxValue={
            currentFilters.voteCountLte
              ? Number(currentFilters.voteCountLte)
              : undefined
          }
          defaultMinValue={
            currentFilters.voteCountGte
              ? Number(currentFilters.voteCountGte)
              : undefined
          }
          onUpdateMin={(min) =>
            updateFilter('voteCountGte', min ? min.toString() : undefined)
          }
          onUpdateMax={(max) =>
            updateFilter(
              'voteCountLte',
              max !== 1000 ? max.toString() : undefined
            )
          }
          subText={intl.formatMessage(messages.voteCount, {
            minValue: currentFilters.voteCountGte ?? 0,
            maxValue: currentFilters.voteCountLte ?? 1000,
          })}
        />
        <span className="text-lg font-semibold">
          {intl.formatMessage(messages.streamingservices)}
        </span>
        <WatchProviderSelector
          type={selectorType}
          region={currentFilters.watchRegion}
          activeProviders={
            currentFilters.watchProviders?.split('|').map(Number) ?? []
          }
          onChange={(region, providers) =>
            batchUpdateQueryParams(
              providers.length
                ? { watchRegion: region, watchProviders: providers.join('|') }
                : { watchRegion: undefined, watchProviders: undefined }
            )
          }
        />
        <div className="pt-4">
          <Button
            className="w-full"
            disabled={Object.keys(currentFilters).length === 0}
            onClick={() => {
              const copyCurrent = Object.assign({}, currentFilters);
              (
                Object.keys(copyCurrent) as (keyof typeof currentFilters)[]
              ).forEach((key) => {
                copyCurrent[key] = undefined;
              });
              batchUpdateQueryParams(copyCurrent);
              onClose();
            }}
          >
            <XCircleIcon />
            <span>{intl.formatMessage(messages.clearfilters)}</span>
          </Button>
        </div>
      </div>
    </SlideOver>
  );
};

export default WatchlistFilterSlideover;
