// ------------------- API config parameters ----------------------------------

export const API_PARAMETERS = {
  host: 'localhost',
  protocol: 'http',
  pollingInterval: 1000,
  endpoint: () =>
    `${API_PARAMETERS.protocol}://${API_PARAMETERS.host}${API_PARAMETERS.port ? `:${API_PARAMETERS.port}` : ''}/`
};

// ----------------------------------------------------------------------------

export default () => {
  const location = window?.location;
  if (!location) {
    throw 'Cannot extract host URL from window global. Server-side rendering is not supported.';
  }

  // For callblocker, this is a very reasonable assumption: the API runs from the same box
  // which serves the frontend, under a common web server.
  API_PARAMETERS.host = location.hostname;
  API_PARAMETERS.port = location.port;
  console.log(API_PARAMETERS);
  return null;
}
