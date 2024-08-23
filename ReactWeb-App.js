// src/App.js
import React, { useState } from 'react';
import FileUpload from './FileUpload';

const App = () => {
    const [savedFiles, setSavedFiles] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);

    const handleFilesReceived = (files) => {
        setSavedFiles(files);
        setPopupVisible(true);
    };

    const closePopup = () => {
        setPopupVisible(false);
    };

    return (
        <div>
            <h1>Upload Files</h1>
            <FileUpload onFilesReceived={handleFilesReceived} />
            {popupVisible && (
                <div style={{ position: 'fixed', top: '20%', left: '20%', background: 'white', padding: '20px', border: '1px solid black' }}>
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
