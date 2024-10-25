const { withPlugins } = require("expo/config-plugins");

const withDesugaringEnabled = require("./withDesugaringEnabled");
const withZendesk = require("./withZendesk");

module.exports = (config) => {
  return withPlugins(config, [withDesugaringEnabled, withZendesk]);
};
