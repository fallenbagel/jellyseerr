import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import WatchlistFilterSlideover from '@app/components/Discover/WatchlistFilterSlideover';
import type { FilterOptions } from '@app/components/Discover/constants';
import {
  countActiveFilters,
  prepareFilterValues,
} from '@app/components/Discover/constants';
import useDiscover from '@app/hooks/useDiscover';
import { useUpdateQueryParams } from '@app/hooks/useUpdateQueryParams';
import { useUser } from '@app/hooks/useUser';
import ErrorPage from '@app/pages/_error';
import defineMessages from '@app/utils/defineMessages';
import { BarsArrowDownIcon, FunnelIcon } from '@heroicons/react/24/solid';
import { UserType } from '@server/constants/user';
import type { WatchlistItem } from '@server/interfaces/api/discoverInterfaces';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.Discover.DiscoverWatchlist', {
  discoverwatchlist: 'Your Watchlist',
  localwatchlist: 'Watchlist',
  watchlist: 'Plex Watchlist',
  activefilters:
    '{count, plural, one {# Active Filter} other {# Active Filters}}',
  sortAddedNewest: 'Watchlist Added: Newest First',
  sortAddedOldest: 'Watchlist Added: Oldest First',
  sortTitleAsc: 'Title: A-Z',
  sortTitleDesc: 'Title: Z-A',
  sortReleaseNewest: 'Release Date: Newest',
  sortReleaseOldest: 'Release Date: Oldest',
  sortRating: 'TMDB Rating: Highest',
  sortPopularity: 'Popularity: Highest',
});

const SortOptions = {
  AddedNewest: 'watchlistAddedDesc',
  AddedOldest: 'watchlistAddedAsc',
  TitleAsc: 'title.asc',
  TitleDesc: 'title.desc',
  ReleaseNewest: 'releaseDate.desc',
  ReleaseOldest: 'releaseDate.asc',
  Rating: 'voteAverage.desc',
  Popularity: 'popularity.desc',
} as const;

const DiscoverWatchlist = () => {
  const intl = useIntl();
  const router = useRouter();
  const { user } = useUser({
    id: Number(router.query.userId),
  });
  const { user: currentUser } = useUser();
  const targetUser = router.query.userId ? user : currentUser;
  const isLocalWatchlist =
    !!targetUser && targetUser.userType !== UserType.PLEX;
  const [showFilters, setShowFilters] = useState(false);
  const preparedFilters = prepareFilterValues(router.query);
  const updateQueryParams = useUpdateQueryParams({});

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
    mutate,
  } = useDiscover<WatchlistItem, never, FilterOptions>(
    `/api/v1/${
      router.pathname.startsWith('/profile')
        ? `user/${currentUser?.id}`
        : router.query.userId
          ? `user/${router.query.userId}`
          : 'discover'
    }/watchlist`,
    isLocalWatchlist ? preparedFilters : undefined,
    {
      hideAvailable: !isLocalWatchlist,
      hideRequested: !isLocalWatchlist,
      revalidateOnMount: isLocalWatchlist,
    }
  );

  if (error) {
    return <ErrorPage statusCode={500} />;
  }

  const title = intl.formatMessage(
    router.query.userId
      ? isLocalWatchlist
        ? messages.localwatchlist
        : messages.watchlist
      : messages.discoverwatchlist
  );

  return (
    <>
      <PageTitle
        title={[title, router.query.userId ? user?.displayName : '']}
      />
      <div className="mb-4 mt-1 flex flex-col justify-between lg:flex-row lg:items-end">
        <Header
          subtext={
            router.query.userId ? (
              <Link href={`/users/${user?.id}`} className="hover:underline">
                {user?.displayName}
              </Link>
            ) : (
              ''
            )
          }
        >
          {title}
        </Header>
        {isLocalWatchlist && (
          <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
            <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
              <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
                <BarsArrowDownIcon className="h-6 w-6" />
              </span>
              <select
                id="watchlistSortBy"
                name="watchlistSortBy"
                className="rounded-r-only"
                value={preparedFilters.sortBy || SortOptions.AddedNewest}
                onChange={(e) => updateQueryParams('sortBy', e.target.value)}
              >
                <option value={SortOptions.AddedNewest}>
                  {intl.formatMessage(messages.sortAddedNewest)}
                </option>
                <option value={SortOptions.AddedOldest}>
                  {intl.formatMessage(messages.sortAddedOldest)}
                </option>
                <option value={SortOptions.TitleAsc}>
                  {intl.formatMessage(messages.sortTitleAsc)}
                </option>
                <option value={SortOptions.TitleDesc}>
                  {intl.formatMessage(messages.sortTitleDesc)}
                </option>
                <option value={SortOptions.ReleaseNewest}>
                  {intl.formatMessage(messages.sortReleaseNewest)}
                </option>
                <option value={SortOptions.ReleaseOldest}>
                  {intl.formatMessage(messages.sortReleaseOldest)}
                </option>
                <option value={SortOptions.Rating}>
                  {intl.formatMessage(messages.sortRating)}
                </option>
                <option value={SortOptions.Popularity}>
                  {intl.formatMessage(messages.sortPopularity)}
                </option>
              </select>
            </div>
            <WatchlistFilterSlideover
              currentFilters={preparedFilters}
              onClose={() => setShowFilters(false)}
              show={showFilters}
            />
            <div className="mb-2 flex flex-grow sm:mb-0 lg:flex-grow-0">
              <Button onClick={() => setShowFilters(true)} className="w-full">
                <FunnelIcon />
                <span>
                  {intl.formatMessage(messages.activefilters, {
                    count: countActiveFilters(preparedFilters),
                  })}
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
      <ListView
        plexItems={!isLocalWatchlist ? titles : undefined}
        watchlistItems={isLocalWatchlist ? titles : undefined}
        isEmpty={isEmpty}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        isReachingEnd={isReachingEnd}
        onScrollBottom={fetchMore}
        mutateParent={mutate}
      />
    </>
  );
};

export default DiscoverWatchlist;
