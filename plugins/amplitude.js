'use strict';

// Modules
const amplitude = require('@amplitude/analytics-node');

/*
 * Creates a new ES instance.
 */
class Amplitude {
  constructor(apiKey) {
    this.apiKey = apiKey;
    console.log(amplitude);
    amplitude.init(this.apiKey);
  };

  /*
   * Ping connection. Not necessary/available for amplitude?
   */
  ping() {
    return true;
  };

  /*
   * Log data to amplitude
   */
  report(data) {
    // Insert user_id?
    data.user_id = 'test';
    console.log(data);
    amplitude.track(data);
  };

  /*
   * Close connection. Not applicable for amplitude?
   */
  close() {
  };
}

/*
 * Return the class
 */
module.exports = Amplitude;
