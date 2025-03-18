import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import useDiscover, { encodeURIExtraParams } from '@app/hooks/useDiscover';
import useSettings from '@app/hooks/useSettings';
import globalMessages from '@app/i18n/globalMessages';
import Error from '@app/pages/_error';
import defineMessages from '@app/utils/defineMessages';
import type { TmdbKeyword } from '@server/api/themoviedb/interfaces';
import type { MovieResult } from '@server/models/Search';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.Discover.DiscoverMovieKeyword', {
  keywordMovies: '{keywordTitle} Movies',
});

const DiscoverMovieKeyword = () => {
  const router = useRouter();
  const intl = useIntl();
  const { currentSettings } = useSettings();

  // Redirect to TV keyword page if in TV Only mode
  useEffect(() => {
    if (currentSettings.contentType === 'tv' && router.query.keywords) {
      router.replace(`/discover/tv/keyword?keywords=${router.query.keywords}`);
    }
  }, [currentSettings.contentType, router]);

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
    firstResultData,
  } = useDiscover<MovieResult, { keywords: TmdbKeyword[] }>(
    `/api/v1/discover/movies`,
    {
      keywords: encodeURIExtraParams(router.query.keywords as string),
    }
  );

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = isLoadingInitialData
    ? intl.formatMessage(globalMessages.loading)
    : intl.formatMessage(messages.keywordMovies, {
        keywordTitle: firstResultData?.keywords
          .map((k) => `${k.name[0].toUpperCase()}${k.name.substring(1)}`)
          .join(', '),
      });

  return (
    <>
      <PageTitle title={title} />
      <div className="mt-1 mb-5">
        <Header>{title}</Header>
      </div>
      <ListView
        items={titles}
        isEmpty={isEmpty}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        isReachingEnd={isReachingEnd}
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default DiscoverMovieKeyword;
