import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import LoginError from '@app/components/Login/ErrorCallout';
import { processCallback } from '@app/utils/oidc';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const OidcCallback = () => {
  const router = useRouter();

  const login = async () => {
    const params = new URLSearchParams(window.location.search);
    const result = await processCallback(params);

    // is popup window
    if (window.opener && window.opener !== window) {
      // send result to the opening window
      window.opener.postMessage(
        result,
        `${window.location.protocol}//${window.location.host}`
      );
      // close the popup
      window.close();
    } else {
      if (result.type === 'success') {
        // redirect to homepage
        router.push('/');
      } else {
        // display login error
        setError(result.message);
      }
    }
  };

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    login();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto flex h-screen items-center justify-center">
      {error != null ? (
        <LoginError error={error}></LoginError>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};

export default OidcCallback;
