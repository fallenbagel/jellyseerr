/* eslint-disable no-console */
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import { useEffect } from 'react';

const ServiceWorkerSetup = () => {
  const { currentSettings } = useSettings();
  const { user } = useUser();
  useEffect(() => {
    if ('serviceWorker' in navigator && user?.id) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          console.log(
            '[SW] Registration successful, scope is:',
            registration.scope
          );

          if (currentSettings.enablePushRegistration) {
            const sub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: currentSettings.vapidPublic,
            });

            const parsedSub = JSON.parse(JSON.stringify(sub));

            if (parsedSub.keys.p256dh && parsedSub.keys.auth) {
              const res = await fetch('/api/v1/user/registerPushSubscription', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  endpoint: parsedSub.endpoint,
                  p256dh: parsedSub.keys.p256dh,
                  auth: parsedSub.keys.auth,
                }),
              });
              if (!res.ok) throw new Error();
            }
          }
        })
        .catch(function (error) {
          console.log('[SW] Service worker registration failed, error:', error);
        });
    }
  }, [
    user,
    currentSettings.vapidPublic,
    currentSettings.enablePushRegistration,
  ]);
  return null;
};

export default ServiceWorkerSetup;
