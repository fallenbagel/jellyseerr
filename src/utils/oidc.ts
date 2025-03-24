import PopupWindow from '@app/utils/popupWindow';
import axios from 'axios';

export async function processCallback(params: URLSearchParams) {
  return await axios
    .get('/api/v1/auth/oidc-callback', { params })
    .then((r) => ({
      type: 'success',
      message: r.data,
    }))
    .catch((e) => {
      if (e.response && e.response.data && e.response.data.message) {
        return {
          type: 'error',
          message: e.response.data.message,
        };
      } else {
        return {
          type: 'error',
          message: e.message,
        };
      }
    });
}

class OIDCAuth extends PopupWindow {
  public async preparePopup(): Promise<void> {
    this.openPopup({
      title: 'OIDC Auth',
      path: '/api/v1/auth/oidc-login',
      w: 600,
      h: 700,
    });

    return this.waitForLogin();
  }

  private async waitForLogin(): Promise<void> {
    return new Promise((resolve, reject) => {
      const handleEvent = (event: MessageEvent) => {
        // ensure same origin
        if (event.origin !== window.location.origin) return;

        const sourceWindow = event.source as Window;
        if (!sourceWindow.location.pathname.endsWith('/login/oidc/callback'))
          return;

        if (event.data && event.data.type) {
          // clean up the event handler
          window.removeEventListener('message', handleEvent);

          // check for success
          if (event.data.type == 'success') resolve();
          else if (event.data.type == 'error')
            reject(new Error(event.data.message));
        }
      };

      window.addEventListener('message', handleEvent);
    });
  }
}

export default OIDCAuth;
