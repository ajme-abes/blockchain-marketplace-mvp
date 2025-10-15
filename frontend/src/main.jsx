import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#2c5aa0' }}>🚀 Blockchain Marketplace</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        Frontend under development by Semir
      </p>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: '1.5rem', 
        borderRadius: '8px',
        textAlign: 'left'
      }}>
        <h3>✅ Backend Services Running:</h3>
        <ul>
          <li>API Server: <a href="http://localhost:5000/api/health" target="_blank">http://localhost:5000/api/health</a></li>
          <li>Database: Connected & Healthy</li>
          <li>Blockchain: Ready for Integration</li>
        </ul>
        
        <h3>🎯 Next Steps:</h3>
        <p>Frontend development in progress...</p>
      </div>
    </div>
  </React.StrictMode>
)