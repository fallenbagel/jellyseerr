import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import SettingsBadge from '@app/components/Settings/SettingsBadge';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownOnSquareIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages('components.Settings', {
  general: 'General',
  settings: 'Settings',
  apiKey: 'Api Key',
  pin: 'Pin',
  enableTip:
    'Enable Tvdb (only for season and episode).' +
    ' Due to a limitation of the api used, only English is available.',
});

interface providerResponse {
  tvdb: boolean;
  tmdb: boolean;
}

enum indexerType {
  TMDB,
  TVDB,
}

interface metadataSettings {
  settings: metadataTypeSettings;
  providers: providerSettings;
}

interface metadataTypeSettings {
  tv: indexerType;
  anime: indexerType;
}

interface providerSettings {
  tvdb: tvdbSettings;
}

interface tvdbSettings {
  apiKey: string;
  pin: string;
}

const SettingsMetadata = () => {
  const intl = useIntl();
  const [isTesting, setIsTesting] = useState(false);

  const { addToast } = useToasts();

  const testConnection = async () => {
    const response = await fetch('/api/v1/settings/metadats/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const body = (await response.json()) as providerResponse;

    if (!response.ok) {
      console.log(body);
    }
  };

  const saveSettings = async (
    value: metadataSettings
  ): Promise<metadataSettings> => {
    const response = await fetch('/api/v1/settings/metadatas', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      throw new Error('Failed to save Metadata settings');
    }

    return (await response.json()) as metadataSettings;
  };

  const { data, error } = useSWR<metadataSettings>(
    '/api/v1/settings/metadatas'
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.general),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-6">
        me
        <h3 className="heading">{'Metadata'}</h3>
        <p className="description">{'Settings for metadata indexer'}</p>
      </div>
      <div className="section">
        <Formik
          initialValues={{
            settings: data?.settings ?? {
              tv: indexerType.TMDB,
              anime: indexerType.TMDB,
            },
            providers: data?.providers ?? {
              tvdb: {
                apiKey: '',
                pin: '',
              },
            },
          }}
          onSubmit={async (values) => {
            try {
              await saveSettings(
                data ?? {
                  providers: {
                    tvdb: {
                      apiKey: '',
                      pin: '',
                    },
                  },
                  settings: {
                    tv: indexerType.TMDB,
                    anime: indexerType.TMDB,
                  },
                }
              );
              if (data) {
                data.providers = values.providers;
                data.settings = values.settings;
              }
            } catch (e) {
              addToast('Failed to save Tvdb settings', { appearance: 'error' });
              return;
            }
            addToast('Tvdb settings saved', { appearance: 'success' });
          }}
        >
          {({ isSubmitting, isValid, values, setFieldValue }) => {
            return (
              <Form className="section" data-testid="settings-main-form">
                <div className="form-row">
                  <label htmlFor="trustProxy" className="checkbox-label">
                    <span className="mr-2">
                      {intl.formatMessage(messages.apiKey)}
                    </span>
                    <SettingsBadge badgeType="experimental" />

                    <span className="label-tip">
                      {intl.formatMessage(messages.enableTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      data-testid="tvdb-apiKey"
                      type="text"
                      id="apiKey"
                      name="apiKey"
                      onChange={() => {
                        setFieldValue('apiKey', values.providers.tvdb.apiKey);
                        addToast('Tvdb connection successful', {
                          appearance: 'success',
                        });
                      }}
                    />
                    <Field
                      data-testid="tvdb-pin"
                      type="text"
                      id="pin"
                      name="pin"
                      onChange={() => {
                        setFieldValue('pin', values.providers.tvdb.pin);
                      }}
                    />
                  </div>
                  <div className="error"></div>
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
                            await testConnection();
                            addToast('Tvdb connection successful', {
                              appearance: 'success',
                            });
                          } catch (e) {
                            addToast(
                              'Tvdb connection error, check your credentials',
                              { appearance: 'error' }
                            );
                          }
                          setIsTesting(false);
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
                        data-testid="tvbd-save-button"
                        buttonType="primary"
                        type="submit"
                        disabled={isSubmitting || !isValid}
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
