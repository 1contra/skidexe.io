const path = require('path');
const fs = require('fs');

const isDevelopment = process.env.NODE_ENV !== 'production';

const config = {
    http: {
        port: 3000,
        host: '0.0.0.0' // Default to listen on all network interfaces; adjust as needed
    },
    https: {
        port: 443,
        host: '0.0.0.0', // Default to listen on all network interfaces; adjust as needed
        key: path.resolve(__dirname, 'key.pem'), // Path to your SSL key
        cert: path.resolve(__dirname, 'cert.pem') // Path to your SSL certificate
    },
    staticDir: path.join(__dirname, isDevelopment ? 'client/' : 'client/dist'),
    useHttps: false, // Set to true if you want to use HTTPS in development
    domain: '' // Replace with your domain name or IP address
};

module.exports = config;