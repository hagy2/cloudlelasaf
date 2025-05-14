import { Auth } from 'aws-amplify';

export async function fetchWithAuth(url, options = {}) {
  const session = await Auth.currentSession();
  const token = session.getIdToken().getJwtToken();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token,
    },
  });
}
