const path = require('path');
const fs = require('fs');

const isDevelopment = process.env.NODE_ENV !== 'production';

const config = {

    port: 3000,
    host: '0.0.0.0',
    key: path.resolve(__dirname, 'key.pem'),
    cert: path.resolve(__dirname, 'cert.pem'),
    staticDir: path.join(__dirname, isDevelopment ? '../client/public' : '../client/dist'),
    isHosting: false,
    
};

module.exports = config;