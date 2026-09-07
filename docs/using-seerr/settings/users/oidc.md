---
title: OpenID Connect
description: Configure OpenID Connect settings.
sidebar_position: 2.5
---

# OpenID Connect

Seerr supports OpenID Connect (OIDC) for authentication and authorization.

## Configuring Providers

Providers are configured from the web UI under **Settings** → **Users**:

1. Enable **OpenID Connect Sign-In** under **Login Methods** and save.
2. Under **OpenID Connect Providers**, click **Add Provider** and fill in the provider details (name, issuer URL, client ID, and client secret at minimum).
3. Use the **Test** button to verify that Seerr can reach the provider's discovery endpoint before saving.

![OpenID Connect settings in Settings → Users](./assets/oidc_seerr_settings_users.png)

Provider details are entered in the **Add Provider** dialog:

![Add Provider dialog](./assets/oidc_seerr_provider_modal.png)

Once enabled, each configured provider appears as a sign-in button on the login page:

![Login page with an OpenID Connect provider button](./assets/oidc_seerr_login.png)

Alternatively, providers can be defined by manually updating the `oidc.providers` array in `settings.json`. Providers configured through the UI and providers present in `settings.json` are the same store: saving from the UI overwrites the list, and manually edited providers appear in the UI after a restart.

To set up OpenID Connect by hand instead, make the following updates:

```diff title="settings.json"
 {
   ...
-  "oidcLogin": false,
+  "oidcLogin": true,
   ...
   "oidc": {
-    "providers": []
+    "providers": [
+      {
+        "slug": "example",
+        "name": "Example",
+        "issuerUrl": "https://example.com",
+        "clientId": "seerr",
+        "clientSecret": "SUPER_SECRET_STRING",
+        "logo": "https://example.com/logo.png"
+      }
+    ]
   }
   ...
 }
```

## Configuration Options

### Provider Slug (`slug`)

Unique identifier for the provider. This should not be changed after initial setup. 

### Provider Name (`name`)

Name of the provider which appears on the login screen.

### Logo (`logo`)

The logo to display for the provider. Should be a URL or base64 encoded image.

### Issuer URL (`issuerUrl`)

The base URL of the identity provider's OpenID Connect endpoint. This must match the `issuer` value published in the provider's `/.well-known/openid-configuration` document exactly, including whether or not there is a trailing slash. For Keycloak, use the realm URL without a trailing slash (e.g. `https://keycloak.example.com/realms/master`); for Authentik, the issuer ends with a trailing slash.

### Client ID (`clientId`)

The Client ID assigned to Seerr

### Client Secret (`clientSecret`)

The Client Secret assigned to Seerr

### Scopes (`scopes`)

Space-separated list of scopes to request from the provider

### Required Claims (`requiredClaims`)

Space-separated list of ID token claims that are required to log in. A claim is satisfied when it is present and not `false` or empty (e.g. `email_verified`).

### Allow New Users (`newUserLogin`)

Create accounts for new users logging in with this provider

## Linked Accounts

OIDC sign-ins are matched to Seerr users by linked account (provider and subject). Users can link an additional provider while logged in from **Profile** → **Settings** → **Linked Accounts**, and manage or remove linked providers there.

![Linked accounts in profile settings](./assets/oidc_seerr_linked_accounts.png)

Sign-in with an email that already belongs to an existing Seerr account is rejected. New accounts are only created when the provider allows new-user sign-in and no user with that email exists yet.

To prevent lockouts, users cannot remove their last linked OIDC account while they have no local password or media server account, and the primary administrator cannot unlink OIDC accounts.

## Provider Setup

Most OpenID Connect providers follow the same basic setup pattern:

1. **Create a new client/application** in your identity provider using the OAuth 2.0 / OpenID Connect protocol.
2. **Set the client type to confidential** (as opposed to public) so that a client secret is issued.
3. **Add redirect URIs** pointing to your Seerr instance. At minimum, allow:
   - `https://<your-seerr-url>/login`
   - `https://<your-seerr-url>/profile/settings/linked-accounts`
4. **Copy the Client ID and Client Secret** from your provider and enter them in Seerr's provider configuration.
5. **Set the Issuer URL** to the base URL of your provider's OpenID Connect discovery endpoint. Most providers publish a `/.well-known/openid-configuration` document — the Issuer URL is the part before that path.

The default scopes (`openid profile email`) are sufficient for most providers. Only adjust scopes or required claims if your provider requires it.

## Provider Guides

### Keycloak

To set up Keycloak, follow these steps:

1. First, create a new client in Keycloak.
  ![Keycloak Step 1](./assets/oidc_keycloak_1.png)

1. Set the client ID to `seerr`, and set the name to "Seerr" (or whatever you prefer).
  ![Keycloak Step 2](./assets/oidc_keycloak_2.png)

1. Next, be sure to enable "Client authentication" in the capabilities section. The remaining defaults should be fine. 
  ![Keycloak Step 3](./assets/oidc_keycloak_3.png)

1. Finally, set the root url to your Seerr instance's URL, and add the two Seerr callback paths as valid redirect URLs: `https://<your-seerr-url>/login` and `https://<your-seerr-url>/profile/settings/linked-accounts`. Avoid using a wildcard like `/*`, as it broadens the client configuration unnecessarily and can hide redirect mismatches during setup.
  ![Keycloak Step 4](./assets/oidc_keycloak_4.png)

1. With all that set up, you should be able to configure Seerr to use Keycloak for authentication. Be sure to copy the client secret from the credentials page, as shown above. The issuer URL can be obtained from the "Realm Settings" page, by copying the link titled "OpenID Endpoint Configuration".
  ![Keycloak Step 5](./assets/oidc_keycloak_5.png)

1. Use `https://<keycloak-url>/realms/<realm>` (no trailing slash) as the Issuer URL, replacing `<realm>` with your Keycloak realm name.

### Authentik

Authentik supports Seerr through its generic OAuth2/OpenID Connect provider. For reference, the OAuth2 provider setup is documented at [https://docs.goauthentik.io/docs/providers/oauth2/](https://docs.goauthentik.io/docs/providers/oauth2/).

In short:

1. Create a new OAuth2/OpenID Connect provider in Authentik.
1. Set the redirect URI(s) to `https://<your-seerr-url>/login` and `https://<your-seerr-url>/profile/settings/linked-accounts`.
1. Use `https://<authentik-url>/application/o/<provider-slug>/` as the Issuer URL in Seerr, and copy the Client ID and Client Secret from the Authentik provider.
