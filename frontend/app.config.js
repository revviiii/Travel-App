const appJson = require('./app.json');

const googleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

module.exports = {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    ...(googleMapsApiKey
      ? {
          config: {
            ...appJson.expo.android?.config,
            googleMaps: {
              apiKey: googleMapsApiKey,
            },
          },
        }
      : {}),
  },
};
