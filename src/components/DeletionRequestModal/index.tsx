import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import { useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { MediaType } from '@server/constants/media';
import { Permission } from '@server/lib/permissions';
import type { MovieDetails } from '@server/models/Movie';
import type { TvDetails } from '@server/models/Tv';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages('components.DeletionRequestModal', {
  deletionRequestTitle: 'Request Deletion',
  deletionRequest4kTitle: 'Request 4K Deletion',
  requestDeletion: 'Request Deletion',
  requestDeleting: 'Requesting…',
  requestSuccess: 'Deletion request for <strong>{title}</strong> submitted successfully!',
  requestCancel: 'Cancel',
  requestAutoApprove: 'This deletion request will be approved automatically.',
  pendingApproval: 'Your deletion request is pending approval.',
  reasonLabel: 'Reason (optional)',
  reasonPlaceholder: 'Why should this media be deleted? (e.g., poor quality, wrong version)',
  confirmDeletion: 'Are you sure you want to request deletion of this {mediaType}?',
  deletionWarning: 'This will request deletion from Radarr/Sonarr and remove the media files.',
});

interface DeletionRequestModalProps {
  tmdbId: number;
  type: 'movie' | 'tv';
  is4k?: boolean;
  show: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
}

const DeletionRequestModal = ({
  tmdbId,
  type,
  is4k = false,
  show,
  onComplete,
  onCancel,
}: DeletionRequestModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToasts();
  const { data, error } = useSWR<MovieDetails | TvDetails>(
    show ? `/api/v1/${type}/${tmdbId}` : null,
    {
      revalidateOnMount: true,
    }
  );
  const intl = useIntl();
  const { hasPermission } = useUser();

  const sendDeletionRequest = useCallback(
    async (reason?: string) => {
      if (!data) return;

      setIsSubmitting(true);

      try {
        await axios.post('/api/v1/deletionRequest', {
          mediaId: data.id,
          mediaType: type,
          is4k,
          reason,
        });

        const title = 'title' in data ? data.title : data.name;
        
        addToast(
          intl.formatMessage(messages.requestSuccess, {
            title,
          }),
          {
            appearance: 'success',
            autoDismiss: true,
          }
        );

        if (onComplete) {
          onComplete();
        }
      } catch (e) {
        addToast(intl.formatMessage(globalMessages.toastfailure), {
          appearance: 'error',
          autoDismiss: true,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [data, type, is4k, addToast, intl, onComplete]
  );

  if (!data && !error) {
    return (
      <Modal
        loading
        backgroundClickable
        onCancel={onCancel}
        show={show}
        title={intl.formatMessage(
          is4k ? messages.deletionRequest4kTitle : messages.deletionRequestTitle
        )}
      />
    );
  }

  if (error || !data) {
    return (
      <Modal
        backgroundClickable
        onCancel={onCancel}
        show={show}
        title={intl.formatMessage(
          is4k ? messages.deletionRequest4kTitle : messages.deletionRequestTitle
        )}
      >
        <Alert title="Error" type="error">
          Failed to load media details.
        </Alert>
      </Modal>
    );
  }

  const title = 'title' in data ? data.title : data.name;
  const year = 'release_date' in data 
    ? data.release_date?.slice(0, 4) 
    : data.first_air_date?.slice(0, 4);

  return (
    <Formik
      initialValues={{
        reason: '',
      }}
      onSubmit={async (values) => {
        await sendDeletionRequest(values.reason || undefined);
      }}
    >
      {({ isSubmitting: formSubmitting, values, setFieldValue }) => (
        <Modal
          onCancel={onCancel}
          show={show}
          title={intl.formatMessage(
            is4k ? messages.deletionRequest4kTitle : messages.deletionRequestTitle
          )}
          subTitle={`${title}${year ? ` (${year})` : ''}`}
        >
          <Form>
            <div className="section">
              <Alert
                title={intl.formatMessage(messages.deletionWarning)}
                type="warning"
              >
                {intl.formatMessage(messages.confirmDeletion, {
                  mediaType: type === 'movie' ? 'movie' : 'series',
                })}
              </Alert>

              {hasPermission([Permission.MANAGE_REQUESTS]) && (
                <Alert title={intl.formatMessage(messages.requestAutoApprove)} />
              )}

              <div className="form-row">
                <label htmlFor="reason" className="text-label">
                  {intl.formatMessage(messages.reasonLabel)}
                </label>
                <div className="form-input-area">
                  <Field
                    as="textarea"
                    id="reason"
                    name="reason"
                    rows="3"
                    className="form-input"
                    placeholder={intl.formatMessage(messages.reasonPlaceholder)}
                  />
                </div>
              </div>
            </div>
            <div className="actions">
              <div className="flex justify-end space-x-3">
                <Button
                  buttonType="default"
                  onClick={onCancel}
                  disabled={isSubmitting || formSubmitting}
                >
                  {intl.formatMessage(globalMessages.cancel)}
                </Button>
                <Button
                  buttonType="danger"
                  type="submit"
                  disabled={isSubmitting || formSubmitting}
                >
                  {isSubmitting || formSubmitting
                    ? intl.formatMessage(messages.requestDeleting)
                    : intl.formatMessage(messages.requestDeletion)}
                </Button>
              </div>
            </div>
          </Form>
        </Modal>
      )}
    </Formik>
  );
};

export default DeletionRequestModal;