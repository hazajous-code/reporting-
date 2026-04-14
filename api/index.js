const { createApp } = require('../server/app');

let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const app = await createApp();
    handler = app;
  }
  return handler(req, res);
};
