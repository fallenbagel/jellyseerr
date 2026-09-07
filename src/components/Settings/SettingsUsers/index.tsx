import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import LabeledCheckbox from '@app/components/Common/LabeledCheckbox';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import PermissionEdit from '@app/components/PermissionEdit';
import QuotaSelector from '@app/components/QuotaSelector';
import OidcProviderModal from '@app/components/Settings/SettingsUsers/OidcProviderModal';
import useSettings from '@app/hooks/useSettings';
import useToasts from '@app/hooks/useToasts';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import {
  ArrowDownOnSquareIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { TrashIcon } from '@heroicons/react/24/solid';
import { MediaServerType } from '@server/constants/server';
import type { MainSettings, OidcProvider } from '@server/lib/settings';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';
import * as yup from 'yup';

const messages = defineMessages('components.Settings.SettingsUsers', {
  users: 'Users',
  userSettings: 'User Settings',
  userSettingsDescription: 'Configure global and default user settings.',
  toastSettingsSuccess: 'User settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  loginMethods: 'Login Methods',
  loginMethodsTip: 'Configure login methods for users.',
  localLogin: 'Enable Local Sign-In',
  localLoginTip:
    'Allow users to sign in using their email address and password',
  mediaServerLogin: 'Enable {mediaServerName} Sign-In',
  mediaServerLoginTip:
    'Allow users to sign in using their {mediaServerName} account',
  oidcLogin: 'Enable OpenID Connect Sign-In',
  oidcLoginTip: 'Allow users to sign in with an OpenID Connect provider',
  oidcProviders: 'OpenID Connect Providers',
  oidcProvidersTip: 'Configure OpenID Connect identity providers.',
  addProvider: 'Add Provider',
  noProviders: 'No OpenID Connect providers configured.',
  toastProviderSuccess: 'Provider saved successfully!',
  toastProviderFailure: 'Something went wrong while saving the provider.',
  toastProviderDeleteFailure:
    'Something went wrong while deleting the provider.',
  atLeastOneAuth: 'At least one authentication method must be selected.',
  newPlexLogin: 'Enable New {mediaServerName} Sign-In',
  newPlexLoginTip:
    'Allow {mediaServerName} users to sign in without first being imported',
  movieRequestLimitLabel: 'Global Movie Request Limit',
  tvRequestLimitLabel: 'Global Series Request Limit',
  defaultPermissions: 'Default Permissions',
  defaultPermissionsTip: 'Initial permissions assigned to new users',
  disabledMediaServerLoginWarning:
    'Some users may not have a {applicationTitle} password set. Disabling {mediaServerName} sign-in could lock them out. Affected users will need to set a password from their profile or via a password reset link.',
});

const SettingsUsers = () => {
  const { addToast } = useToasts();
  const intl = useIntl();
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<MainSettings>('/api/v1/settings/main');
  const { data: oidcSettings, mutate: revalidateOidcSettings } = useSWR<{
    providers: OidcProvider[];
  }>('/api/v1/settings/oidc');
  const [modalProvider, setModalProvider] = useState<
    OidcProvider | null | undefined
  >(undefined);
  const settings = useSettings();

  const schema = yup
    .object()
    .shape({
      localLogin: yup.boolean(),
      mediaServerLogin: yup.boolean(),
      oidcLogin: yup.boolean(),
    })
    .test({
      name: 'atLeastOneAuth',
      test: function (values) {
        const isValid = (
          [
            'localLogin',
            'mediaServerLogin',
            'oidcLogin',
          ] as (keyof typeof values)[]
        ).some((field) => !!values[field]);

        if (isValid) return true;
        return this.createError({
          path: 'localLogin | mediaServerLogin',
          message: intl.formatMessage(messages.atLeastOneAuth),
        });
      },
    });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  const mediaServerFormatValues = {
    mediaServerName:
      settings.currentSettings.mediaServerType === MediaServerType.JELLYFIN
        ? 'Jellyfin'
        : settings.currentSettings.mediaServerType === MediaServerType.EMBY
          ? 'Emby'
          : settings.currentSettings.mediaServerType === MediaServerType.PLEX
            ? 'Plex'
            : undefined,
  };

  const deleteProvider = async (provider: OidcProvider) => {
    try {
      await axios.post('/api/v1/settings/oidc', {
        providers: (oidcSettings?.providers ?? []).filter(
          (p) => p.slug !== provider.slug
        ),
      });
      await revalidateOidcSettings();
      mutate('/api/v1/settings/public');
      addToast(intl.formatMessage(messages.toastProviderSuccess), {
        autoDismiss: true,
        appearance: 'success',
      });
    } catch {
      addToast(intl.formatMessage(messages.toastProviderDeleteFailure), {
        autoDismiss: true,
        appearance: 'error',
      });
    }
  };

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
            mediaServerLogin: data?.mediaServerLogin,
            oidcLogin: data?.oidcLogin,
            newPlexLogin: data?.newPlexLogin,
            movieQuotaLimit: data?.defaultQuotas.movie.quotaLimit ?? 0,
            movieQuotaDays: data?.defaultQuotas.movie.quotaDays ?? 7,
            tvQuotaLimit: data?.defaultQuotas.tv.quotaLimit ?? 0,
            tvQuotaDays: data?.defaultQuotas.tv.quotaDays ?? 7,
            defaultPermissions: data?.defaultPermissions ?? 0,
          }}
          validationSchema={schema}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/settings/main', {
                localLogin: values.localLogin,
                mediaServerLogin: values.mediaServerLogin,
                oidcLogin: values.oidcLogin,
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
              });
              mutate('/api/v1/settings/public');

              addToast(intl.formatMessage(messages.toastSettingsSuccess), {
                autoDismiss: true,
                appearance: 'success',
              });
            } catch {
              addToast(intl.formatMessage(messages.toastSettingsFailure), {
                autoDismiss: true,
                appearance: 'error',
              });
            } finally {
              revalidate();
            }
          }}
        >
          {({ isSubmitting, isValid, values, errors, setFieldValue }) => {
            return (
              <Form className="section">
                <div
                  role="group"
                  aria-labelledby="group-label"
                  className="form-group"
                >
                  <div className="form-row">
                    <span id="group-label" className="group-label">
                      {intl.formatMessage(messages.loginMethods)}
                      <span className="label-tip">
                        {intl.formatMessage(messages.loginMethodsTip)}
                      </span>
                      {'localLogin | mediaServerLogin' in errors && (
                        <span className="error">
                          {errors['localLogin | mediaServerLogin'] as string}
                        </span>
                      )}
                    </span>

                    <div className="form-input-area max-w-lg">
                      <LabeledCheckbox
                        id="localLogin"
                        label={intl.formatMessage(messages.localLogin)}
                        description={intl.formatMessage(
                          messages.localLoginTip,
                          mediaServerFormatValues
                        )}
                        onChange={() =>
                          setFieldValue('localLogin', !values.localLogin)
                        }
                      />
                      <LabeledCheckbox
                        id="mediaServerLogin"
                        className="mt-4"
                        label={intl.formatMessage(
                          messages.mediaServerLogin,
                          mediaServerFormatValues
                        )}
                        description={intl.formatMessage(
                          messages.mediaServerLoginTip,
                          mediaServerFormatValues
                        )}
                        onChange={() =>
                          setFieldValue(
                            'mediaServerLogin',
                            !values.mediaServerLogin
                          )
                        }
                      />
                      <LabeledCheckbox
                        id="oidcLogin"
                        className="mt-4"
                        label={intl.formatMessage(messages.oidcLogin)}
                        description={intl.formatMessage(messages.oidcLoginTip)}
                        onChange={() =>
                          setFieldValue('oidcLogin', !values.oidcLogin)
                        }
                      />
                      {!values.mediaServerLogin && values.localLogin && (
                        <div className="mt-4">
                          <Alert
                            title={intl.formatMessage(
                              messages.disabledMediaServerLoginWarning,
                              {
                                applicationTitle:
                                  settings.currentSettings.applicationTitle,
                                ...mediaServerFormatValues,
                              }
                            )}
                            type="warning"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="newPlexLogin" className="checkbox-label">
                    {intl.formatMessage(
                      messages.newPlexLogin,
                      mediaServerFormatValues
                    )}
                    <span className="label-tip">
                      {intl.formatMessage(
                        messages.newPlexLoginTip,
                        mediaServerFormatValues
                      )}
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

      <div className="section">
        <div role="group" aria-labelledby="group-label" className="form-group">
          <div className="form-row">
            <span id="group-label" className="group-label">
              {intl.formatMessage(messages.oidcProviders)}
              <span className="label-tip">
                {intl.formatMessage(messages.oidcProvidersTip)}
              </span>
            </span>
            <div className="form-input-area">
              <div className="flex max-w-lg flex-col">
                {oidcSettings?.providers.length ? (
                  <ul className="flex flex-col gap-4">
                    {oidcSettings.providers.map((provider) => (
                      <li
                        key={provider.slug}
                        className="flex items-center gap-4 overflow-hidden rounded-lg bg-gray-800/50 px-4 py-5 shadow ring-1 ring-gray-700 sm:p-6"
                      >
                        <div className="w-10 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={provider.logo || '/images/openid.svg'}
                            alt={provider.name}
                            className="h-10 w-10"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-gray-300">
                            {provider.name}
                          </div>
                          <div className="text-xl font-semibold text-white">
                            {provider.slug}
                          </div>
                          <div className="truncate text-sm text-gray-400">
                            {provider.issuerUrl}
                          </div>
                        </div>
                        <div className="flex-grow" />
                        <Button
                          buttonType="primary"
                          onClick={() => setModalProvider(provider)}
                        >
                          <PencilIcon />
                          <span>{intl.formatMessage(globalMessages.edit)}</span>
                        </Button>
                        <ConfirmButton
                          onClick={() => deleteProvider(provider)}
                          confirmText={intl.formatMessage(
                            globalMessages.areyousure
                          )}
                        >
                          <TrashIcon />
                          <span>
                            {intl.formatMessage(globalMessages.delete)}
                          </span>
                        </ConfirmButton>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center font-semibold text-gray-400">
                    {intl.formatMessage(messages.noProviders)}
                  </p>
                )}
                <div className="mt-4 flex justify-end">
                  <span className="inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      onClick={() => setModalProvider(null)}
                    >
                      <PlusIcon />
                      <span>{intl.formatMessage(messages.addProvider)}</span>
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalProvider !== undefined && (
        <OidcProviderModal
          provider={modalProvider}
          providers={oidcSettings?.providers ?? []}
          onClose={() => setModalProvider(undefined)}
          onSaved={async () => {
            setModalProvider(undefined);
            await revalidateOidcSettings();
            mutate('/api/v1/settings/public');
            addToast(intl.formatMessage(messages.toastProviderSuccess), {
              autoDismiss: true,
              appearance: 'success',
            });
          }}
        />
      )}
    </>
  );
};

export default SettingsUsers;
