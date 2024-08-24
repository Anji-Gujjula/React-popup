const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

// Serve files from the uploaded_files directory
app.use('/uploaded_files', express.static(path.join(__dirname, 'uploaded_files')));

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.type === 'upload') {
            // Handling file upload
            const fileName = parsedMessage.name;
            const fileBuffer = Buffer.from(parsedMessage.data);

            // Create a folder if it doesn't exist
            const folderPath = path.join(__dirname, 'uploaded_files');
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }

            // Save the file with the original name
            const filePath = path.join(folderPath, fileName);
            fs.writeFile(filePath, fileBuffer, (err) => {
                if (err) {
                    console.error('Error saving file:', err);
                    return;
                }

                // Notify the client of the successful upload
                ws.send(JSON.stringify({ type: 'upload_success', message: 'File uploaded successfully' }));

                // After saving the file, send the updated list of files
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
                    return;
                }
                console.log(`Uploaded file ${fileName} has been saved again.`);
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function sendFileList(ws) {
    const folderPath = path.join(__dirname, 'uploaded_files');
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error reading files:', err);
            return;
        }

        // Prepare file list with URLs (assuming you're serving these files via a server)
        const fileDetails = files.map(fileName => ({
            name: fileName,
            url: `http://localhost:8080/uploaded_files/${fileName}`
        }));

        // Send the list of files back to the client
        ws.send(JSON.stringify({ type: 'file_list', files: fileDetails }));
    });
}

app.listen(8080, () => {
    console.log('HTTP server is running on http://localhost:8080');
});

console.log('WebSocket server is running on ws://localhost:8080');
