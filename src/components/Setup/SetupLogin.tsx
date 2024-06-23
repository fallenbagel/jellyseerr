import Accordion from '@app/components/Common/Accordion';
import JellyfinLogin from '@app/components/Login/JellyfinLogin';
import PlexLoginButton from '@app/components/PlexLoginButton';
import { useUser } from '@app/hooks/useUser';
import defineMessages from '@app/utils/defineMessages';
import { MediaServerType } from '@server/constants/server';
import axios from 'axios';
import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const messages = defineMessages('components.Setup', {
  welcome: 'Welcome to Jellyseerr',
  signinMessage: 'Get started by signing in',
  signinWithJellyfin: 'Use your {mediaServerName} account',
  signinWithPlex: 'Use your Plex account',
});

interface LoginWithMediaServerProps {
  onComplete: (onComplete: MediaServerType) => void;
}

const SetupLogin: React.FC<LoginWithMediaServerProps> = ({ onComplete }) => {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const [mediaServerType, setMediaServerType] = useState<MediaServerType>(
    MediaServerType.NOT_CONFIGURED
  );
  const { user, revalidate } = useUser();
  const intl = useIntl();
  const { publicRuntimeConfig } = getConfig();
  // Effect that is triggered when the `authToken` comes back from the Plex OAuth
  // We take the token and attempt to login. If we get a success message, we will
  // ask swr to revalidate the user which _shouid_ come back with a valid user.

  useEffect(() => {
    const login = async () => {
      const response = await axios.post('/api/v1/auth/plex', {
        authToken: authToken,
      });

      if (response.data?.email) {
        revalidate();
      }
    };
    if (authToken && mediaServerType == MediaServerType.PLEX) {
      login();
    }
  }, [authToken, mediaServerType, revalidate]);

  useEffect(() => {
    if (user) {
      onComplete(mediaServerType);
    }
  }, [user, mediaServerType, onComplete]);

  return (
    <div>
      <div className="mb-2 flex justify-center text-xl font-bold">
        <FormattedMessage {...messages.welcome} />
      </div>
      <div className="mb-2 flex justify-center pb-6 text-sm">
        <FormattedMessage {...messages.signinMessage} />
      </div>
      <Accordion single atLeastOne>
        {({ openIndexes, handleClick, AccordionContent }) => (
          <>
            <button
              className={`w-full cursor-default bg-gray-900 py-2 text-center text-sm text-gray-400 transition-colors duration-200 hover:cursor-pointer hover:bg-gray-700 focus:outline-none sm:rounded-t-lg ${
                openIndexes.includes(0) && 'text-indigo-500'
              } ${openIndexes.includes(1) && 'border-b border-gray-500'}`}
              onClick={() => handleClick(0)}
            >
              <FormattedMessage {...messages.signinWithPlex} />
            </button>
            <AccordionContent isOpen={openIndexes.includes(0)}>
              <div
                className="px-10 py-8"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <PlexLoginButton
                  onAuthToken={(authToken) => {
                    setMediaServerType(MediaServerType.PLEX);
                    setAuthToken(authToken);
                  }}
                />
              </div>
            </AccordionContent>
            <div>
              <button
                className={`w-full cursor-default bg-gray-900 py-2 text-center text-sm text-gray-400 transition-colors duration-200 hover:cursor-pointer hover:bg-gray-700 focus:outline-none ${
                  openIndexes.includes(1)
                    ? 'text-indigo-500'
                    : 'sm:rounded-b-lg'
                }`}
                onClick={() => handleClick(1)}
              >
                {publicRuntimeConfig.JELLYFIN_TYPE == 'emby'
                  ? intl.formatMessage(messages.signinWithJellyfin, {
                      mediaServerName: 'Emby',
                    })
                  : intl.formatMessage(messages.signinWithJellyfin, {
                      mediaServerName: 'Jellyfin',
                    })}
              </button>
              <AccordionContent isOpen={openIndexes.includes(1)}>
                <div
                  className="rounded-b-lg px-10 py-8"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                  <JellyfinLogin initial={true} revalidate={revalidate} />
                </div>
              </AccordionContent>
            </div>
          </>
        )}
      </Accordion>
    </div>
  );
};

export default SetupLogin;
