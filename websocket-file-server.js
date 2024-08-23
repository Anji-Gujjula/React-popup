// server.js
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (data) => {
        // Create a folder if it doesn't exist
        const folderPath = path.join(__dirname, 'uploaded_files');
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }

        // Generate a unique file name
        const fileName = `file_${Date.now()}.bin`;
        const filePath = path.join(folderPath, fileName);

        // Save the file
        fs.writeFile(filePath, Buffer.from(data), (err) => {
            if (err) {
                console.error('Error saving file:', err);
                return;
            }

            // Notify the client with file details
            const savedFiles = [{ name: fileName, folderName: 'uploaded_files' }];
            ws.send(JSON.stringify(savedFiles));
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
