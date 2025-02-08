import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import Tooltip from '@app/components/Common/Tooltip';
import SettingsBadge from '@app/components/Settings/SettingsBadge';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline';
import type { NetworkSettings } from '@server/lib/settings';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR, { mutate } from 'swr';
import * as Yup from 'yup';

const messages = defineMessages('components.Settings.SettingsNetwork', {
  toastSettingsSuccess: 'Settings saved successfully!',
  toastSettingsFailure: 'Something went wrong while saving settings.',
  network: 'Network',
  networksettings: 'Network Settings',
  networksettingsDescription:
    'Configure network settings for your Jellyseerr instance.',
  csrfProtection: 'Enable CSRF Protection',
  csrfProtectionTip: 'Set external API access to read-only (requires HTTPS)',
  csrfProtectionHoverTip:
    'Do NOT enable this setting unless you understand what you are doing!',
  trustProxy: 'Enable Proxy Support',
  trustProxyTip:
    'Allow Jellyseerr to correctly register client IP addresses behind a proxy',
  enableForwardAuth: 'Enable Proxy Forward Authentication',
  enableForwardAuthTip:
    'Authenticate as the user specified by the X-Forwarded-User header. Only enable when secured behind a trusted proxy.',
  proxyEnabled: 'HTTP(S) Proxy',
  proxyHostname: 'Proxy Hostname',
  proxyPort: 'Proxy Port',
  proxySsl: 'Use SSL For Proxy',
  proxyUser: 'Proxy Username',
  proxyPassword: 'Proxy Password',
  proxyBypassFilter: 'Proxy Ignored Addresses',
  proxyBypassFilterTip:
    "Use ',' as a separator, and '*.' as a wildcard for subdomains",
  proxyBypassLocalAddresses: 'Bypass Proxy for Local Addresses',
  validationProxyPort: 'You must provide a valid port',
  networkDisclaimer:
    'Network parameters from your container/system should be used instead of these settings. See the {docs} for more information.',
  docs: 'documentation',
});

const SettingsNetwork = () => {
  const { addToast } = useToasts();
  const intl = useIntl();
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<NetworkSettings>('/api/v1/settings/network');

  const NetworkSettingsSchema = Yup.object().shape({
    proxyPort: Yup.number().when('proxyEnabled', {
      is: (proxyEnabled: boolean) => proxyEnabled,
      then: Yup.number().required(
        intl.formatMessage(messages.validationProxyPort)
      ),
    }),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(messages.network),
          intl.formatMessage(globalMessages.settings),
        ]}
      />
      <div className="mb-6">
        <h3 className="heading">
          {intl.formatMessage(messages.networksettings)}
        </h3>
        <p className="description">
          {intl.formatMessage(messages.networksettingsDescription)}
        </p>
      </div>
      <div className="section">
        <Formik
          initialValues={{
            csrfProtection: data?.csrfProtection,
            forceIpv4First: data?.forceIpv4First,
            enableForwardAuth: data?.enableForwardAuth,
            dnsServers: data?.dnsServers,
            trustProxy: data?.trustProxy,
            proxyEnabled: data?.proxy?.enabled,
            proxyHostname: data?.proxy?.hostname,
            proxyPort: data?.proxy?.port,
            proxySsl: data?.proxy?.useSsl,
            proxyUser: data?.proxy?.user,
            proxyPassword: data?.proxy?.password,
            proxyBypassFilter: data?.proxy?.bypassFilter,
            proxyBypassLocalAddresses: data?.proxy?.bypassLocalAddresses,
          }}
          enableReinitialize
          validationSchema={NetworkSettingsSchema}
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/settings/network', {
                csrfProtection: values.csrfProtection,
                trustProxy: values.trustProxy,
                proxy: {
                  enabled: values.proxyEnabled,
                  hostname: values.proxyHostname,
                  port: values.proxyPort,
                  useSsl: values.proxySsl,
                  user: values.proxyUser,
                  password: values.proxyPassword,
                  bypassFilter: values.proxyBypassFilter,
                  bypassLocalAddresses: values.proxyBypassLocalAddresses,
                },
                body: JSON.stringify({
                  csrfProtection: values.csrfProtection,
                  forceIpv4First: values.forceIpv4First,
                  trustProxy: values.trustProxy,
                  enableForwardAuth: values.enableForwardAuth,
                  proxy: {
                    enabled: values.proxyEnabled,
                    hostname: values.proxyHostname,
                    port: values.proxyPort,
                    useSsl: values.proxySsl,
                    user: values.proxyUser,
                    password: values.proxyPassword,
                    bypassFilter: values.proxyBypassFilter,
                    bypassLocalAddresses: values.proxyBypassLocalAddresses,
                  },
                }),
              });
              mutate('/api/v1/settings/public');
              mutate('/api/v1/status');

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
              <Form className="section" data-testid="settings-network-form">
                <div className="form-row">
                  <label htmlFor="trustProxy" className="checkbox-label">
                    <span className="mr-2">
                      {intl.formatMessage(messages.trustProxy)}
                    </span>
                    <SettingsBadge badgeType="restartRequired" />
                    <span className="label-tip">
                      {intl.formatMessage(messages.trustProxyTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="trustProxy"
                      name="trustProxy"
                      onChange={() => {
                        setFieldValue('trustProxy', !values.trustProxy);
                      }}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="enableForwardAuth" className="checkbox-label">
                    <span className="mr-2">
                      {intl.formatMessage(messages.enableForwardAuth)}
                    </span>
                    <SettingsBadge badgeType="advanced" className="mr-2" />
                    <span className="label-tip">
                      {intl.formatMessage(messages.enableForwardAuthTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="enableForwardAuth"
                      name="enableForwardAuth"
                      onChange={() => {
                        setFieldValue(
                          'enableForwardAuth',
                          !values.enableForwardAuth
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="csrfProtection" className="checkbox-label">
                    <span className="mr-2">
                      {intl.formatMessage(messages.csrfProtection)}
                    </span>
                    <SettingsBadge badgeType="advanced" className="mr-2" />
                    <SettingsBadge badgeType="restartRequired" />
                    <span className="label-tip">
                      {intl.formatMessage(messages.csrfProtectionTip)}
                    </span>
                  </label>
                  <div className="form-input-area">
                    <Tooltip
                      content={intl.formatMessage(
                        messages.csrfProtectionHoverTip
                      )}
                    >
                      <Field
                        type="checkbox"
                        id="csrfProtection"
                        name="csrfProtection"
                        onChange={() => {
                          setFieldValue(
                            'csrfProtection',
                            !values.csrfProtection
                          );
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>
                <div className="form-row">
                  <label htmlFor="proxyEnabled" className="checkbox-label">
                    <span className="mr-2">
                      {intl.formatMessage(messages.proxyEnabled)}
                    </span>
                    <SettingsBadge badgeType="advanced" className="mr-2" />
                    <SettingsBadge badgeType="restartRequired" />
                  </label>
                  <div className="form-input-area">
                    <Field
                      type="checkbox"
                      id="proxyEnabled"
                      name="proxyEnabled"
                      onChange={() => {
                        setFieldValue('proxyEnabled', !values.proxyEnabled);
                      }}
                    />
                  </div>
                </div>
                {values.proxyEnabled && (
                  <>
                    <div className="mr-2 ml-4">
                      <div className="form-row">
                        <label
                          htmlFor="proxyHostname"
                          className="checkbox-label"
                        >
                          {intl.formatMessage(messages.proxyHostname)}
                        </label>
                        <div className="form-input-area">
                          <div className="form-input-field">
                            <Field
                              id="proxyHostname"
                              name="proxyHostname"
                              type="text"
                            />
                          </div>
                          {errors.proxyHostname &&
                            touched.proxyHostname &&
                            typeof errors.proxyHostname === 'string' && (
                              <div className="error">
                                {errors.proxyHostname}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="form-row">
                        <label htmlFor="proxyPort" className="checkbox-label">
                          {intl.formatMessage(messages.proxyPort)}
                        </label>
                        <div className="form-input-area">
                          <div className="form-input-field">
                            <Field
                              id="proxyPort"
                              name="proxyPort"
                              type="text"
                            />
                          </div>
                          {errors.proxyPort &&
                            touched.proxyPort &&
                            typeof errors.proxyPort === 'string' && (
                              <div className="error">{errors.proxyPort}</div>
                            )}
                        </div>
                      </div>
                      <div className="form-row">
                        <label htmlFor="proxySsl" className="checkbox-label">
                          {intl.formatMessage(messages.proxySsl)}
                        </label>
                        <div className="form-input-area">
                          <Field
                            type="checkbox"
                            id="proxySsl"
                            name="proxySsl"
                            onChange={() => {
                              setFieldValue('proxySsl', !values.proxySsl);
                            }}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <label htmlFor="proxyUser" className="checkbox-label">
                          {intl.formatMessage(messages.proxyUser)}
                        </label>
                        <div className="form-input-area">
                          <div className="form-input-field">
                            <Field
                              id="proxyUser"
                              name="proxyUser"
                              type="text"
                            />
                          </div>
                          {errors.proxyUser &&
                            touched.proxyUser &&
                            typeof errors.proxyUser === 'string' && (
                              <div className="error">{errors.proxyUser}</div>
                            )}
                        </div>
                      </div>
                      <div className="form-row">
                        <label
                          htmlFor="proxyPassword"
                          className="checkbox-label"
                        >
                          {intl.formatMessage(messages.proxyPassword)}
                        </label>
                        <div className="form-input-area">
                          <div className="form-input-field">
                            <Field
                              id="proxyPassword"
                              name="proxyPassword"
                              type="password"
                            />
                          </div>
                          {errors.proxyPassword &&
                            touched.proxyPassword &&
                            typeof errors.proxyPassword === 'string' && (
                              <div className="error">
                                {errors.proxyPassword}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="form-row">
                        <label
                          htmlFor="proxyBypassFilter"
                          className="checkbox-label"
                        >
                          {intl.formatMessage(messages.proxyBypassFilter)}
                          <span className="label-tip">
                            {intl.formatMessage(messages.proxyBypassFilterTip)}
                          </span>
                        </label>
                        <div className="form-input-area">
                          <div className="form-input-field">
                            <Field
                              id="proxyBypassFilter"
                              name="proxyBypassFilter"
                              type="text"
                            />
                          </div>
                          {errors.proxyBypassFilter &&
                            touched.proxyBypassFilter &&
                            typeof errors.proxyBypassFilter === 'string' && (
                              <div className="error">
                                {errors.proxyBypassFilter}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="form-row">
                        <label
                          htmlFor="proxyBypassLocalAddresses"
                          className="checkbox-label"
                        >
                          {intl.formatMessage(
                            messages.proxyBypassLocalAddresses
                          )}
                        </label>
                        <div className="form-input-area">
                          <Field
                            type="checkbox"
                            id="proxyBypassLocalAddresses"
                            name="proxyBypassLocalAddresses"
                            onChange={() => {
                              setFieldValue(
                                'proxyBypassLocalAddresses',
                                !values.proxyBypassLocalAddresses
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
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

export default SettingsNetwork;
