import useSettings from '@app/hooks/useSettings';
import type { ImageLoader, ImageProps } from 'next/image';
import Image from 'next/image';

const imageLoader: ImageLoader = ({ src }) => src;

/**
 * The CachedImage component should be used wherever
 * we want to offer the option to locally cache images.
 **/
const CachedImage = ({ src, ...props }: ImageProps) => {
  const { currentSettings } = useSettings();

  let imageUrl = src;

  if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
    const parsedUrl = new URL(imageUrl);

    if (parsedUrl.host === 'image.tmdb.org') {
      if (currentSettings.cacheImages)
        imageUrl = imageUrl.replace('https://image.tmdb.org', '/imageproxy');
    } else if (parsedUrl.host !== 'gravatar.com') {
      imageUrl = '/avatarproxy/' + imageUrl;
    }
  }

  return <Image unoptimized loader={imageLoader} src={imageUrl} {...props} />;
};

export default CachedImage;
