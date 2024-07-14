interface JellyfinAuthenticationResult {
  Id: string;
  AccessToken: string;
  ServerId: string;
}

class JellyAPI {
  public login(
    Hostname?: string,
    Username?: string,
    Password?: string
  ): Promise<JellyfinAuthenticationResult> {
    return new Promise(
      (
        resolve: (result: JellyfinAuthenticationResult) => void,
        reject: (e: Error) => void
      ) => {
        fetch(Hostname + '/Users/AuthenticateByName', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Emby-Authorization':
              'MediaBrowser Client="Jellyfin Web", Device="Firefox", DeviceId="TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NDsgcnY6ODUuMCkgR2Vja28vMjAxMDAxMDEgRmlyZWZveC84NS4wfDE2MTI5MjcyMDM5NzM1", Version="10.8.0"',
          },
          body: JSON.stringify({
            Username: Username,
            Pw: Password,
          }),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error('Network response was not ok');
            }
            return res.json();
          })
          .then((data) => {
            const response: JellyfinAuthenticationResult = {
              Id: data.User.Id,
              AccessToken: data.AccessToken,
              ServerId: data.ServerId,
            };
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      }
    );
  }
}

export default JellyAPI;
