import { useState, useRef } from 'react';

export default function Converter() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const ffmpegRef = useRef(null);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegRef.current = ffmpeg;
      setLoaded(true);
    } catch (err) {
      alert("Αποτυχία φόρτωσης.");
    } finally {
      setLoading(false);
    }
  };

  const convert = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setProcessing(true);
    setOutputUrl(null);
    try {
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.writeFile('input.m4a', await fetchFile(file));
      await ffmpeg.exec(['-i', 'input.m4a', '-acodec', 'libmp3lame', 'output.mp3']);
      const data = await ffmpeg.readFile('output.mp3');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      setOutputUrl(url);
      await ffmpeg.deleteFile('input.m4a');
      await ffmpeg.deleteFile('output.mp3');
    } catch (err) {
      alert("Σφάλμα μετατροπής.");
    } finally {
      setProcessing(false);
    }
  };

  const resetConverter = () => {
    setOutputUrl(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={{ 
      backgroundColor: '#0a192f', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      fontFamily: 'sans-serif',
      margin: 0,
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '40px', 
        borderRadius: '24px', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)', 
        textAlign: 'center',
        maxWidth: '450px',
        width: '100%',
        position: 'relative'
      }}>
        <h1 style={{ color: '#0a192f', marginBottom: '10px', fontWeight: '800' }}>M4A to MP3</h1>
        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '14px' }}>
          By <a href="https://codeplaygraoundbymyserlis.blogspot.com" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 'bold' }}>CodePlayground</a>
        </p>
        
        {!loaded ? (
          <button onClick={load} disabled={loading} style={{ 
            padding: '16px 32px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            borderRadius: '12px', 
            border: 'none', 
            background: '#0a192f', 
            color: 'white',
            fontWeight: 'bold'
          }}>
            {loading ? 'Περιμένετε...' : 'Ενεργοποίηση Εφαρμογής'}
          </button>
        ) : (
          <div>
            {!outputUrl && !processing && (
              <div style={{ 
                border: '2px dashed #cbd5e1', 
                padding: '30px 20px', 
                borderRadius: '16px',
                backgroundColor: '#f8fafc'
              }}>
                <input 
                  type="file" 
                  accept=".m4a" 
                  ref={fileInputRef}
                  onChange={(e) => e.target.files[0] && convert(e.target.files[0])} 
                  style={{ cursor: 'pointer' }}
                />
              </div>
            )}

            {processing && (
              <div style={{ margin: '20px' }}>
                <div className="spinner"></div>
                <p style={{ color: '#0a192f', fontWeight: '600' }}>Μετατροπή...</p>
              </div>
            )}

            {outputUrl && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '12px', marginBottom: '20px' }}>
                  <h3 style={{ color: '#166534', margin: '0 0 10px 0' }}>✓ Έτοιμο!</h3>
                  <audio src={outputUrl} controls style={{ width: '100%' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a 
                    href={outputUrl} 
                    download={fileName.replace('.m4a', '.mp3')} 
                    style={{ 
                      padding: '14px', 
                      background: '#166534', 
                      color: 'white', 
                      textDecoration: 'none', 
                      borderRadius: '10px', 
                      fontWeight: 'bold'
                    }}
                  >
                    Λήψη Αρχείου MP3
                  </a>
                  <button 
                    onClick={resetConverter} 
                    style={{ 
                      padding: '12px', 
                      background: 'transparent', 
                      color: '#64748b', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '10px', 
                      cursor: 'pointer'
                    }}
                  >
                    Μετατροπή άλλου αρχείου
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ marginTop: '30px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
        <p>© 2024 Created for <a href="https://codeplaygraoundbymyserlis.blogspot.com" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>codeplaygraoundbymyserlis.blogspot.com</a></p>
      </footer>

      <style jsx>{`
        .spinner {
          border: 4px solid #f1f5f9;
          border-top: 4px solid #0a192f;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}