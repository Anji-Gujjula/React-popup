const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

// Serve files from the uploaded_files directory
app.use('/uploaded_files', express.static(path.join(__dirname, 'uploaded_files')));

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Handle errors on the WebSocket connection
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);

            if (parsedMessage.type === 'upload') {
                // Handling file upload
                const fileName = parsedMessage.name;
                const fileBuffer = Buffer.from(parsedMessage.data);

                const folderPath = path.join(__dirname, 'uploaded_files');

                // Ensure the folder exists
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath);
                }

                // Save the file with the original name
                const filePath = path.join(folderPath, fileName);
                fs.writeFile(filePath, fileBuffer, (err) => {
                    if (err) {
                        console.error('Error saving file:', err);
                        ws.send(JSON.stringify({ type: 'error', message: 'Error saving file' }));
                        return;
                    }

                    console.log(`File ${fileName} uploaded successfully`);

                    // Notify the client of the successful upload
                    ws.send(JSON.stringify({ type: 'upload_success', message: 'File uploaded successfully' }));

                    // Send updated list of files
                    sendFileList(ws);
                });
            } else if (parsedMessage.type === 'list_files') {
                // Handle file listing request
                sendFileList(ws);
            } else if (parsedMessage.type === 'save_uploaded_file') {
                // Handle saving the last uploaded file again
                const fileName = parsedMessage.name;
                const fileBuffer = Buffer.from(parsedMessage.data);

                const filePath = path.join(__dirname, 'uploaded_files', fileName);
                fs.writeFile(filePath, fileBuffer, (err) => {
                    if (err) {
                        console.error('Error saving uploaded file:', err);
                        ws.send(JSON.stringify({ type: 'error', message: 'Error saving uploaded file' }));
                        return;
                    }
                    console.log(`Uploaded file ${fileName} has been saved again.`);
                });
            }
        } catch (err) {
            console.error('Error processing message:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Server error occurred' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Function to send the list of files to the client
function sendFileList(ws) {
    const folderPath = path.join(__dirname, 'uploaded_files');
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error reading files:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Error reading files' }));
            return;
        }

        const fileDetails = files.map(fileName => ({
            name: fileName,
            url: `http://localhost:${PORT}/uploaded_files/${fileName}`
        }));

        ws.send(JSON.stringify({ type: 'file_lis
