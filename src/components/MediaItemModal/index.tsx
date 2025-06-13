import Modal from '@app/components/Common/Modal';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { Transition } from '@headlessui/react';
import type { RadarrMovie } from '@server/api/servarr/radarr';
import type { EpisodeResult } from '@server/api/servarr/sonarr';
import {
  CalendarMediaItemType,
  type CalendarMediaItem,
} from '@server/lib/calendar';
import type { MovieDetails } from '@server/models/Movie';
import type { TvDetails } from '@server/models/Tv';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

interface MediaItemModalProps {
  show: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
  isUpdating?: boolean;
  mediaItem: CalendarMediaItem | undefined;
}

const messages = defineMessages('component.MediaModal', {
  blacklisting: 'Blacklisting',
});

const MediaItemModal = ({
  show,
  onComplete,
  onCancel,
  isUpdating,
  mediaItem,
}: MediaItemModalProps) => {
  if (mediaItem?.type == CalendarMediaItemType.TvShow) {
    return TvShowItemModal(
      mediaItem?.tvShowResource,
      show,
      onComplete,
      onCancel,
      isUpdating
    );
  } else if (
    mediaItem?.type == CalendarMediaItemType.Movie &&
    mediaItem?.movieResource != null
  ) {
    return MovieItemModal(
      mediaItem.movieResource,
      show,
      onComplete,
      onCancel,
      isUpdating
    );
  } else {
    return;
  }
};

const TvShowItemModal = (
  tvShow: EpisodeResult | undefined,
  show: boolean,
  onComplete?: () => void,
  onCancel?: () => void,
  isUpdating?: boolean
) => {
  const intl = useIntl();
  const [data, setData] = useState<TvDetails | MovieDetails | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!show) return;
      try {
        const response = await axios.get(`/api/v1/tv/${tvShow?.series.tmdbId}`);
        setData(response.data);
      } catch (err) {
        console.error('error retrieving show artwork', err);
      }
    })();
  }, [show]);

  if (tvShow == null) {
    console.error('Tv show within modal is null');
    return <div />;
  }

  function clickOpenMedia() {
    router.push(`/tv/${tvShow?.series.tmdbId}`);
  }

  const episodeString = (
    <div>
      S{String(tvShow.seasonNumber).padStart(2, '0')}E
      {String(tvShow.episodeNumber).padStart(2, '0')}
      {}
    </div>
  );

  const timeStart = tvShow.airDateUtc;
  const dateStart = new Date(timeStart!);
  const dateEnd = new Date(dateStart.getTime() + tvShow.runtime * 60000);

  return (
    <Transition
      as="div"
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={show}
    >
      <Modal
        loading={false}
        backgroundClickable
        title={tvShow.series.title}
        subTitle={tvShow.title}
        cancelText="Close"
        onCancel={onCancel}
        onOk={onComplete}
        okText={
          isUpdating
            ? intl.formatMessage(messages.blacklisting)
            : intl.formatMessage(globalMessages.blacklist)
        }
        okButtonType="danger"
        okDisabled={isUpdating}
        tertiaryText={'Open Series'}
        tertiaryButtonType="success"
        onTertiary={clickOpenMedia}
        backdrop={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data?.backdropPath}`}
      >
        {
          <div>
            {episodeString}
            <div>
              {dateStart.toLocaleTimeString([], { timeStyle: 'short' })} -{' '}
              {dateEnd?.toLocaleTimeString([], { timeStyle: 'short' })}
            </div>
            <div>{tvShow.overview}</div>
          </div>
        }
      </Modal>
    </Transition>
  );
};

const MovieItemModal = (
  movie: RadarrMovie,
  show: boolean,
  onComplete?: () => void,
  onCancel?: () => void,
  isUpdating?: boolean
) => {
  const intl = useIntl();
  const [data, setData] = useState<TvDetails | MovieDetails | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!show) return;
      try {
        const response = await axios.get(`/api/v1/movie/${movie.tmdbId}`);
        setData(response.data);
      } catch (err) {
        console.error('error retrieving movie artwork', err);
      }
    })();
  }, [show]);

  function clickOpenMedia() {
    router.push(`/movie/${movie.tmdbId}`);
  }

  const releaseString = new Date(movie.releaseDate).toLocaleDateString([], {
    dateStyle: 'medium',
  });

  return (
    <Transition
      as="div"
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={show}
    >
      <Modal
        loading={false}
        backgroundClickable
        title={`${movie?.title}`}
        cancelText="Close"
        onCancel={onCancel}
        onOk={onComplete}
        okText={
          isUpdating
            ? intl.formatMessage(messages.blacklisting)
            : intl.formatMessage(globalMessages.blacklist)
        }
        okButtonType="danger"
        okDisabled={isUpdating}
        tertiaryText={'Open Movie'}
        tertiaryButtonType="success"
        onTertiary={clickOpenMedia}
        backdrop={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data?.backdropPath}`}
      >
        {
          <div>
            <div>{releaseString}</div>
            <div>{movie?.overview}</div>
          </div>
        }
      </Modal>
    </Transition>
  );
};

export default MediaItemModal;
