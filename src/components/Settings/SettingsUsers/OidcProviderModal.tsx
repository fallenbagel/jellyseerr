import Modal from '@app/components/Common/Modal';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import useToasts from '@app/hooks/useToasts';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { Transition } from '@headlessui/react';
import type { OidcProvider } from '@server/lib/settings';
import axios from 'axios';
import { Field, Formik } from 'formik';
import { useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import * as Yup from 'yup';

const messages = defineMessages(
  'components.Settings.SettingsUsers.OidcProviderModal',
  {
    createProvider: 'Add New OpenID Connect Provider',
    add: 'Add Provider',
    editProvider: 'Edit OpenID Connect Provider',
    providerName: 'Provider Name',
    providerNameTip:
      'Shown on the login page (e.g. "Keycloak", "Authentik", "Pocket-ID")',
    slug: 'Slug',
    slugTip:
      'Unique identifier used in sign-in URLs (e.g. /api/v1/auth/oidc/login/my-provider)',
    issuerUrl: 'Issuer URL',
    issuerUrlTip:
      'Must match the issuer in the discovery document exactly (e.g. https://keycloak.example.com/realms/master)',
    clientId: 'Client ID',
    clientSecret: 'Client Secret',
    logo: 'Logo URL',
    logoTip: 'Optional image shown on the sign-in button',
    scopes: 'Scopes',
    scopesTip: 'Space-separated (default: openid profile email)',
    requiredClaims: 'Required Claims',
    requiredClaimsTip:
      'Space-separated ID token claims the user must satisfy (e.g. email_verified)',
    newUserLogin: 'Allow New User Sign-In',
    newUserLoginTip: 'Create a new account for first-time users',
    validationNameRequired: 'You must provide a provider name',
    validationSlugRequired: 'You must provide a slug',
    validationSlugInvalid:
      'Slug may only contain letters, numbers, hyphens, and underscores, and must start with a letter or number',
    validationSlugDuplicate: 'A provider with this slug already exists',
    validationIssuerUrlRequired: 'You must provide an issuer URL',
    validationIssuerUrlInvalid: 'You must provide a valid issuer URL',
    validationClientIdRequired: 'You must provide a client ID',
    validationClientSecretRequired: 'You must provide a client secret',
    toastTestSuccess: 'Provider discovery succeeded!',
    toastTestFailure: 'Failed to connect to the provider.',
    toastSaveFailure: 'Something went wrong while saving the provider.',
  }
);

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

interface OidcProviderModalProps {
  provider: OidcProvider | null;
  providers: OidcProvider[];
  onClose: () => void;
  onSaved: () => void;
}

const OidcProviderModal = ({
  provider,
  providers,
  onClose,
  onSaved,
}: OidcProviderModalProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const [isTesting, setIsTesting] = useState(false);
  const slugManuallyEdited = useRef(provider != null);

  const OidcProviderSchema = Yup.object().shape({
    name: Yup.string().required(
      intl.formatMessage(messages.validationNameRequired)
    ),
    slug: Yup.string()
      .required(intl.formatMessage(messages.validationSlugRequired))
      .matches(
        /^[a-zA-Z0-9][a-zA-Z0-9-_]*$/,
        intl.formatMessage(messages.validationSlugInvalid)
      )
      .test(
        'slug-unique',
        intl.formatMessage(messages.validationSlugDuplicate),
        (value) =>
          !value ||
          !providers.some((p) => p.slug === value && p.slug !== provider?.slug)
      ),
    issuerUrl: Yup.string()
      .required(intl.formatMessage(messages.validationIssuerUrlRequired))
      .url(intl.formatMessage(messages.validationIssuerUrlInvalid)),
    clientId: Yup.string().required(
      intl.formatMessage(messages.validationClientIdRequired)
    ),
    clientSecret: Yup.string().required(
      intl.formatMessage(messages.validationClientSecretRequired)
    ),
  });

  const testConnection = useCallback(
    async ({
      issuerUrl,
      clientId,
      clientSecret,
    }: {
      issuerUrl: string;
      clientId: string;
      clientSecret: string;
    }) => {
      setIsTesting(true);
      try {
        await axios.post('/api/v1/settings/oidc/test', {
          issuerUrl,
          clientId,
          clientSecret,
        });

        addToast(intl.formatMessage(messages.toastTestSuccess), {
          appearance: 'success',
          autoDismiss: true,
        });
      } catch {
        addToast(intl.formatMessage(messages.toastTestFailure), {
          appearance: 'error',
          autoDismiss: true,
        });
      } finally {
        setIsTesting(false);
      }
    },
    [addToast, intl]
  );

  return (
    <Transition
      as="div"
      appear
      show
      enter="transition-opacity ease-in-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity ease-in-out duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Formik
        initialValues={{
          name: provider?.name ?? '',
          slug: provider?.slug ?? '',
          issuerUrl: provider?.issuerUrl ?? '',
          clientId: provider?.clientId ?? '',
          clientSecret: provider?.clientSecret ?? '',
          logo: provider?.logo ?? '',
          scopes: provider?.scopes ?? '',
          requiredClaims: provider?.requiredClaims ?? '',
          newUserLogin: provider?.newUserLogin ?? false,
        }}
        validationSchema={OidcProviderSchema}
        onSubmit={async (values) => {
          const newProvider: OidcProvider = {
            slug: values.slug,
            name: values.name,
            issuerUrl: values.issuerUrl,
            clientId: values.clientId,
            clientSecret: values.clientSecret,
            ...(values.logo ? { logo: values.logo } : {}),
            ...(values.requiredClaims
              ? { requiredClaims: values.requiredClaims }
              : {}),
            ...(values.scopes ? { scopes: values.scopes } : {}),
            newUserLogin: values.newUserLogin,
          };

          try {
            await axios.post('/api/v1/settings/oidc', {
              providers: providers
                .filter((p) => p.slug !== values.slug)
                .concat(newProvider),
            });
            onSaved();
          } catch {
            addToast(intl.formatMessage(messages.toastSaveFailure), {
              appearance: 'error',
              autoDismiss: true,
            });
          }
        }}
      >
        {({
          errors,
          touched,
          values,
          handleSubmit,
          setFieldValue,
          isSubmitting,
          isValid,
        }) => (
          <Modal
            onCancel={onClose}
            okButtonType="primary"
            okText={
              isSubmitting
                ? intl.formatMessage(globalMessages.saving)
                : provider
                  ? intl.formatMessage(globalMessages.save)
                  : intl.formatMessage(messages.add)
            }
            secondaryButtonType="warning"
            secondaryText={
              isTesting
                ? intl.formatMessage(globalMessages.testing)
                : intl.formatMessage(globalMessages.test)
            }
            onSecondary={() => {
              if (values.issuerUrl && values.clientId && values.clientSecret) {
                testConnection({
                  issuerUrl: values.issuerUrl,
                  clientId: values.clientId,
                  clientSecret: values.clientSecret,
                });
              }
            }}
            secondaryDisabled={
              !values.issuerUrl ||
              !values.clientId ||
              !values.clientSecret ||
              isTesting ||
              isSubmitting
            }
            okDisabled={isSubmitting || !isValid}
            onOk={() => handleSubmit()}
            title={
              provider
                ? intl.formatMessage(messages.editProvider)
                : intl.formatMessage(messages.createProvider)
            }
          >
            <div className="mb-6">
              <div className="form-row">
                <label htmlFor="name" className="text-label">
                  {intl.formatMessage(messages.providerName)}
                  <span className="label-required">*</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.providerNameTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="off"
                      data-form-type="other"
                      data-1pignore="true"
                      data-lpignore="true"
                      data-bwignore="true"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFieldValue('name', e.target.value);
                        if (!slugManuallyEdited.current) {
                          setFieldValue('slug', slugify(e.target.value));
                        }
                      }}
                    />
                  </div>
                  {errors.name && touched.name && (
                    <div className="error">{errors.name}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="slug" className="text-label">
                  {intl.formatMessage(messages.slug)}
                  <span className="label-required">*</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.slugTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field
                      id="slug"
                      name="slug"
                      type="text"
                      autoComplete="off"
                      data-form-type="other"
                      data-1pignore="true"
                      data-lpignore="true"
                      data-bwignore="true"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        slugManuallyEdited.current = true;
                        setFieldValue('slug', e.target.value);
                      }}
                    />
                  </div>
                  {errors.slug && touched.slug && (
                    <div className="error">{errors.slug}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="issuerUrl" className="text-label">
                  {intl.formatMessage(messages.issuerUrl)}
                  <span className="label-required">*</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.issuerUrlTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field
                      id="issuerUrl"
                      name="issuerUrl"
                      type="text"
                      inputMode="url"
                    />
                  </div>
                  {errors.issuerUrl && touched.issuerUrl && (
                    <div className="error">{errors.issuerUrl}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="clientId" className="text-label">
                  {intl.formatMessage(messages.clientId)}
                  <span className="label-required">*</span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field
                      id="clientId"
                      name="clientId"
                      type="text"
                      autoComplete="off"
                      data-form-type="other"
                      data-1pignore="true"
                      data-lpignore="true"
                      data-bwignore="true"
                    />
                  </div>
                  {errors.clientId && touched.clientId && (
                    <div className="error">{errors.clientId}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="clientSecret" className="text-label">
                  {intl.formatMessage(messages.clientSecret)}
                  <span className="label-required">*</span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <SensitiveInput
                      as="field"
                      id="clientSecret"
                      name="clientSecret"
                    />
                  </div>
                  {errors.clientSecret && touched.clientSecret && (
                    <div className="error">{errors.clientSecret}</div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="logo" className="text-label">
                  {intl.formatMessage(messages.logo)}
                  <span className="label-tip">
                    {intl.formatMessage(messages.logoTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field id="logo" name="logo" type="text" inputMode="url" />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="scopes" className="text-label">
                  {intl.formatMessage(messages.scopes)}
                  <span className="label-tip">
                    {intl.formatMessage(messages.scopesTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field
                      id="scopes"
                      name="scopes"
                      type="text"
                      placeholder="openid profile email"
                    />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="requiredClaims" className="text-label">
                  {intl.formatMessage(messages.requiredClaims)}
                  <span className="label-tip">
                    {intl.formatMessage(messages.requiredClaimsTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <div className="form-input-field">
                    <Field
                      id="requiredClaims"
                      name="requiredClaims"
                      type="text"
                      placeholder="email_verified"
                    />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="newUserLogin" className="checkbox-label">
                  {intl.formatMessage(messages.newUserLogin)}
                  <span className="label-tip">
                    {intl.formatMessage(messages.newUserLoginTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <Field
                    type="checkbox"
                    id="newUserLogin"
                    name="newUserLogin"
                  />
                </div>
              </div>
            </div>
          </Modal>
        )}
      </Formik>
    </Transition>
  );
};

export default OidcProviderModal;
