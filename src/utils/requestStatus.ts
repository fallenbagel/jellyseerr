import { MediaStatus } from '@server/constants/media';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { NonFunctionProperties } from '@server/interfaces/api/common';

// Resolves the availability status to show for a request. Movie requests use the
// media status directly. TV requests are scoped to the specific seasons that were
// requested, so their status is derived from just those seasons rather than the
// whole show: fully available only when every requested season is available, and
// partially available when at least one requested season is available.
export const getRequestedSeasonsStatus = (
  requestData: NonFunctionProperties<MediaRequest>
): MediaStatus | undefined => {
  const statusKey = requestData.is4k ? 'status4k' : 'status';

  if (requestData.type !== 'tv' || !requestData.seasons.length) {
    return requestData.media[statusKey];
  }

  const requestedSeasonNumbers = new Set(
    requestData.seasons.map((season) => season.seasonNumber)
  );
  const requestedSeasonStatuses = (requestData.media.seasons ?? [])
    .filter((season) => requestedSeasonNumbers.has(season.seasonNumber))
    .map((season) => season[statusKey]);

  // Fall back to the media status when the requested seasons aren't loaded yet
  // (e.g. the request-list payload before the per-request fetch resolves).
  if (!requestedSeasonStatuses.length) {
    return requestData.media[statusKey];
  }

  if (
    requestedSeasonStatuses.every((status) => status === MediaStatus.AVAILABLE)
  ) {
    return MediaStatus.AVAILABLE;
  }

  if (
    requestedSeasonStatuses.some(
      (status) =>
        status === MediaStatus.AVAILABLE ||
        status === MediaStatus.PARTIALLY_AVAILABLE
    )
  ) {
    return MediaStatus.PARTIALLY_AVAILABLE;
  }

  return Math.min(...requestedSeasonStatuses) as MediaStatus;
};

export default getRequestedSeasonsStatus;
