import PopupWindow from '@app/utils/popupWindow';

export async function processCallback(params: URLSearchParams) {
  try {
    const response = await fetch(
      `/api/v1/auth/oidc-callback?${params.toString()}`
    );

    if (!response.ok) {
      const data = await response.json();
      return {
        type: 'error',
        message: data.message || response.statusText,
      };
    }

    const data = await response.json();
    return {
      type: 'success',
      message: data,
    };
  } catch (e) {
    return {
      type: 'error',
      message: e.message,
    };
  }
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
