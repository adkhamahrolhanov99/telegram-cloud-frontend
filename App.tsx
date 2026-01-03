import React, { useState, useEffect } from 'react';
import { useLaunchParams, useThemeParams, initData } from '@telegram-apps/sdk-react';
import axios from 'axios';
import './App.css';

// Configure axios to send Telegram initData with every request
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-Telegram-Init-Data': initData.initDataRaw,
  }
});

interface FileItem {
  name: string;
  type: string;
  folder: string;
  created_at: string;
  size: string;
}

interface Folder {
  name: string;
  file_count: number;
}

function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('All Files');
  const [stats, setStats] = useState({ total_files: 0, photos: 0, videos: 0, documents: 0 });
  const [loading, setLoading] = useState(true);

  // Use Telegram SDK hooks
  const lp = useLaunchParams();
  const themeParams = useThemeParams();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [profileRes, foldersRes] = await Promise.all([
        api.get('/api/user/profile'),
        api.get('/api/folders')
      ]);
      
      setStats(profileRes.data);
      setFolders(foldersRes.data.folders);
      await fetchFiles();
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (folder?: string) => {
    try {
      const params = folder && folder !== 'All Files' ? { folder } : {};
      const response = await api.get('/api/files', { params });
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const handleFolderClick = (folderName: string) => {
    setCurrentFolder(folderName);
    fetchFiles(folderName);
  };

  const handleFileUpload = async (file: File) => {
    try {
      // 1. Request upload metadata from backend
      const uploadRequest = await api.post('/api/files/request-upload', {
        file_name: file.name,
        folder: currentFolder === 'All Files' ? 'General' : currentFolder,
        file_type: file.type.startsWith('image/') ? 'photo' : 
                  file.type.startsWith('video/') ? 'video' : 'document'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // 2. Here you would use the Telegram Bot API
      // to actually upload the file to the user's channel.
      // This requires additional implementation using telegram-web-app.js
      
      alert(`Ready to upload ${file.name} to ${uploadRequest.data.folder}`);
      
      // Refresh file list
      await fetchFiles(currentFolder);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    }
  };

  // Apply Telegram theme
  const appStyle = {
    backgroundColor: themeParams.bgColor || '#ffffff',
    color: themeParams.textColor || '#000000',
    minHeight: '100vh'
  };

  if (loading) {
    return (
      <div style={appStyle} className="app-container">
        <div className="loading">Loading your cloud storage...</div>
      </div>
    );
  }

  return (
    <div style={appStyle} className="app-container">
      <header className="app-header">
        <h1>☁️ Telegram Cloud Storage</h1>
        <div className="user-stats">
          <span>📁 {stats.total_files} files</span>
          <span>🖼️ {stats.photos} photos</span>
          <span>🎥 {stats.videos} videos</span>
        </div>
      </header>

      <main className="app-main">
        <section className="folders-section">
          <h2>Your Folders</h2>
          <div className="folders-grid">
            <div 
              className={`folder-card ${currentFolder === 'All Files' ? 'active' : ''}`}
              onClick={() => handleFolderClick('All Files')}
            >
              📄 All Files
            </div>
            {folders.map(folder => (
              <div 
                key={folder.name}
                className={`folder-card ${currentFolder === folder.name ? 'active' : ''}`}
                onClick={() => handleFolderClick(folder.name)}
              >
                📁 {folder.name}
                <span className="file-count">{folder.file_count}</span>
              </div>
            ))}
            <div className="folder-card new-folder">
              ➕ New Folder
            </div>
          </div>
        </section>

        <section className="files-section">
          <h2>{currentFolder} ({files.length} items)</h2>
          
          <div className="upload-area">
            <input 
              type="file" 
              id="file-upload" 
              onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="upload-button">
              📤 Upload File to {currentFolder}
            </label>
          </div>

          <div className="files-list">
            {files.length === 0 ? (
              <div className="empty-state">
                No files in this folder. Upload your first file!
              </div>
            ) : (
              files.map(file => (
                <div key={file.name} className="file-item">
                  <div className="file-icon">
                    {file.type === 'photo' ? '🖼️' : 
                     file.type === 'video' ? '🎥' : '📄'}
                  </div>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      {file.folder} • {new Date(file.created_at).toLocaleDateString()} • {file.size}
                    </div>
                  </div>
                  <button className="file-action">⬇️</button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;