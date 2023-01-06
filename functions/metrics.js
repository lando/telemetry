'use strict';

const _ = require('lodash');
const debug = require('debug')('@lando/telemetry');
const Promise = require('bluebird');

// Load plugins
const AmplitudeReporter = require('./../plugins/amplitude.js');

// Define default config
const config = {
  'LANDO_METRICS_PLUGINS': [
    {name: 'amplitude', config: 'LANDO_TELEMETRY_AMPLITUDE'},
  ],
};

// Get plugins
const pluginConfig = config.LANDO_METRICS_PLUGINS || [];

// Merge in plugin config keys
_.forEach(_.map(pluginConfig, plugin => plugin.config), key => {
  config[key] = {};
});

// Merge in process.env as relevant
_.forEach(_.keys(config), key => {
  if (_.has(process.env, key)) {
    config[key] = process.env[key];
  }
});

// Make sure we JSON parse relevant config
_.forEach(_.map(pluginConfig, plugin => plugin.config), key => {
  if (typeof config[key] === 'string') {
    config[key] = JSON.parse(config[key]);
  }
});
debug('starting function with config %o', config);

// Manually declare plugins
const plugins = [
  {name: 'amplitude', Reporter: AmplitudeReporter, config: 'LANDO_TELEMETRY_AMPLITUDE'},
];

debug('loaded plugins %o', plugins);

exports.handler = async event => {
  // Get incoming data
  const pathParts = event.path.split('/');
  const id = (_.last(pathParts) === 'v2') ? undefined : _.last(pathParts);

  // Error if no id
  if (!id) return {statusCode: 500, body: 'ID is required!'};

  // Error on anything but post requests
  if (_.lowerCase(event.httpMethod) !== 'post') {
    debug('unsupported method %s from %s', event.httpMethod, id);
    return {
      statusCode: 405,
      body: 'Unsupported HTTP Method',
    };
  }

  // Merge data
  const data = _.merge({}, JSON.parse(event.body), {id});
  debug('request recieved from %s with value %o', data.id, data);

  // Report data
  return Promise.map(plugins, plugin => {
    const reporter = new plugin.Reporter(config[plugin.config]);
    return reporter.ping()
      .then(() => reporter.report(data))
      .then(() => debug('reported to %s', plugin.name))
      .then(() => reporter.close());
  })
  // Return success
  .then(() => ({statusCode: 200, body: JSON.stringify({status: 'OK'})}))
  // Throw error
  .catch(error => {
    debug('errored with %o', error);
    return {
      statusCode: 400,
      body: JSON.stringify(error),
    };
  });
};
