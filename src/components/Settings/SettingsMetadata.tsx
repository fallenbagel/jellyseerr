import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import MetadataSelector, {
  IndexerType,
} from '@app/components/MetadataSelector';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownOnSquareIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages('components.Settings', {
  general: 'General',
  settings: 'Settings',
  seriesIndexer: 'Series Indexer',
  animeIndexer: 'Anime Indexer',
  metadataSettings: 'Settings for metadata provider',
  clickTest: 'Click on the "Test" button to check connectivity with providers',
  notTested: 'Not Tested',
  failed: 'Does not work',
  operational: 'Operational',
  providerStatus: 'Provider Status',
  chooseProvider: 'Choose metadata providers for different content types',
  indexerSelection: 'Provider Selection',
  tmdbProviderDoesnotWork:
    'TMDB provider does not work, please select another provider',
  tvdbProviderDoesnotWork:
    'TVDB provider does not work, please select another provider',
  allChosenProvidersAreOperational: 'All chosen providers are operational',
});

type ProviderStatus = 'ok' | 'not tested' | 'failed';

interface ProviderResponse {
  tvdb: ProviderStatus;
  tmdb: ProviderStatus;
}

interface MetadataValues {
  tv: IndexerType;
  anime: IndexerType;
}

interface MetadataSettings {
  metadata: MetadataValues;
}

const SettingsMetadata = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const [isTesting, setIsTesting] = useState(false);
  const defaultStatus: ProviderResponse = {
    tmdb: 'not tested',
    tvdb: 'not tested',
  };

  const [providerStatus, setProviderStatus] =
    useState<ProviderResponse>(defaultStatus);

  const { data, error } = useSWR<MetadataSettings>(
    '/api/v1/settings/metadatas'
  );

  const testConnection = async (
    values: MetadataValues
  ): Promise<ProviderResponse> => {
    const useTmdb =
      values.tv === IndexerType.TMDB || values.anime === IndexerType.TMDB;
    const useTvdb =
      values.tv === IndexerType.TVDB || values.anime === IndexerType.TVDB;

    const testData = {
      tmdb: useTmdb,
      tvdb: useTvdb,
    };

    const response = await fetch('/api/v1/settings/metadatas/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      throw new Error('Failed to test connection');
    }

    const body = (await response.json()) as ProviderResponse;

    const newStatus: ProviderResponse = {
      tmdb: useTmdb ? body.tmdb : 'not tested',
      tvdb: useTvdb ? body.tvdb : 'not tested',
    };

    setProviderStatus(newStatus);
    return newStatus;
  };

  const saveSettings = async (
    values: MetadataValues
  ): Promise<MetadataSettings> => {
    const response = await fetch('/api/v1/settings/metadatas', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        anime: values.anime,
        tv: values.tv,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save Metadata settings');
    }

    return (await response.json()) as MetadataSettings;
  };

  const getStatusClass = (status: ProviderStatus): string => {
    switch (status) {
      case 'ok':
        return 'text-green-500';
      case 'not tested':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
    }
  };

  const getStatusMessage = (status: ProviderStatus): string => {
    switch (status) {
      case 'ok':
        return intl.formatMessage(messages.operational);
      case 'not tested':
        return intl.formatMessage(messages.notTested);
      case 'failed':
        return intl.formatMessage(messages.failed);
    }
  };

  const getBadgeType = (
    status: ProviderStatus
  ):
    | 'default'
    | 'primary'
    | 'danger'
    | 'warning'
    | 'success'
    | 'dark'
    | 'light'
    | undefined => {
    switch (status) {
      case 'ok':
        return 'success';
      case 'not tested':
        return 'warning';
      case 'failed':
        return 'danger';
    }
  };

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  const initialValues: MetadataValues = data?.metadata || {
    tv: IndexerType.TMDB,
    anime: IndexerType.TMDB,
  };

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.general),
          intl.formatMessage(globalMessages.settings),
        ]}
      />

      <div className="mb-6">
        <h3 className="heading">Metadata</h3>
        <p className="description">
          {intl.formatMessage(messages.metadataSettings)}
        </p>
      </div>

      <div className="mb-6 rounded-lg bg-gray-800 p-4">
        <h4 className="mb-3 text-lg font-medium">
          {intl.formatMessage(messages.providerStatus)}
        </h4>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center">
            <span className="mr-2 w-12">TMDB:</span>
            <span className={`text-sm ${getStatusClass(providerStatus.tmdb)}`}>
              <Badge badgeType={getBadgeType(providerStatus.tmdb)}>
                {getStatusMessage(providerStatus.tmdb)}
              </Badge>
            </span>
          </div>
          <div className="flex items-center">
            <span className="mr-2 w-12">TVDB:</span>
            <span className={`text-sm ${getStatusClass(providerStatus.tvdb)}`}>
              <Badge badgeType={getBadgeType(providerStatus.tvdb)}>
                {getStatusMessage(providerStatus.tvdb)}
              </Badge>
            </span>
          </div>
        </div>
      </div>

      <div className="section">
        <Formik
          initialValues={{ metadata: initialValues }}
          onSubmit={async (values) => {
            try {
              await saveSettings(values.metadata);

              if (data) {
                data.metadata = values.metadata;
              }

              addToast('Metadata settings saved', { appearance: 'success' });
            } catch (e) {
              addToast('Failed to save metadata settings', {
                appearance: 'error',
              });
            }
          }}
        >
          {({ isSubmitting, isValid, values, setFieldValue }) => {
            return (
              <Form className="section" data-testid="settings-main-form">
                <div className="mb-6">
                  <h2 className="heading">
                    {intl.formatMessage(messages.indexerSelection)}
                  </h2>
                  <p className="description">
                    {intl.formatMessage(messages.chooseProvider)}
                  </p>
                </div>

                <div className="form-row">
                  <label htmlFor="tvIndexer" className="checkbox-label">
                    <span className="mr-2">
                      {intl.formatMessage(messages.seriesIndexer)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <MetadataSelector
                      value={values.metadata.tv}
                      onChange={(value) => setFieldValue('metadata.tv', value)}
                      isDisabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="animeIndexer" className="checkbox-label">
                    <span className="mr-2">
                      {intl.formatMessage(messages.animeIndexer)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <MetadataSelector
                      value={values.metadata.anime}
                      onChange={(value) =>
                        setFieldValue('metadata.anime', value)
                      }
                      isDisabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="actions">
                  <div className="flex justify-end">
                    <span className="ml-3 inline-flex rounded-md shadow-sm">
                      <Button
                        buttonType="warning"
                        type="button"
                        disabled={isSubmitting || !isValid}
                        onClick={async () => {
                          setIsTesting(true);
                          try {
                            const resp = await testConnection(values.metadata);

                            if (resp.tvdb === 'failed') {
                              addToast(
                                intl.formatMessage(
                                  messages.tvdbProviderDoesnotWork
                                ),
                                {
                                  appearance: 'error',
                                  autoDismiss: true,
                                }
                              );
                            } else if (resp.tmdb === 'failed') {
                              addToast(
                                intl.formatMessage(
                                  messages.tmdbProviderDoesnotWork
                                ),
                                {
                                  appearance: 'error',
                                  autoDismiss: true,
                                }
                              );
                            } else {
                              addToast(
                                intl.formatMessage(
                                  messages.allChosenProvidersAreOperational
                                ),
                                {
                                  appearance: 'success',
                                }
                              );
                            }
                          } catch (e) {
                            addToast('Connection test failed', {
                              appearance: 'error',
                              autoDismiss: true,
                            });
                          } finally {
                            setIsTesting(false);
                          }
                        }}
                      >
                        <BeakerIcon />
                        <span>
                          {isTesting
                            ? intl.formatMessage(globalMessages.testing)
                            : intl.formatMessage(globalMessages.test)}
                        </span>
                      </Button>
                    </span>

                    <span className="ml-3 inline-flex rounded-md shadow-sm">
                      <Button
                        data-testid="metadata-save-button"
                        buttonType="primary"
                        type="submit"
                        disabled={isSubmitting || !isValid || isTesting}
                      >
                        <ArrowDownOnSquareIcon />
                        <span>
                          {isSubmitting
                            ? intl.formatMessage(globalMessages.saving)
                            : intl.formatMessage(globalMessages.save)}
                        </span>
                      </Button>
                    </span>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </>
  );
};

export default SettingsMetadata;
