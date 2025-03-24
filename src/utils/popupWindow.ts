abstract class PopupWindow {
  protected popup?: Window;

  public abstract preparePopup(): Promise<void>;

  protected closePopup(): void {
    this.popup?.close();
    this.popup = undefined;
  }

  protected openPopup({
    title,
    path,
    w,
    h,
  }: {
    title: string;
    path?: string;
    w: number;
    h: number;
  }): Window | void {
    if (!window) {
      throw new Error(
        'Window is undefined. Are you running this in the browser?'
      );
    }
    // Fixes dual-screen position                         Most browsers      Firefox
    const dualScreenLeft =
      window.screenLeft != undefined ? window.screenLeft : window.screenX;
    const dualScreenTop =
      window.screenTop != undefined ? window.screenTop : window.screenY;
    const width = window.innerWidth
      ? window.innerWidth
      : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width;
    const height = window.innerHeight
      ? window.innerHeight
      : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height;
    const left = width / 2 - w / 2 + dualScreenLeft;
    const top = height / 2 - h / 2 + dualScreenTop;

    //Set url to login/popup/loading so browser doesn't block popup
    const newWindow = window.open(
      path || '/login/popup/loading',
      title,
      'scrollbars=yes, width=' +
        w +
        ', height=' +
        h +
        ', top=' +
        top +
        ', left=' +
        left
    );
    if (newWindow) {
      newWindow.focus();
      this.popup = newWindow;
      return this.popup;
    }
  }
}

export default PopupWindow;
