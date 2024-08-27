const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8086;
const UPLOAD_DIR = path.join(__dirname, 'uploaded_files');

// Create the upload directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Create an HTTP server to serve static files
const server = http.createServer((req, res) => {
    if (req.url.startsWith('/uploaded_files')) {
        const filePath = path.join(__dirname, req.url);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end(JSON.stringify(err));
                return;
            }

            res.writeHead(200);
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('error', (error) => {
        console.error('WebSocket connection error:', error);
    });

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);

            switch (parsedMessage.type) {
                case 'upload':
                    handleFileUpload(ws, parsedMessage);
                    break;
                case 'list_files':
                    sendFileList(ws);
                    break;
                default:
                    ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Server error occurred' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function handleFileUpload(ws, { name, data }) {
    const filePath = path.join(UPLOAD_DIR, name);
    const fileBuffer = Buffer.from(data);

    fs.writeFile(filePath, fileBuffer, (err) => {
        if (err) {
            console.error('Error saving file:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Error saving file' }));
            return;
        }

        console.log(`File ${name} uploaded successfully`);
        sendFileList(ws);
    });
}

function sendFileList(ws) {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            console.error('Error reading files:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Error reading files' }));
            return;
        }

        const fileDetails = files.map(fileName => ({
            name: fileName,
            url: `http://localhost:${PORT}/uploaded_files/${fileName}`,
        }));

        ws.send(JSON.stringify({ type: 'file_list', files: fileDetails }));
    });
}

// General error handlers for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the HTTP server and WebSocket server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});
