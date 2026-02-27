const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve('react-native-sass-transformer');
config.resolver.sourceExts.push('scss', 'sass');

module.exports = config;