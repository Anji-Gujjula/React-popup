import React, { useState, useEffect } from 'react';

const App = () => {
    const [ws, setWs] = useState(null);
    const [savedFiles, setSavedFiles] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);
    const [lastUploadedFile, setLastUploadedFile] = useState(null); // Track the last uploaded file

    useEffect(() => {
        // Establish WebSocket connection
        const socket = new WebSocket('ws://localhost:8080');
        setWs(socket);

        // Listen for messages from the WebSocket server
        socket.onmessage = (event) => {
            const response = JSON.parse(event.data);
            if (response.type === 'file_list') {
                setSavedFiles(response.files);
                setPopupVisible(true);
            } else if (response.type === 'upload_success') {
                // After a successful upload, request the file list
                listFiles();
            }
        };

        return () => socket.close();
    }, []);

    const handleFileChange = (event) => {
        const files = event.target.files;
        if (!ws) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                const fileData = reader.result;
                const payload = JSON.stringify({
                    type: 'upload',
                    name: file.name,
                    data: Array.from(new Uint8Array(fileData)),
                });
                ws.send(payload);
                setLastUploadedFile({ name: file.name, data: new Uint8Array(fileData) }); // Store the last uploaded file
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const listFiles = () => {
        if (ws) {
            ws.send(JSON.stringify({ type: 'list_files' }));
        }
    };

    const closePopup = () => {
        // When the user clicks "Close," send the last uploaded file to the server
        if (lastUploadedFile && ws) {
            const payload = JSON.stringify({
                type: 'save_uploaded_file',
                name: lastUploadedFile.name,
                data: Array.from(lastUploadedFile.data),
            });
            ws.send(payload);
        }
        setPopupVisible(false);
    };

    return (
        <div>
            <h1>Upload Files</h1>
            <div>
                <input type="file" multiple onChange={handleFileChange} />
            </div>

            {popupVisible && (
                <div style={{
                    position: 'fixed',
                    top: '20%',
                    left: '20%',
                    background: 'white',
                    padding: '20px',
                    border: '1px solid black',
                    zIndex: 1000,
                }}>
                    <h2>Saved Files</h2>
                    <ul>
                        {savedFiles.map(file => (
                            <li key={file.name} style={{ marginBottom: '10px' }}>
                                <span>{file.name}</span>
                                <button
                                    style={{ marginLeft: '10px' }}
                                    onClick={() => window.open(file.url, '_blank')}
                                >
                                    Open
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button onClick={closePopup}>Close</button>
                </div>
            )}
        </div>
    );
};

export default App;
