import { ApiErrorCode } from '@server/constants/error';
import { getRepository } from '@server/datasource';
import { LinkedAccount } from '@server/entity/LinkedAccount';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';
import * as openIdClient from 'openid-client';
import { In, Not } from 'typeorm';
import { z } from 'zod';

const oidcRoutes = Router();

// Slug is used as a URL path parameter and in correlation cookie names, so it
// must stay URL- and cookie-safe.
const oidcProviderSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_]{0,63}$/, {
      message: 'Slug must be alphanumeric (hyphens/underscores allowed).',
    }),
  name: z.string().trim().min(1, { message: 'Name is required.' }),
  issuerUrl: z.url({ message: 'A valid issuer URL is required.' }),
  clientId: z.string().trim().min(1, { message: 'Client ID is required.' }),
  clientSecret: z.string().min(1, { message: 'Client secret is required.' }),
  logo: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  requiredClaims: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  scopes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  newUserLogin: z.boolean().optional(),
});

const oidcSettingsSchema = z.object({
  providers: z
    .array(oidcProviderSchema)
    .refine(
      (providers) =>
        new Set(providers.map((p) => p.slug.toLowerCase())).size ===
        providers.length,
      { message: 'Provider slugs must be unique.' }
    ),
});

oidcRoutes.get('/', (_req, res) => {
  const settings = getSettings();

  return res.status(200).json(settings.oidc);
});

oidcRoutes.post('/', async (req, res, next) => {
  const settings = getSettings();
  const bodyResult = oidcSettingsSchema.safeParse(req.body);

  if (!bodyResult.success) {
    return next({
      status: 400,
      message: bodyResult.error.issues[0]?.message ?? 'Invalid request body.',
    });
  }

  settings.oidc.providers = bodyResult.data.providers;
  await settings.save();

  // Linked accounts for providers that no longer exist cannot be used to
  // sign in, so clean them up instead of leaving orphaned rows behind.
  const linkedAccountsRepository = getRepository(LinkedAccount);
  const slugs = settings.oidc.providers.map((p) => p.slug);
  if (slugs.length === 0) {
    await linkedAccountsRepository.clear();
  } else {
    await linkedAccountsRepository.delete({
      provider: Not(In(slugs)),
    });
  }

  return res.status(200).json(settings.oidc);
});

const oidcTestSchema = oidcProviderSchema.pick({
  issuerUrl: true,
  clientId: true,
  clientSecret: true,
});

oidcRoutes.post('/test', async (req, res, next) => {
  const bodyResult = oidcTestSchema.safeParse(req.body);

  if (!bodyResult.success) {
    return next({
      status: 400,
      message: bodyResult.error.issues[0]?.message ?? 'Invalid request body.',
    });
  }

  const { issuerUrl, clientId, clientSecret } = bodyResult.data;

  try {
    await openIdClient.discovery(
      new URL(issuerUrl),
      clientId,
      clientSecret,
      undefined,
      {
        execute:
          process.env.OIDC_ALLOW_INSECURE === 'true'
            ? [openIdClient.allowInsecureRequests]
            : [],
      }
    );
  } catch (error) {
    logger.error('Failed OIDC provider discovery test', {
      label: 'Settings',
      issuerUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return next({
      status: 500,
      message: ApiErrorCode.OidcProviderDiscoveryFailed,
    });
  }

  return res.status(200).json({ success: true });
});

export default oidcRoutes;
