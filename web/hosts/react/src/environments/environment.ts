// Ported from armature-ui's src/environments/environment.ts. Angular used
// build-time fileReplacements for a prod variant; Vite's equivalent is
// import.meta.env, but nothing here yet needs a per-build override, so this
// stays a single plain object.
export const environment = {
  production: false,
  apihost: 'http://localhost:8080',
  imageAPI: '/image',
  loginAPI: '/login',
  userAPI: '/user',
  eventAPI: '/event',
  sessionToken: 'API_KEY',
  demo: true,
  applicationTitle: 'Armature',
};
