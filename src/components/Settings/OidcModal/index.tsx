import React, { useEffect } from 'react';
import Accordion from '@app/components/Common/Accordion';
import Modal from '@app/components/Common/Modal';
import globalMessages from '@app/i18n/globalMessages';
import { Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import type { MainSettings } from '@server/lib/settings';
import {
  ErrorMessage,
  type FormikErrors,
} from 'formik';
import {
  defineMessages,
  useIntl,
  type IntlShape,
  type MessageDescriptor,
} from 'react-intl';
import * as yup from 'yup';

const messages = defineMessages({
  configureoidc: {
    id: 'settings.oidc.configureoidc',
    defaultMessage: 'Configure OpenID Connect'
  },
  oidcDomain: {
    id: 'settings.oidc.domain',
    defaultMessage: 'Issuer URL'
  },
  oidcDomainTip: {
    id: 'settings.oidc.domainTip',
    defaultMessage: "The base URL of the identity provider's OIDC endpoint"
  },
  oidcName: {
    id: 'settings.oidc.name',
    defaultMessage: 'Provider Name'
  },
  oidcNameTip: {
    id: 'settings.oidc.nameTip',
    defaultMessage: 'Name of the OIDC Provider which appears on the login screen'
  },
  oidcClientId: {
    id: 'settings.oidc.clientId',
    defaultMessage: 'Client ID'
  },
  oidcClientIdTip: {
    id: 'settings.oidc.clientIdTip',
    defaultMessage: 'The OIDC Client ID assigned to Jellyseerr'
  },
  oidcClientSecret: {
    id: 'settings.oidc.clientSecret',
    defaultMessage: 'Client Secret'
  },
  oidcClientSecretTip: {
    id: 'settings.oidc.clientSecretTip',
    defaultMessage: 'The OIDC Client Secret assigned to Jellyseerr'
  },
  oidcScopes: {
    id: 'settings.oidc.scopes',
    defaultMessage: 'Scopes'
  },
  oidcScopesTip: {
    id: 'settings.oidc.scopesTip',
    defaultMessage: 'The scopes to request from the identity provider.'
  },
  oidcIdentificationClaims: {
    id: 'settings.oidc.identificationClaims',
    defaultMessage: 'Identification Claims'
  },
  oidcIdentificationClaimsTip: {
    id: 'settings.oidc.identificationClaimsTip',
    defaultMessage: 'OIDC claims to use as unique identifiers for the given user. Will be matched against the user\'s email and, optionally, their media server username.'
  },
  oidcRequiredClaims: {
    id: 'settings.oidc.requiredClaims',
    defaultMessage: 'Required Claims'
  },
  oidcRequiredClaimsTip: {
    id: 'settings.oidc.requiredClaimsTip',
    defaultMessage: 'Claims that are required for a user to log in.'
  },
  oidcMatchUsername: {
    id: 'settings.oidc.matchUsername',
    defaultMessage: 'Allow {mediaServerName} Usernames'
  },
  oidcMatchUsernameTip: {
    id: 'settings.oidc.matchUsernameTip',
    defaultMessage: 'Match OIDC users with their {mediaServerName} accounts by username'
  },
  oidcAutomaticLogin: {
    id: 'settings.oidc.automaticLogin',
    defaultMessage: 'Automatic Login'
  },
  oidcAutomaticLoginTip: {
    id: 'settings.oidc.automaticLoginTip',
    defaultMessage: 'Automatically navigate to the OIDC login and logout pages. This functionality only supported when OIDC is the exclusive login method.'
  },
});

type OidcSettings = MainSettings['oidc'];

interface OidcModalProps {
  values: Partial<OidcSettings>;
  errors?: FormikErrors<OidcSettings>;
  setFieldValue: (
    field: keyof OidcSettings,
    value: string | boolean,
    shouldValidate?: boolean
  ) => void;
  mediaServerName: string;
  onClose?: () => void;
  onOk?: () => void;
}

export const oidcSettingsSchema = (intl: IntlShape) => {
  const requiredMessage = (message: MessageDescriptor) =>
    intl.formatMessage(globalMessages.fieldRequired, {
      fieldName: intl.formatMessage(message),
    });

  return yup.object().shape({
    providerName: yup.string().required(requiredMessage(messages.oidcName)),
    providerUrl: yup
      .string()
      .required(requiredMessage(messages.oidcDomain))
      .url('Issuer URL must be a valid URL.')
      .test({
        message: 'Issuer URL may not have search parameters.',
        test: (val) => {
          if (!val) return false;
          try {
            const url = new URL(val);
            return url.search === '';
          } catch {
            return false;
          }
        },
      })
      .test({
        message: 'Issuer URL protocol must be http / https.',
        test: (val) => {
          if (!val) return false;
          try {
            const url = new URL(val);
            return ['http:', 'https:'].includes(url.protocol);
          } catch {
            return false;
          }
        },
      }),
    clientId: yup.string().required(requiredMessage(messages.oidcClientId)),
    clientSecret: yup
      .string()
      .required(requiredMessage(messages.oidcClientSecret)),
    scopes: yup.string().required(requiredMessage(messages.oidcScopes)),
    userIdentifier: yup
      .string()
      .required(requiredMessage(messages.oidcIdentificationClaims)),
    requiredClaims: yup.string().required(requiredMessage(messages.oidcRequiredClaims)),
    matchJellyfinUsername: yup.boolean(),
    automaticLogin: yup.boolean(),
  });
};

type OidcAction =
  | { type: 'UPDATE_ALL'; payload: Partial<OidcSettings> }
  | { type: 'UPDATE_FIELD'; field: keyof OidcSettings; value: string | boolean };

function oidcReducer(state: OidcSettings, action: OidcAction): OidcSettings {
  switch (action.type) {
    case 'UPDATE_ALL':
      return {
        ...state,
        ...action.payload
      };
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value
      };
    default:
      return state;
  }
}

const OidcModal = ({
  onClose,
  onOk,
  values,
  errors,
  setFieldValue,
  mediaServerName,
}: OidcModalProps) => {
  const intl = useIntl();

  // Replace useState with useReducer
  const [localValues, dispatch] = React.useReducer(oidcReducer, {
    providerUrl: values.providerUrl ?? '',
    providerName: values.providerName ?? '',
    clientId: values.clientId ?? '',
    clientSecret: values.clientSecret ?? '',
    scopes: values.scopes ?? 'email openid profile',
    userIdentifier: values.userIdentifier ?? 'email',
    requiredClaims: values.requiredClaims ?? 'email_verified',
    matchJellyfinUsername: values.matchJellyfinUsername ?? false,
    automaticLogin: values.automaticLogin ?? false
  });

  // Update effect to use reducer
  useEffect(() => {
    dispatch({ type: 'UPDATE_ALL', payload: values });
  }, [values]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch({ type: 'UPDATE_FIELD', field: name as keyof OidcSettings, value });
    setFieldValue(name as keyof OidcSettings, value, true);
  };

  const handleCheckboxChange = (name: keyof OidcSettings) => {
    const newValue = !localValues[name];
    dispatch({ type: 'UPDATE_FIELD', field: name, value: newValue });
    setFieldValue(name, newValue, true);
  };

  const canClose = (errors: OidcModalProps['errors']) => {
    if (errors == null) return true;
    return Object.keys(errors).length === 0;
  };

  // Move handleSubmit inside component if needed
  const handleSubmit = async (data: OidcSettings): Promise<OidcResponse> => {
    try {
      const response = await fetch('/api/v1/settings/main', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oidc: data,
          oidcLogin: true
        }),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save OIDC settings'
      };
    }
  };

  // Use handleSubmit in onOk if needed
  const handleOk = async () => {
    if (onOk) {
      const response = await handleSubmit(localValues);
      if (response.success) {
        onOk();
      }
    }
  };

  return (
    <Transition.Root show={true}>
      <Transition.Child
        as="div"
        enter="transition-opacity ease-in-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in-out duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Modal
          onCancel={onClose}
          okButtonType="primary"
          okDisabled={!canClose(errors)}
          okText={intl.formatMessage(globalMessages.done)}
          onOk={handleOk}
          title={intl.formatMessage(messages.configureoidc)}
        >
          <div className="mb-6 overflow-auto md:max-h-[75vh]">
            <div className="px-3">
              <div className="form-row">
                <label htmlFor="oidcDomain" className="text-label">
                  {intl.formatMessage(messages.oidcDomain)}
                  <span className="label-required">*</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.oidcDomainTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  {/* Replace Field with a controlled input */}
                  <input
                    id="oidcDomain"
                    name="providerUrl"
                    type="text"
                    value={localValues.providerUrl}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <ErrorMessage
                    className="error"
                    component="span"
                    name="providerUrl"
                  />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="oidcName" className="text-label">
                  {intl.formatMessage(messages.oidcName)}
                  <span className="label-required">*</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.oidcNameTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <input
                    id="oidcName"
                    name="providerName"
                    type="text"
                    value={localValues.providerName}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <ErrorMessage
                    className="error"
                    component="span"
                    name="providerName"
                  />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="oidcClientId" className="text-label">
                  {intl.formatMessage(messages.oidcClientId)}
                  <span className="label-required">*</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.oidcClientIdTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <input
                    id="oidcClientId"
                    name="clientId"
                    type="text"
                    value={localValues.clientId}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <ErrorMessage
                    className="error"
                    component="span"
                    name="clientId"
                  />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="oidcClientSecret" className="text-label">
                  {intl.formatMessage(messages.oidcClientSecret)}
                  <span className="label-required">*</span>
                  <span className="label-tip">
                    {intl.formatMessage(messages.oidcClientSecretTip)}
                  </span>
                </label>
                <div className="form-input-area">
                  <input
                    id="oidcClientSecret"
                    name="clientSecret"
                    type="text"
                    value={localValues.clientSecret}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <ErrorMessage
                    className="error"
                    component="span"
                    name="clientSecret"
                  />
                </div>
              </div>
            </div>
            <Accordion single>
              {({ openIndexes, handleClick, AccordionContent }) => (
                <>
                  <button
                    className={`mt-4 flex w-full cursor-pointer justify-between rounded-md bg-opacity-70 p-3 text-gray-400 hover:bg-gray-700 ${
                      openIndexes.includes(0) ? 'bg-gray-700' : ''
                    }`}
                    onClick={() => handleClick(0)}
                  >
                    <span className="text-md font-semibold">Advanced</span>
                    <ChevronDownIcon
                      width={20}
                      className={` transition-transform duration-200 ${
                        openIndexes.includes(0) ? 'rotate-0' : 'rotate-90'
                      }`}
                    />
                  </button>
                  <AccordionContent isOpen={openIndexes.includes(0)}>
                    <div className="px-3">
                      <div className="form-row">
                        <label htmlFor="oidcScopes" className="text-label">
                          {intl.formatMessage(messages.oidcScopes)}
                          <span className="label-required">*</span>
                          <span className="label-tip">
                            {intl.formatMessage(messages.oidcScopesTip)}
                          </span>
                        </label>
                        <div className="form-input-area">
                          <input
                            id="oidcScopes"
                            name="scopes"
                            type="text"
                            value={localValues.scopes}
                            onChange={handleInputChange}
                            className="w-full"
                          />
                          <ErrorMessage
                            className="error"
                            component="span"
                            name="scopes"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <label
                          htmlFor="oidcIdentificationClaims"
                          className="text-label"
                        >
                          {intl.formatMessage(messages.oidcIdentificationClaims)}
                          <span className="label-required">*</span>
                          <span className="label-tip">
                            {intl.formatMessage(
                              messages.oidcIdentificationClaimsTip
                            )}
                          </span>
                        </label>
                        <div className="form-input-area">
                          <input
                            id="oidcIdentificationClaims"
                            name="userIdentifier"
                            type="text"
                            value={localValues.userIdentifier}
                            onChange={handleInputChange}
                            className="w-full"
                          />
                          <ErrorMessage
                            className="error"
                            component="span"
                            name="userIdentifier"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <label
                          htmlFor="oidcRequiredClaims"
                          className="text-label"
                        >
                          {intl.formatMessage(messages.oidcRequiredClaims)}
                          <span className="label-required">*</span>
                          <span className="label-tip">
                            {intl.formatMessage(messages.oidcRequiredClaimsTip)}
                          </span>
                        </label>
                        <div className="form-input-area">
                          <input
                            id="oidcRequiredClaims"
                            name="requiredClaims"
                            type="text"
                            value={localValues.requiredClaims}
                            onChange={handleInputChange}
                            className="w-full"
                          />
                          <ErrorMessage
                            className="error"
                            component="span"
                            name="requiredClaims"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <label
                          htmlFor="oidcMatchUsername"
                          className="checkbox-label"
                        >
                          {intl.formatMessage(messages.oidcMatchUsername, {
                            mediaServerName,
                          })}
                          <span className="label-tip">
                            {intl.formatMessage(messages.oidcMatchUsernameTip, {
                              mediaServerName,
                            })}
                          </span>
                        </label>
                        <div className="form-input-area">
                          <input
                            type="checkbox"
                            id="oidcMatchUsername"
                            name="matchJellyfinUsername"
                            checked={localValues.matchJellyfinUsername}
                            onChange={() => handleCheckboxChange('matchJellyfinUsername')}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <label
                          htmlFor="oidcAutomaticLogin"
                          className="checkbox-label"
                        >
                          {intl.formatMessage(messages.oidcAutomaticLogin)}
                          <span className="label-tip">
                            {intl.formatMessage(messages.oidcAutomaticLoginTip)}
                          </span>
                        </label>
                        <div className="form-input-area">
                          <input
                            type="checkbox"
                            id="oidcAutomaticLogin"
                            name="automaticLogin"
                            checked={localValues.automaticLogin}
                            onChange={() => handleCheckboxChange('automaticLogin')}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </>
              )}
            </Accordion>
          </div>
        </Modal>
      </Transition.Child>
    </Transition.Root>
  );
};

export default OidcModal;

interface OidcResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}
