# Forward auth

You can use [forward-auth](https://doc.traefik.io/traefik/middlewares/http/forwardauth/) mechanism to log into Jellyseer.

This feature enables single sign-on(SSO) by passing the authenticated user(and optionally the authenticated user's email address for extra security) in the headers
defined by `forwardAuth.userHeader` and `forwardAuth.emailHeader` in the configuration file or the settings in Settings->Network in Web UI.

:::warning
The user has to exist, it will not be created automatically.
:::

:::info
If the user has no email set, the username will also work
:::

## Example with Goauthentik and Traefik

This example assumes that you have already configured an `application` and `provider` for Jellyseer in Authentik, and added the `provider` to the `outpost`.

For our example, We'll assume `forwardAuth.userHeader` is set to `Remote-User`.

We now have to create a scope mapping that will pass the `Remote-User` header containing user e-mail to Jellyseerr application.

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
              "Remote-User": request.user.username
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
      - traefik.http.middlewares.auth-authentik.forwardauth.authResponseHeaders=Remote-User

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
