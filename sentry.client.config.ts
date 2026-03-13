// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads the browser in your app.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://4d17bda5e16fca4e34b8d0a81e1e0924@o4511037379182592.ingest.us.sentry.io/4511037383180288",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Define how likely Replay events are sampled.
  replaysSessionSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,
});
