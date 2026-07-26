import { app } from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`${config.appName} API disponible en http://localhost:${config.port}`);
});
