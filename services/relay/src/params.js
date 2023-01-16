// get envars - typically set in compose.yaml and compose-overrides.yaml files
export const params = {
  retryTime: 4000, // ms between connection retries etc
  // this is the default ladder99 agent service - can override or specify others in setup.yaml.
  defaultAgent: { alias: 'Main', url: 'http://agent:5000' }, // don't change agent alias once relay runs.
  // hardcoded default folder is defined in compose.yaml with docker volume mappings
  setupFolder: process.env.L99_SETUP_FOLDER || '/data/setup',
  // these are dynamic - adjusted on the fly
  // these were 2000 and 800 for ox, ie 400 per second
  fetchInterval: Number(process.env.FETCH_INTERVAL || 1000), // how often to fetch sample data, msec
  fetchCount: Number(process.env.FETCH_COUNT || 1000), // how many samples to fetch each time
}
