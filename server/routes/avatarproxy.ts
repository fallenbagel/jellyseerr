import ImageProxy from '@server/lib/imageproxy';
import logger from '@server/logger';
import { Router } from 'express';

const router = Router();

const avatarImageProxy = new ImageProxy('avatar', '');
// Proxy avatar images
router.get('/*', async (req, res) => {
  const imagePath = req.url.startsWith('/') ? req.url.slice(1) : req.url;

  try {
    const imageData = await avatarImageProxy.getImage(imagePath);

    res.writeHead(200, {
      'Content-Type': `image/${imageData.meta.extension}`,
      'Content-Length': imageData.imageBuffer.length,
      'Cache-Control': `public, max-age=${imageData.meta.curRevalidate}`,
      'OS-Cache-Key': imageData.meta.cacheKey,
      'OS-Cache-Status': imageData.meta.cacheMiss ? 'MISS' : 'HIT',
    });

    res.end(imageData.imageBuffer);
  } catch (e) {
    logger.error('Failed to proxy avatar image', {
      imagePath,
      errorMessage: e.message,
    });
  }
});

export default router;
