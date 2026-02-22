import path from 'path';
import fs from 'fs';
import { createApp } from './app';
import { env } from './config/env';
import { runMigrations } from './db/migrate';

runMigrations();

const app = createApp();

// In production, serve the built React client
if (env.NODE_ENV === 'production') {
  const clientBuild = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientBuild)) {
    app.use(require('express').static(clientBuild));
    app.get('*', (_req: import('express').Request, res: import('express').Response) => {
      res.sendFile(path.join(clientBuild, 'index.html'));
    });
  }
}

const port = Number(env.PORT);
app.listen(port, () => {
  console.log(`\n🚀 Option Tracker server running on http://localhost:${port}`);
  console.log(`   Mode: ${env.NODE_ENV}`);
  if (env.NODE_ENV === 'development') {
    console.log(`   API: http://localhost:${port}/api`);
    console.log(`   Frontend: http://localhost:5173 (run "npm run dev --workspace=client")\n`);
  }
});
