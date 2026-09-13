module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@constants': './src/constants',
            '@features':  './src/features',
            '@shared':    './src/shared',
            '@assets':    './src/assets',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
