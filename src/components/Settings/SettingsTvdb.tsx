import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import CopyButton from '@app/components/Settings/CopyButton';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownOnSquareIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import type { TvdbSettings } from '@server/lib/settings';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages('components.Settings', {
  general: 'General',
  settings: 'Settings',
  apikey: 'API Key',
  pin: 'PIN',
  enable: 'Enable',
  enableTip: 'Enable Tvdb (only for season and episode)',
});

/*interface SettingsTvdbProps {
  onEdit: () => void;
}*/

const SettingsTvdb = () => {
  const intl = useIntl();
  const [isTesting, setIsTesting] = useState(false);

  const { addToast } = useToasts();

  const testConnection = async (apiKey: string | undefined, pin?: string) => {
    const response = await fetch('/api/v1/settings/tvdb/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey, pin }),
    });

    if (!response.ok) {
      throw new Error('Failed to test Tvdb');
    }
  };

  const saveSettings = async (values: TvdbSettings) => {
    const response = await fetch('/api/v1/settings/tvdb', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      throw new Error('Failed to save Tvdb settings');
    }
  };

  const { data, error } = useSWR<TvdbSettings>('/api/v1/settings/tvdb');

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
        <h3 className="heading">{'Tvdb'}</h3>
        <p className="description">{'Settings for Tvdb'}</p>
      </div>
      <div className="section">
        <Formik
          initialValues={{
            apiKey: data?.apiKey,
            pin: data?.pin,
            enable: data?.use,
          }}
          onSubmit={async (values) => {
            if (values.enable && values.apiKey === '') {
              addToast('Please enter an API key', { appearance: 'error' });
              return;
            }

            try {
              setIsTesting(true);
              await testConnection(values.apiKey, values.pin);
              setIsTesting(false);
            } catch (e) {
              addToast('Tvdb connection error, check your credentials', {
                appearance: 'error',
              });
              return;
            }

            try {
              await saveSettings({
                apiKey: values.apiKey,
                pin: values.pin,
                use: values.enable || false,
              });
            } catch (e) {
              addToast('Failed to save Tvdb settings', { appearance: 'error' });
              return;
            }
            addToast('Tvdb settings saved', { appearance: 'success' });
          }}
        >
          {({
            errors,
            touched,
            isSubmitting,
            isValid,
            values,
            setFieldValue,
          }) => {
            return (
              <Form className="section" data-testid="settings-main-form">
                <div className="form-row">
                  <label htmlFor="apiKey" className="text-label">
                    {intl.formatMessage(messages.apikey)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <SensitiveInput
                        type="text"
                        id="apiKey"
                        className="rounded-l-only"
                        value={values.apiKey}
                        onChange={(e) => {
                          setFieldValue('apiKey', e.target.value);
                        }}
                      />
                      <CopyButton
                        textToCopy={values.apiKey ?? ''}
                        key={'apikey'}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                        className="input-action"
                      >
                        <ArrowPathIcon />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="pin" className="text-label">
                    {intl.formatMessage(messages.pin)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <SensitiveInput
                        type="text"
                        id="pin"
                        className="rounded-l-only"
                        value={values.pin}
                        onChange={(e) => {
                          values.pin = e.target.value;
                        }}
                      />
                      <CopyButton textToCopy={values.pin ?? ''} key={'pin'} />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                        className="input-action"
                      >
                        <ArrowPathIcon />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="trustProxy" className="checkbox-label">
                    <span className="mr-2">
                      {intl.formatMessage(messages.enable)}
                    </span>
                    <span className="label-tip">
                      {intl.formatMessage(messages.enableTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
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
                  {errors.apiKey &&
                    touched.apiKey &&
                    typeof errors.apiKey === 'string' && (
                      <div className="error">{errors.apiKey}</div>
                    )}
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
                            await testConnection(values.apiKey, values.pin);
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

export default SettingsTvdb;
