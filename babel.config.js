module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
        "blacklist": null,
        "whitelist": [
          "PERSONAL_ASSISTANT_URL",
          "ENABLE_LOGGING",
          "MASTRA_AGENT_ID"
        ],
        "safe": false,
        "allowUndefined": true
      }]
    ]
  };
};
