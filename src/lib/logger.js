/* eslint no-console: "off" */

module.exports = {
  debug: ((process.env.LOG_LEVEL || 5) >= 5) ? console.debug : () => {},
  info: ((process.env.LOG_LEVEL || 5) >= 4) ? console.info : () => {},
  log: ((process.env.LOG_LEVEL || 5) >= 3) ? console.log : () => {},
  warn: ((process.env.LOG_LEVEL || 5) >= 2) ? console.warn : () => {},
  error: ((process.env.LOG_LEVEL || 5) >= 1) ? console.error : () => {},
};
