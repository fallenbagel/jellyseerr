# Forward auth

You can use [forward-auth](https://doc.traefik.io/traefik/middlewares/http/forwardauth/) mechanism to log into Jellyseer.

This works by passing the authenticated user e-mail in `X-Forwarded-User` header by the auth server, therefore enabling single-sign-on (SSO) login.

:::warning
The user has to exist, it will not be created automatically.
:::

:::info
If the user has no email set, the username will also work
:::

## Example with Goauthentik and Traefik

This example assumes that you have already configured an `application` and `provider` for Jellyseer in Authentik, and added the `provider` to the `outpost`.

We now have to create a scope mapping that will pass the `X-Forwarded-User` header containing user e-mail to Jellyseerr application.

### Create scope mapping

In Authentik go to `Customization > Propperty Mappings` and create `Scope Mapping`:

* Name: `jellyseerr-forwardauth`
* Scope: `ak_proxy`
* Expression:

```py
return {
    "ak_proxy": {
        "user_attributes": {
            "additionalHeaders": {
              "X-Forwarded-User": request.user.email
            }
        }
    }
}
```

### Add the scope mapping to provider scopes

In authentik go to `Applications > Providers`, edit your `jellyseer` provider:

* Under `Advanced protocol settings` - `Available scopes` select the `jellyseerr-forwardauth` scope that was created in the previous step and add it to the `Selected scopes` list
* Save the changes by clicking the `Update` button

### Create the forward-auth middleware in Traefik

Now you have to define the forward-auth middleware in Traefik and attach it to the `jellyseerr` router. Authentik also requires to set up login page routing so it could redirect properly to Authentik.

```yml
    labels:
      - traefik.enable=true

      # Forward auth middleware
      - traefik.http.middlewares.auth-authentik.forwardauth.address=http://authentik-server:9000/outpost.goauthentik.io/auth/jellyseerr
      - traefik.http.middlewares.auth-authentik.forwardauth.trustForwardHeader=true
      - traefik.http.middlewares.auth-authentik.forwardauth.authResponseHeaders=X-Forwarded-User

      # Router for jellyseerr
      - traefik.http.routers.jellyseerr.rule=Host(`jellyseerr.domain.com`)
      - traefik.http.routers.jellyseerr.entrypoints=websecure
      - traefik.http.routers.jellyseerr.middlewares=auth-authentik@docker
      # Service for jellyseerr
      - traefik.http.services.jellyseerr.loadbalancer.server.port=5055
      - traefik.http.routers.jellyseerr.service=jellyseerr

      # Router for login pages
      - traefik.http.routers.jellyseerr-auth.rule=Host(`jellyseerr.domain.co`) && PathPrefix(`/outpost.goauthentik.io/`)
      - traefik.http.routers.jellyseerr-auth.entrypoints=websecure
      # Service - reference the authentik outpost service name
      - traefik.http.routers.jellyseerr-auth.service=authentik@docker
```
