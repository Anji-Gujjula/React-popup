const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

const PORT = 8080;
const UPLOAD_DIR = path.join(__dirname, 'uploaded_files');

// Create the upload directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Serve static files from the uploaded_files directory
app.use('/uploaded_files', express.static(UPLOAD_DIR));

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws) => {
    console.log('Client connected');

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

app.listen(PORT, () => {
    console.log(`HTTP server is running on http://localhost:${PORT}`);
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
