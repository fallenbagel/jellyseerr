import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import PermissionEdit from '@app/components/PermissionEdit';
import QuotaSelector from '@app/components/QuotaSelector';
import useSettings from '@app/hooks/useSettings';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline';
import { MediaServerType } from '@server/constants/server';
import type { MainSettings } from '@server/lib/settings';
import { Field, Form, Formik } from 'formik';
import getConfig from 'next/config';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';

const messages = defineMessages('components.Settings.SettingsUsers', {
  users: 'Users',
  userSettings: 'User Settings',
  userSettingsDescription: 'Configure global and default user settings.',
  toastSettingsSuccess: 'User settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  localLogin: 'Enable Local Sign-In',
  localLoginTip:
    'Allow users to sign in using their email address and password, instead of {mediaServerName} OAuth',
  newPlexLogin: 'Enable New {mediaServerName} Sign-In',
  newPlexLoginTip:
    'Allow {mediaServerName} users to sign in without first being imported',
  movieRequestLimitLabel: 'Global Movie Request Limit',
  tvRequestLimitLabel: 'Global Series Request Limit',
  defaultPermissions: 'Default Permissions',
  defaultPermissionsTip: 'Initial permissions assigned to new users',
});

const SettingsUsers = () => {
  const { addToast } = useToasts();
  const intl = useIntl();
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<MainSettings>('/api/v1/settings/main');
  const settings = useSettings();
  const { publicRuntimeConfig } = getConfig();

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.users),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">{intl.formatMessage(messages.userSettings)}</h3>
        <p className="description">
          {intl.formatMessage(messages.userSettingsDescription)}
        </p>
      </div>
      <div className="section">
        <Formik
          initialValues={{
            localLogin: data?.localLogin,
            newPlexLogin: data?.newPlexLogin,
            movieQuotaLimit: data?.defaultQuotas.movie.quotaLimit ?? 0,
            movieQuotaDays: data?.defaultQuotas.movie.quotaDays ?? 7,
            tvQuotaLimit: data?.defaultQuotas.tv.quotaLimit ?? 0,
            tvQuotaDays: data?.defaultQuotas.tv.quotaDays ?? 7,
            defaultPermissions: data?.defaultPermissions ?? 0,
          }}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              const res = await fetch('/api/v1/settings/main', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  localLogin: values.localLogin,
                  newPlexLogin: values.newPlexLogin,
                  defaultQuotas: {
                    movie: {
                      quotaLimit: values.movieQuotaLimit,
                      quotaDays: values.movieQuotaDays,
                    },
                    tv: {
                      quotaLimit: values.tvQuotaLimit,
                      quotaDays: values.tvQuotaDays,
                    },
                  },
                  defaultPermissions: values.defaultPermissions,
                }),
              });
              if (!res.ok) throw new Error();
              mutate('/api/v1/settings/public');

              addToast(intl.formatMessage(messages.toastSettingsSuccess), {
                autoDismiss: true,
                appearance: 'success',
              });
            } catch (e) {
              addToast(intl.formatMessage(messages.toastSettingsFailure), {
                autoDismiss: true,
                appearance: 'error',
              });
            } finally {
              revalidate();
            }
          }}
        >
          {({ isSubmitting, values, setFieldValue }) => {
            return (
              <Form className="section">
                <div className="form-row">
                  <label htmlFor="localLogin" className="checkbox-label">
                    {intl.formatMessage(messages.localLogin)}
                    <span className="label-tip">
                      {intl.formatMessage(messages.localLoginTip, {
                        mediaServerName:
                          settings.currentSettings.mediaServerType ===
                          MediaServerType.PLEX
                            ? 'Plex'
                            : settings.currentSettings.mediaServerType ===
                              MediaServerType.JELLYFIN
                            ? 'Jellyfin'
                            : 'Emby',
                      })}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="localLogin"
                      name="localLogin"
                      onChange={() => {
                        setFieldValue('localLogin', !values.localLogin);
                      }}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="newPlexLogin" className="checkbox-label">
                    {intl.formatMessage(messages.newPlexLogin, {
                      mediaServerName:
                        publicRuntimeConfig.JELLYFIN_TYPE == 'emby'
                          ? 'Emby'
                          : settings.currentSettings.mediaServerType ===
                            MediaServerType.PLEX
                          ? 'Plex'
                          : 'Jellyfin',
                    })}
                    <span className="label-tip">
                      {intl.formatMessage(messages.newPlexLoginTip, {
                        mediaServerName:
                          publicRuntimeConfig.JELLYFIN_TYPE == 'emby'
                            ? 'Emby'
                            : settings.currentSettings.mediaServerType ===
                              MediaServerType.PLEX
                            ? 'Plex'
                            : 'Jellyfin',
                      })}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="newPlexLogin"
                      name="newPlexLogin"
                      onChange={() => {
                        setFieldValue('newPlexLogin', !values.newPlexLogin);
                      }}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="applicationTitle" className="text-label">
                    {intl.formatMessage(messages.movieRequestLimitLabel)}
                  </label>
                  <div className="form-input-area">
                    <QuotaSelector
                      onChange={setFieldValue}
                      dayFieldName="movieQuotaDays"
                      limitFieldName="movieQuotaLimit"
                      mediaType="movie"
                      defaultDays={values.movieQuotaDays}
                      defaultLimit={values.movieQuotaLimit}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="applicationTitle" className="text-label">
                    {intl.formatMessage(messages.tvRequestLimitLabel)}
                  </label>
                  <div className="form-input-area">
                    <QuotaSelector
                      onChange={setFieldValue}
                      dayFieldName="tvQuotaDays"
                      limitFieldName="tvQuotaLimit"
                      mediaType="tv"
                      defaultDays={values.tvQuotaDays}
                      defaultLimit={values.tvQuotaLimit}
                    />
                  </div>
                </div>
                <div
                  role="group"
                  aria-labelledby="group-label"
                  className="form-group"
                >
                  <div className="form-row">
                    <span id="group-label" className="group-label">
                      {intl.formatMessage(messages.defaultPermissions)}
                      <span className="label-tip">
                        {intl.formatMessage(messages.defaultPermissionsTip)}
                      </span>
                    </span>
                    <div className="form-input-area">
                      <div className="max-w-lg">
                        <PermissionEdit
                          currentPermission={values.defaultPermissions}
                          onUpdate={(newPermissions) =>
                            setFieldValue('defaultPermissions', newPermissions)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="actions">
                  <div className="flex justify-end">
                    <span className="ml-3 inline-flex rounded-md shadow-sm">
                      <Button
                        buttonType="primary"
                        type="submit"
                        disabled={isSubmitting}
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

export default SettingsUsers;
