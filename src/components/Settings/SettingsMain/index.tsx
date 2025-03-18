import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import LanguageSelector from '@app/components/LanguageSelector';
import RegionSelector from '@app/components/RegionSelector';
import CopyButton from '@app/components/Settings/CopyButton';
import SettingsBadge from '@app/components/Settings/SettingsBadge';
import type { AvailableLocale } from '@app/context/LanguageContext';
import { availableLanguages } from '@app/context/LanguageContext';
import useLocale from '@app/hooks/useLocale';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import type { MainSettings } from '@server/lib/settings';
import { Field, Form, Formik } from 'formik';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';

const messages = defineMessages('components.Settings.SettingsMain', {
  general: 'General',
  generalsettings: 'General Settings',
  generalsettingsDescription:
    'Configure global and default settings for Jellyseerr.',
  apikey: 'API Key',
  applicationTitle: 'Application Title',
  applicationurl: 'Application URL',
  discoverRegion: 'Discover Region',
  discoverRegionTip: 'Filter content by regional availability',
  originallanguage: 'Discover Language',
  originallanguageTip: 'Filter content by original language',
  streamingRegion: 'Streaming Region',
  streamingRegionTip: 'Show streaming sites by regional availability',
  toastApiKeySuccess: 'New API key generated successfully!',
  toastApiKeyFailure: 'Something went wrong while generating a new API key.',
  toastSettingsSuccess: 'Settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  hideAvailable: 'Hide Available Media',
  cacheImages: 'Enable Image Caching',
  cacheImagesTip:
    'Cache externally sourced images (requires a significant amount of disk space)',
  validationApplicationTitle: 'You must provide an application title',
  validationApplicationUrl: 'You must provide a valid URL',
  validationApplicationUrlTrailingSlash: 'URL must not end in a trailing slash',
  partialRequestsEnabled: 'Allow Partial Series Requests',
  enableSpecialEpisodes: 'Allow Special Episodes Requests',
  locale: 'Display Language',
  moviesOnly: 'Movies Only Mode',
  moviesOnlyTip: 'Hide all TV series content for all users',
  contentType: 'Content Type',
  contentTypeTip: 'Filter content by type across the application',
  contentTypeAll: 'All',
  contentTypeMovies: 'Movies Only',
  contentTypeTV: 'TV Only',
});

const SettingsMain = () => {
  const { addToast } = useToasts();
  const { user: currentUser, hasPermission: userHasPermission } = useUser();
  const intl = useIntl();
  const { setLocale } = useLocale();
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<MainSettings>('/api/v1/settings/main');
  const { data: userData } = useSWR<UserSettingsGeneralResponse>(
    currentUser ? `/api/v1/user/${currentUser.id}/settings/main` : null
  );

  const MainSettingsSchema = Yup.object().shape({
    applicationTitle: Yup.string().required(
      intl.formatMessage(messages.validationApplicationTitle)
    ),
    applicationUrl: Yup.string()
      .matches(
        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}(\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*))?$/i,
        intl.formatMessage(messages.validationApplicationUrl)
      )
      .test(
        'no-trailing-slash',
        intl.formatMessage(messages.validationApplicationUrlTrailingSlash),
        (value) => !value || !value.endsWith('/')
      ),
  });

  const regenerate = async () => {
    try {
      const res = await fetch('/api/v1/settings/main/regenerate', {
        method: 'POST',
      });
      if (!res.ok) throw new Error();

      revalidate();
      addToast(intl.formatMessage(messages.toastApiKeySuccess), {
        autoDismiss: true,
        appearance: 'success',
      });
    } catch (e) {
      addToast(intl.formatMessage(messages.toastApiKeyFailure), {
        autoDismiss: true,
        appearance: 'error',
      });
    }
  };

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
        <h3 className="heading">
          {intl.formatMessage(messages.generalsettings)}
        </h3>
        <p className="description">
          {intl.formatMessage(messages.generalsettingsDescription)}
        </p>
      </div>
      <div className="section">
        <Formik
          initialValues={{
            applicationTitle: data?.applicationTitle,
            applicationUrl: data?.applicationUrl,
            hideAvailable: data?.hideAvailable,
            locale: data?.locale ?? 'en',
            discoverRegion: data?.discoverRegion,
            originalLanguage: data?.originalLanguage,
            streamingRegion: data?.streamingRegion || 'US',
            partialRequestsEnabled: data?.partialRequestsEnabled,
            enableSpecialEpisodes: data?.enableSpecialEpisodes,
            cacheImages: data?.cacheImages,
            moviesOnly: data?.moviesOnly,
            contentType: data?.contentType ?? 'all',
          }}
          enableReinitialize
          validationSchema={MainSettingsSchema}
          onSubmit={async (values) => {
            try {
              const res = await fetch('/api/v1/settings/main', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  applicationTitle: values.applicationTitle,
                  applicationUrl: values.applicationUrl,
                  hideAvailable: values.hideAvailable,
                  locale: values.locale,
                  discoverRegion: values.discoverRegion,
                  streamingRegion: values.streamingRegion,
                  originalLanguage: values.originalLanguage,
                  partialRequestsEnabled: values.partialRequestsEnabled,
                  enableSpecialEpisodes: values.enableSpecialEpisodes,
                  cacheImages: values.cacheImages,
                  moviesOnly: values.contentType === 'movies',
                  contentType: values.contentType,
                }),
              });
              if (!res.ok) throw new Error();
              mutate('/api/v1/settings/public');
              mutate('/api/v1/status');

              if (setLocale) {
                setLocale(
                  (userData?.locale
                    ? userData.locale
                    : values.locale) as AvailableLocale
                );
              }

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
                {userHasPermission(Permission.ADMIN) && (
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
                          value={data?.apiKey}
                          readOnly
                        />
                        <CopyButton
                          textToCopy={data?.apiKey ?? ''}
                          key={data?.apiKey}
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            regenerate();
                          }}
                          className="input-action"
                        >
                          <ArrowPathIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="form-row">
                  <label htmlFor="applicationTitle" className="text-label">
                    {intl.formatMessage(messages.applicationTitle)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <Field
                        id="applicationTitle"
                        name="applicationTitle"
                        type="text"
                      />
                    </div>
                    {errors.applicationTitle &&
                      touched.applicationTitle &&
                      typeof errors.applicationTitle === 'string' && (
                        <div className="error">{errors.applicationTitle}</div>
                      )}
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="applicationUrl" className="text-label">
                    {intl.formatMessage(messages.applicationurl)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <Field
                        id="applicationUrl"
                        name="applicationUrl"
                        type="text"
                        inputMode="url"
                      />
                    </div>
                    {errors.applicationUrl &&
                      touched.applicationUrl &&
                      typeof errors.applicationUrl === 'string' && (
                        <div className="error">{errors.applicationUrl}</div>
                      )}
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="cacheImages" className="checkbox-label">
                    <span className="mr-2">
                      {intl.formatMessage(messages.cacheImages)}
                    </span>
                    <SettingsBadge badgeType="experimental" />
                    <span className="label-tip">
                      {intl.formatMessage(messages.cacheImagesTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="cacheImages"
                      name="cacheImages"
                      onChange={() => {
                        setFieldValue('cacheImages', !values.cacheImages);
                      }}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="locale" className="text-label">
                    {intl.formatMessage(messages.locale)}
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <Field as="select" id="locale" name="locale">
                        {(
                          Object.keys(
                            availableLanguages
                          ) as (keyof typeof availableLanguages)[]
                        ).map((key) => (
                          <option
                            key={key}
                            value={availableLanguages[key].code}
                            lang={availableLanguages[key].code}
                          >
                            {availableLanguages[key].display}
                          </option>
                        ))}
                      </Field>
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="discoverRegion" className="text-label">
                    <span>{intl.formatMessage(messages.discoverRegion)}</span>
                    <span className="label-tip">
                      {intl.formatMessage(messages.discoverRegionTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field">
                      <RegionSelector
                        value={values.discoverRegion ?? ''}
                        name="discoverRegion"
                        onChange={setFieldValue}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="originalLanguage" className="text-label">
                    <span>{intl.formatMessage(messages.originallanguage)}</span>
                    <span className="label-tip">
                      {intl.formatMessage(messages.originallanguageTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field relative z-30">
                      <LanguageSelector
                        setFieldValue={setFieldValue}
                        value={values.originalLanguage}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="streamingRegion" className="text-label">
                    <span>{intl.formatMessage(messages.streamingRegion)}</span>
                    <span className="label-tip">
                      {intl.formatMessage(messages.streamingRegionTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <div className="form-input-field relative z-20">
                      <RegionSelector
                        value={values.streamingRegion}
                        name="streamingRegion"
                        onChange={setFieldValue}
                        regionType="streaming"
                        disableAll
                      />
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="hideAvailable" className="checkbox-label">
                    <span className="mr-2">
                      {intl.formatMessage(messages.hideAvailable)}
                    </span>
                    <SettingsBadge badgeType="experimental" />
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="hideAvailable"
                      name="hideAvailable"
                      onChange={() => {
                        setFieldValue('hideAvailable', !values.hideAvailable);
                      }}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label
                    htmlFor="partialRequestsEnabled"
                    className="checkbox-label"
                  >
                    <span className="mr-2">
                      {intl.formatMessage(messages.partialRequestsEnabled)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="partialRequestsEnabled"
                      name="partialRequestsEnabled"
                      onChange={() => {
                        setFieldValue(
                          'partialRequestsEnabled',
                          !values.partialRequestsEnabled
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label
                    htmlFor="enableSpecialEpisodes"
                    className="checkbox-label"
                  >
                    <span className="mr-2">
                      {intl.formatMessage(messages.enableSpecialEpisodes)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="enableSpecialEpisodes"
                      name="enableSpecialEpisodes"
                      onChange={() => {
                        setFieldValue(
                          'enableSpecialEpisodes',
                          !values.enableSpecialEpisodes
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="contentType" className="text-label">
                    <span className="mr-2">
                      {intl.formatMessage(messages.contentType)}
                    </span>
                    <SettingsBadge badgeType="experimental" />
                    <span className="label-tip">
                      {intl.formatMessage(messages.contentTypeTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <div className="flex items-center space-x-2 sm:space-x-5">
                      <div className="flex items-center">
                        <Field
                          type="radio"
                          id="contentTypeAll"
                          name="contentType"
                          value="all"
                          className="h-4 w-4 border-gray-300 text-indigo-500 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor="contentTypeAll"
                          className="ml-2 block text-sm text-gray-500 dark:text-gray-400"
                        >
                          {intl.formatMessage(messages.contentTypeAll)}
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Field
                          type="radio"
                          id="contentTypeMovies"
                          name="contentType"
                          value="movies"
                          className="h-4 w-4 border-gray-300 text-indigo-500 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor="contentTypeMovies"
                          className="ml-2 block text-sm text-gray-500 dark:text-gray-400"
                        >
                          {intl.formatMessage(messages.contentTypeMovies)}
                        </label>
                      </div>
                      <div className="flex items-center">
                        <Field
                          type="radio"
                          id="contentTypeTV"
                          name="contentType"
                          value="tv"
                          className="h-4 w-4 border-gray-300 text-indigo-500 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor="contentTypeTV"
                          className="ml-2 block text-sm text-gray-500 dark:text-gray-400"
                        >
                          {intl.formatMessage(messages.contentTypeTV)}
                        </label>
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
    </>
  );
};

export default SettingsMain;
