import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import SettingsBadge from '@app/components/Settings/SettingsBadge';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownOnSquareIcon, BeakerIcon } from '@heroicons/react/24/outline';
import type { MetadataSettings } from '@server/routes/settings/metadata';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages('components.Settings', {
  general: 'General',
  settings: 'Settings',
  enable: 'Enable',
  enableTip:
    'Enable Tvdb (only for season and episode).' +
    ' Due to a limitation of the api used, only English is available.',
});

const SettingsMetadata = () => {
  const intl = useIntl();
  const [isTesting, setIsTesting] = useState(false);

  const { addToast } = useToasts();

  const testConnection = async () => {
    const response = await fetch('/api/v1/settings/tvdb/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to test Tvdb');
    }
  };

  const saveSettings = async (value: MetadataSettings) => {
    const response = await fetch('/api/v1/settings/tvdb', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tvdb: value.tvdb,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save Tvdb settings');
    }
  };

  const { data, error } = useSWR<MetadataSettings>('/api/v1/settings/tvdb');

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
        <h3 className="heading">{'Metadata'}</h3>
        <p className="description">{'Settings for metadata indexer'}</p>
      </div>
      <div className="section">
        <Formik
          initialValues={{
            enable: data?.tvdb ?? false,
          }}
          onSubmit={async (values) => {
            try {
              setIsTesting(true);
              await testConnection();
              setIsTesting(false);
            } catch (e) {
              addToast('Tvdb connection error, check your credentials', {
                appearance: 'error',
              });
              return;
            }

            try {
              await saveSettings({
                tvdb: values.enable ?? false,
              });
              if (data) {
                data.tvdb = values.enable;
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
                      {intl.formatMessage(messages.enable)}
                    </span>
                    <SettingsBadge badgeType="experimental" />

                    <span className="label-tip">
                      {intl.formatMessage(messages.enableTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      data-testid="tvdb-enable"
                      type="checkbox"
                      id="enable"
                      name="enable"
                      onChange={() => {
                        setFieldValue('enable', !values.enable);
                        addToast('Tvdb connection successful', {
                          appearance: 'success',
                        });
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
