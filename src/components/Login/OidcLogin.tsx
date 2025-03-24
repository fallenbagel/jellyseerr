import Button from '@app/components/Common/Button';
import useSettings from '@app/hooks/useSettings';
import globalMessages from '@app/i18n/globalMessages';
import OIDCAuth from '@app/utils/oidc';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

// Modify the messages definition to include proper IDs
const messages = defineMessages({
  signinwithoidc: {
    id: 'components.Login.signinwithoidc',
    defaultMessage: 'Sign in with {OIDCProvider}'
  },
  signingin: {
    id: 'components.Login.signingin',
    defaultMessage: 'Signing in…'
  },
  loginerror: {
    id: 'components.Login.loginerror',
    defaultMessage: 'Something went wrong while trying to sign in.'
  }
});

interface OidcLoginProps {
  revalidate: () => void;
  isProcessing: boolean;
  setProcessing: (state: boolean) => void;
  hasError: boolean;
  onError: (message: string) => void;
}

const oidcAuth = new OIDCAuth();

const OidcLogin = ({
  revalidate,
  isProcessing,
  setProcessing,
  hasError,
  onError,
}: OidcLoginProps) => {
  const intl = useIntl();
  const settings = useSettings();

  useEffect(() => {
    const { oidcLogin, oidcAutomaticLogin } = settings.currentSettings;
    if (oidcLogin && oidcAutomaticLogin)
      // redirect to login page
      window.location.href = '/api/v1/auth/oidc-login';
  }, [settings.currentSettings]);

  const handleClick = async () => {
    setProcessing(true);
    try {
      await oidcAuth.preparePopup();
      revalidate();
    } catch (e) {
      let message = 'Unknown Error';
      if (e instanceof Error) message = e.message;
      onError(message);
      setProcessing(false);
      return;
    }
  };

  return (
    <span className="block w-full rounded-md shadow-sm">
      <Button
        buttonType="primary"
        className="w-full"
        onClick={handleClick}
        disabled={isProcessing || hasError}
      >
        <ArrowLeftOnRectangleIcon />
        <span>
          {isProcessing
            ? intl.formatMessage(globalMessages.loading)
            : intl.formatMessage(messages.signinwithoidc, {
                OIDCProvider: settings.currentSettings.oidcProviderName || 'SSO',
              })}
        </span>
      </Button>
    </span>
  );
};

export default OidcLogin;
