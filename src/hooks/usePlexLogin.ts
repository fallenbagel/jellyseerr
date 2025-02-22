import PlexOAuth from '@app/utils/plex';
import { useState } from 'react';

const plexOAuth = new PlexOAuth();

function usePlexLogin({
  onAuthToken,
  onError,
}: {
  onAuthToken: (authToken: string) => void;
  onError?: (err: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const getPlexLogin = async () => {
    setLoading(true);
    try {
      const authToken = await plexOAuth.login();
      setLoading(false);
      onAuthToken(authToken);
    } catch (e) {
      if (onError) {
        onError(e.message);
      }
      setLoading(false);
    }
  };

  const login = () => {
    plexOAuth.preparePopup();
    setTimeout(() => getPlexLogin(), 1500);
  };

  return { loading, login };
}

export default usePlexLogin;
