import { useState, useRef } from 'react';

export default function AudioConverter() {
  const [status, setStatus] = useState('idle'); // idle, loading, ready, error
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const ffmpegRef = useRef(null);

  const load = async () => {
    setStatus('loading');
    try {
      const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
      
      // Ορίζουμε ρητά από πού θα κατέβει ο "κινητήρας"
      const ffmpeg = createFFmpeg({ 
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      });
      
      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
      setStatus('ready');
    } catch (err) {
      console.error("FFmpeg Load Error:", err);
      setStatus('error');
    }
  };

  const convertToMp3 = async (file) => {
    if (status !== 'ready') return;
    setProcessing(true);
    setOutputUrl(null);
    
    const ffmpeg = ffmpegRef.current;
    const { fetchFile } = await import('@ffmpeg/util');

    try {
      ffmpeg.FS('writeFile', 'input.m4a', await fetchFile(file));

      // Εντολή μετατροπής
      await ffmpeg.run('-i', 'input.m4a', '-acodec', 'libmp3lame', '-b:a', '192k', 'output.mp3');

      const data = ffmpeg.FS('readFile', 'output.mp3');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      
      setOutputUrl(url);
    } catch (err) {
      console.error("Conversion Error:", err);
      alert("Σφάλμα κατά τη μετατροπή.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>M4A to MP3 Converter</h1>
      
      {status === 'idle' && (
        <button onClick={load} style={{ padding: '15px 30px', fontSize: '18px', cursor: 'pointer', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px' }}>
          Ενεργοποίηση Μετατροπέα
        </button>
      )}

      {status === 'loading' && <p>🔄 Φόρτωση κινητήρα FFmpeg... (παρακαλώ περιμένετε)</p>}
      
      {status === 'error' && (
        <p style={{ color: 'red' }}>❌ Αποτυχία φόρτωσης. Δοκιμάστε να ανανεώσετε τη σελίδα ή ελέγξτε τη σύνδεσή σας.</p>
      )}

      {status === 'ready' && (
        <div style={{ marginTop: '20px' }}>
          <p style={{ color: 'green' }}>✅ Ο μετατροπέας είναι έτοιμος!</p>
          <input 
            type="file" 
            accept=".m4a" 
            onChange={(e) => e.target.files[0] && convertToMp3(e.target.files[0])} 
            disabled={processing}
            style={{ margin: '20px 0' }}
          />
          {processing && <p>⏳ Μετατροπή σε εξέλιξη... Μην κλείσετε το παράθυρο.</p>}
        </div>
      )}

      {outputUrl && (
        <div style={{ marginTop: '40px', padding: '20px', background: '#f0f0f0', borderRadius: '10px' }}>
          <h3>🎉 Έτοιμο!</h3>
          <audio src={outputUrl} controls style={{ marginBottom: '15px' }} />
          <br />
          <a href={outputUrl} download="music.mp3">
            <button style={{ padding: '10px 25px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
              Λήψη MP3
            </button>
          </a>
        </div>
      )}
    </div>
  );
}