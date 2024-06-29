import { useEffect, useState } from 'react';

export const JellyseerrVersion = () => {
  const [version, setVersion] = useState<string | null>('0.0.0');

  useEffect(() => {
    async function fetchVersion() {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/Fallenbagel/jellyseerr/main/package.json'
        );

        const data = await response.json();

        setVersion(data.version);
        console.log(data.version);
      } catch (error) {
        console.error('Failed to fetch version', error);
        setVersion('Error fetching version');
      }
    }
    fetchVersion();
  }, []);

  return version;
};

export const NixpkgVersion = () => {
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const url =
          'https://raw.githubusercontent.com/NixOS/nixpkgs/nixos-unstable/pkgs/servers/jellyseerr/default.nix';
        const response = await fetch(url);
        const data = await response.text();

        const versionRegex = /version\s*=\s*"([^"]+)"/;
        const match = data.match(versionRegex);
        if (match && match[1]) {
          setVersion(match[1]);
        } else {
          setError('0.0.0');
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchVersion();
  }, []);

  if (loading) {
    return 'Loading...';
  }

  if (error) {
    return { error };
  }

  return version;
};
