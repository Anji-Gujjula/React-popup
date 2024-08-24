import React, { useState, useEffect } from 'react';

// Main App Component
const App = () => {
    const [files, setFiles] = useState([]);
    const [ws, setWs] = useState(null);
    const [savedFiles, setSavedFiles] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);

    useEffect(() => {
        // Establish WebSocket connection
        const socket = new WebSocket('ws://localhost:8080');
        setWs(socket);

        // Listen for messages from the WebSocket server
        socket.onmessage = (event) => {
            const savedFiles = JSON.parse(event.data);
            setSavedFiles(savedFiles);
            setPopupVisible(true);
        };

        return () => socket.close();
    }, []);

    const handleFileChange = (event) => {
        setFiles(event.target.files);
    };

    const handleUpload = () => {
        if (!ws) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                const fileData = reader.result;
                const payload = JSON.stringify({
                    name: file.name,
                    data: Array.from(new Uint8Array(fileData)),
                });
                ws.send(payload);
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const closePopup = () => {
        setPopupVisible(false);
    };

    return (
        <div>
            <h1>Upload Files</h1>
            <div>
                <input type="file" multiple onChange={handleFileChange} />
                <button onClick={handleUpload}>Upload Files</button>
            </div>

            {popupVisible && (
                <div style={{
                    position: 'fixed',
                    top: '20%',
                    left: '20%',
                    background: 'white',
                    padding: '20px',
                    border: '1px solid black'
                }}>
                    <h2>Saved Files</h2>
                    <ul>
                        {savedFiles.map(file => (
                            <li key={file.name}>{file.folderName}/{file.name}</li>
                        ))}
                    </ul>
                    <button onClick={closePopup}>Close</button>
                </div>
            )}
        </div>
    );
};

export default App;
