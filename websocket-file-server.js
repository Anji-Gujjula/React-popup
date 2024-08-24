// server.js
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

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

                // Send a success response (optional)
                ws.send(JSON.stringify({ status: 'success', message: 'File uploaded successfully' }));
            });
        } else if (parsedMessage.type === 'list_files') {
            // Handling file listing
            const folderPath = path.join(__dirname, 'uploaded_files');
            fs.readdir(folderPath, (err, files) => {
                if (err) {
                    console.error('Error reading files:', err);
                    return;
                }

                // Prepare file list with URLs (assuming you're serving these files via a server)
                const fileDetails = files.map(fileName => ({
                    name: fileName,
                    url: `http://localhost:8080/uploaded_files/${fileName}` // Example URL
                }));

                // Send the list of files back to the client
                ws.send(JSON.stringify({ type: 'file_list', files: fileDetails }));
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
