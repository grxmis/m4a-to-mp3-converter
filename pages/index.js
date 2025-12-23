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
      backgroundColor: '#e3f2fd', // ΤΟ ΜΠΛΕ ΦΟΝΤΟ ΠΟΥ ΖΗΤΗΣΕΣ
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontFamily: 'sans-serif',
      margin: 0,
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '20px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ color: '#0d47a1', marginBottom: '10px' }}>M4A to MP3</h1>
        <p style={{ color: '#555', marginBottom: '30px' }}>Γρήγορη και ιδιωτική μετατροπή ήχου</p>
        
        {!loaded ? (
          <button onClick={load} disabled={loading} style={{ 
            padding: '15px 30px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            borderRadius: '10px', 
            border: 'none', 
            background: '#1976d2', 
            color: 'white',
            fontWeight: 'bold'
          }}>
            {loading ? 'Φόρτωση...' : 'Ενεργοποίηση'}
          </button>
        ) : (
          <div>
            {!outputUrl && !processing && (
              <div style={{ border: '2px dashed #bbdefb', padding: '20px', borderRadius: '10px' }}>
                <input 
                  type="file" 
                  accept=".m4a" 
                  ref={fileInputRef}
                  onChange={(e) => e.target.files[0] && convert(e.target.files[0])} 
                />
              </div>
            )}

            {processing && (
              <div style={{ margin: '20px' }}>
                <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #1976d2', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
                <p>Μετατροπή: <strong>{fileName}</strong></p>
              </div>
            )}

            {outputUrl && (
              <div style={{ marginTop: '10px' }}>
                <h3 style={{ color: '#2e7d32' }}>Έτοιμο!</h3>
                <audio src={outputUrl} controls style={{ width: '100%', marginBottom: '20px' }} />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <a 
                    href={outputUrl} 
                    download={fileName.replace('.m4a', '.mp3')} 
                    style={{ padding: '12px 20px', background: '#2e7d32', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}
                  >
                    Λήψη MP3
                  </a>
                  <button onClick={resetConverter} style={{ padding: '12px 20px', background: '#757575', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Νέο Αρχείο
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}