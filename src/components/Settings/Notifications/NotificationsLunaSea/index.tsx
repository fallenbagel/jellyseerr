import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import NotificationTypeSelector from '@app/components/NotificationTypeSelector';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownOnSquareIcon, BeakerIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';

const messages = defineMessages(
  'components.Settings.Notifications.NotificationsLunaSea',
  {
    agentenabled: 'Enable Agent',
    embedImage: 'Embed Image',
    webhookUrl: 'Webhook URL',
    webhookUrlTip:
      'Your user- or device-based <LunaSeaLink>notification webhook URL</LunaSeaLink>',
    validationWebhookUrl: 'You must provide a valid URL',
    profileName: 'Profile Name',
    profileNameTip:
      'Only required if not using the <code>default</code> profile',
    settingsSaved: 'LunaSea notification settings saved successfully!',
    settingsFailed: 'LunaSea notification settings failed to save.',
    toastLunaSeaTestSending: 'Sending LunaSea test notification…',
    toastLunaSeaTestSuccess: 'LunaSea test notification sent!',
    toastLunaSeaTestFailed: 'LunaSea test notification failed to send.',
    validationTypes: 'You must select at least one notification type',
  }
);

const NotificationsLunaSea = () => {
  const intl = useIntl();
  const { addToast, removeToast } = useToasts();
  const [isTesting, setIsTesting] = useState(false);
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR('/api/v1/settings/notifications/lunasea');

  const NotificationsLunaSeaSchema = Yup.object().shape({
    webhookUrl: Yup.string()
      .when('enabled', {
        is: true,
        then: Yup.string()
          .nullable()
          .required(intl.formatMessage(messages.validationWebhookUrl)),
        otherwise: Yup.string().nullable(),
      })
      .url(intl.formatMessage(messages.validationWebhookUrl)),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Formik
      initialValues={{
        enabled: data.enabled,
        embedImage: data.embedImage,
        types: data.types,
        webhookUrl: data.options.webhookUrl,
        profileName: data.options.profileName,
      }}
      validationSchema={NotificationsLunaSeaSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/lunasea', {
            enabled: values.enabled,
            types: values.types,
            options: {
              webhookUrl: values.webhookUrl,
              profileName: values.profileName,
            },
          });
          addToast(intl.formatMessage(messages.settingsSaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (e) {
          addToast(intl.formatMessage(messages.settingsFailed), {
            appearance: 'error',
            autoDismiss: true,
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({
        errors,
        touched,
        isSubmitting,
        values,
        isValid,
        setFieldValue,
        setFieldTouched,
      }) => {
        const testSettings = async () => {
          setIsTesting(true);
          let toastId: string | undefined;
          try {
            addToast(
              intl.formatMessage(messages.toastLunaSeaTestSending),
              {
                autoDismiss: false,
                appearance: 'info',
              },
              (id) => {
                toastId = id;
              }
            );
            await axios.post('/api/v1/settings/notifications/lunasea/test', {
              enabled: true,
              types: values.types,
              options: {
                webhookUrl: values.webhookUrl,
                profileName: values.profileName,
              },
            });

            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastLunaSeaTestSuccess), {
              autoDismiss: true,
              appearance: 'success',
            });
          } catch (e) {
            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastLunaSeaTestFailed), {
              autoDismiss: true,
              appearance: 'error',
            });
          } finally {
            setIsTesting(false);
          }
        };

        return (
          <Form className="section">
            <div className="form-row">
              <label htmlFor="enabled" className="checkbox-label">
                {intl.formatMessage(messages.agentenabled)}
                <span className="label-required">*</span>
              </label>
              <div className="form-input-area">
                <Field type="checkbox" id="enabled" name="enabled" />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="embedImage" className="checkbox-label">
                {intl.formatMessage(messages.embedImage)}
              </label>
              <div className="form-input-area">
                <Field type="checkbox" id="embedImage" name="embedImage" />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="name" className="text-label">
                {intl.formatMessage(messages.webhookUrl)}
                <span className="label-required">*</span>
                <span className="label-tip">
                  {intl.formatMessage(messages.webhookUrlTip, {
                    LunaSeaLink: (msg: React.ReactNode) => (
                      <a
                        href="https://docs.lunasea.app/lunasea/notifications/overseerr"
                        className="text-white transition duration-300 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {msg}
                      </a>
                    ),
                  })}
                </span>
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <Field
                    id="webhookUrl"
                    name="webhookUrl"
                    type="text"
                    inputMode="url"
                  />
                </div>
                {errors.webhookUrl &&
                  touched.webhookUrl &&
                  typeof errors.webhookUrl === 'string' && (
                    <div className="error">{errors.webhookUrl}</div>
                  )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="profileName" className="text-label">
                {intl.formatMessage(messages.profileName)}
                <span className="label-tip">
                  {intl.formatMessage(messages.profileNameTip, {
                    code: (msg: React.ReactNode) => (
                      <code className="bg-opacity-50">{msg}</code>
                    ),
                  })}
                </span>
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <Field id="profileName" name="profileName" type="text" />
                </div>
              </div>
            </div>
            <NotificationTypeSelector
              currentTypes={values.enabled ? values.types : 0}
              onUpdate={(newTypes) => {
                setFieldValue('types', newTypes);
                setFieldTouched('types');

                if (newTypes) {
                  setFieldValue('enabled', true);
                }
              }}
              error={
                values.enabled && !values.types && touched.types
                  ? intl.formatMessage(messages.validationTypes)
                  : undefined
              }
            />
            <div className="actions">
              <div className="flex justify-end">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="warning"
                    disabled={isSubmitting || !isValid || isTesting}
                    onClick={(e) => {
                      e.preventDefault();
                      testSettings();
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
                    disabled={
                      isSubmitting ||
                      !isValid ||
                      isTesting ||
                      (values.enabled && !values.types)
                    }
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
  );
};

export default NotificationsLunaSea;
