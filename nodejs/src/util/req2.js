import axios from 'axios';
import http2 from 'http2-wrapper';
import { URL } from 'url';

const http2Adapter = async (config) => {
    return new Promise((resolve, reject) => {
        const url = new URL(config.url);
        const client = http2.connect(url.origin);
        
        const options = {
            ':method': config.method.toUpperCase(),
            ':path': url.pathname + url.search,
            ...config.headers,
        };

        const req = client.request(options);

        let responseData = '';

        req.on('data', (chunk) => {
            responseData += chunk;
        });

        req.on('end', () => {
            resolve({
                data: responseData,
                status: req.rstCode || 200,
                statusText: req.statusMessage || 'OK',
                headers: req.headers,
                config,
            });
            client.close();
        });

        req.on('error', (err) => {
            reject(err);
            client.close();
        });

        if (config.data) {
            req.write(config.data);
        }

        req.end();
    });
};

// Create a custom Axios instance with the HTTP/2 adapter
const req = axios.create({
    adapter: http2Adapter,
});

export default req;
