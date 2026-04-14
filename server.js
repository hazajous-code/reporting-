const { createApp } = require('./server/app');

const PORT = process.env.PORT || 3001;

async function start() {
  const app = await createApp();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
