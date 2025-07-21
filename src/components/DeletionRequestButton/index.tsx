import Button from '@app/components/Common/Button';
import DeletionRequestModal from '@app/components/DeletionRequestModal';
import { Permission, useUser } from '@app/hooks/useUser';
import defineMessages from '@app/utils/defineMessages';
import { TrashIcon } from '@heroicons/react/24/solid';
import { MediaStatus } from '@server/constants/media';
import type Media from '@server/entity/Media';
import { useState } from 'react';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.DeletionRequestButton', {
  requestDeletion: 'Request Deletion',
  requestDeletion4k: 'Request 4K Deletion',
});

interface DeletionRequestButtonProps {
  mediaType: 'movie' | 'tv';
  onUpdate: () => void;
  tmdbId: number;
  media?: Media;
  is4k?: boolean;
}

const DeletionRequestButton = ({
  tmdbId,
  onUpdate,
  media,
  mediaType,
  is4k = false,
}: DeletionRequestButtonProps) => {
  const intl = useIntl();
  const { hasPermission } = useUser();
  const [showModal, setShowModal] = useState(false);

  // Check if user has permission to request deletions
  if (!hasPermission(Permission.REQUEST_DELETE)) {
    return null;
  }

  // Only show deletion button if media is available
  const mediaStatus = is4k ? media?.status4k : media?.status;
  if (mediaStatus !== MediaStatus.AVAILABLE) {
    return null;
  }

  return (
    <>
      <Button
        buttonType="danger"
        onClick={() => setShowModal(true)}
        className="ml-2 first:ml-0"
      >
        <TrashIcon />
        <span>
          {intl.formatMessage(
            is4k ? messages.requestDeletion4k : messages.requestDeletion
          )}
        </span>
      </Button>
      <DeletionRequestModal
        tmdbId={tmdbId}
        show={showModal}
        type={mediaType}
        onComplete={() => {
          onUpdate();
          setShowModal(false);
        }}
        onCancel={() => setShowModal(false)}
        is4k={is4k}
      />
    </>
  );
};

export default DeletionRequestButton;