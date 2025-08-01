import axios, { isAxiosError } from 'axios'; // <-- Import axios and isAxiosError

export async function processCallback(
  params: URLSearchParams,
  provider: string
) {
  const url = new URL(
    `/api/v1/auth/oidc/callback/${encodeURIComponent(provider)}`,
    window.location.origin
  );
  url.search = params.toString();

  try {
    // The fetch call is replaced with axios.get.
    // On success, the JSON response is automatically parsed and available in res.data.
    const res = await axios.get(url.toString());

    return {
      type: 'success',
      message: res.data,
    };
  } catch (e) {
    // Axios throws an error for non-2xx responses. We can check if it's an axios error
    // to safely access the error message from the server's response payload.
    if (isAxiosError(e) && e.response?.data?.message) {
      return { type: 'error', message: e.response.data.message };
    }

    // Fallback for generic errors
    return {
      type: 'error',
      message: e.message,
    };
  }
}
