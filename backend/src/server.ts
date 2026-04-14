import { app } from './app.js';
import logger from './utils/logger.js';
import { envConfig } from './config/env.js';

const PORT = envConfig.PORT;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});