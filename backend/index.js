const https = require('https');
const fs = require('fs');
const config = require('./utils/config');  
const logger = require('./utils/logger');
const app = require('./app');

const privateKey = fs.readFileSync(process.env.PRIVATE_KEY, 'utf8');
const certificate = fs.readFileSync(process.env.CERTIFICATE, 'utf8');

const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(config.PORT, () => {
  logger.info(`Server running on https://localhost:${config.PORT}`);
});
