---
title: Watchlist Auto Request
description: Learn how to use the Plex Watchlist Auto Request feature
sidebar_position: 1
---

# Watchlist Auto Request

The Plex Watchlist Auto Request feature allows Jellyseerr to automatically create requests for media items in your Plex Watchlist. This means you can add items to your Plex Watchlist, and Jellyseerr will automatically request them for you!

:::info
This feature is only available for Plex users. Local users cannot use the Watchlist Auto Request feature.
:::

## Prerequisites

- You must have logged into Jellyseerr at least once with your Plex account
- Your administrator must have enabled the necessary permissions for you
- Your Plex account must be properly connected to Jellyseerr (see [Mediaserver Settings](/using-jellyseerr/settings/mediaserver?media-server-type=plex))

## How to Enable

### For Users

1. **Check Your Permissions**
   - Ask your administrator if you have the necessary permissions:
     - `Auto-Request` for general use
     - `Auto-Request Movies` for movies
     - `Auto-Request Series` for TV series

2. **Enable the Feature**
   - Go to your profile
   - Click on "General" in the settings menu
   - Look for the "Auto-Request" section
   - Enable the options you want:
     - "Auto-Request Movies" for movies
     - "Auto-Request Series" for TV series

3. **Start Using It**
   - Add movies and TV shows to your Plex Watchlist
   - Jellyseerr will automatically create requests for new items
   - You'll receive notifications when items are auto-requested

### For Administrators

1. **Enable Permissions**
   - Go to the user's profile
   - Click on "Permissions"
   - Enable the appropriate permissions:
     - `Auto-Request` for general use
     - `Auto-Request Movies` for movies
     - `Auto-Request Series` for TV series

2. **Global Settings (Optional)**
   - Go to Settings > Users
   - Configure default permissions for new users
   - Enable auto-request permissions if you want all users to have this feature

## How It Works

Once enabled, Jellyseerr will:

1. Check your Plex Watchlist periodically
2. Create requests for new items that:
   - Are not already in your library
   - Are not 4K content (auto-request only works for non-4K content)
3. Send you notifications when new items are requested

:::warning
Auto-request only works for non-4K content. 4K content will need to be requested manually.
:::

## Limitations

- Only works for Plex users (not local users)
- Only works for non-4K content
- You must have logged into Jellyseerr at least once
- Respects user request limits and quotas
- Only requests items not already in your library

## Troubleshooting

If auto-request is not working:

1. **Check Permissions**
   - Verify you have the correct permissions enabled
   - Contact your administrator if you need permissions

2. **Check Settings**
   - Make sure the feature is enabled in your user settings
   - Ensure you have logged into Jellyseerr at least once

3. **Check Your Watchlist**
   - Ensure items are properly added to your Plex Watchlist
   - Verify items aren't already in your library
   - Check that you have available request quota

4. **Still Not Working?**
   - Check the [Troubleshooting Guide](/troubleshooting) for more help
   - Contact your administrator for assistance 
