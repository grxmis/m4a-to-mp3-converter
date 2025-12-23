import { useState, useRef } from 'react';

export default function AudioConverter() {
  const [loaded, setLoaded] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [error, setError] = useState(null);
  const ffmpegRef = useRef(null);

  // Φόρτωση της βιβλιοθήκης FFmpeg
  const loadLibrary = async () => {
    setLoadingLibrary(true);
    setError(null);
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      
      const ffmpeg = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      ffmpegRef.current = ffmpeg;
      setLoaded(true);
    } catch (err) {
      console.error(err);
      setError("Αποτυχία φόρτωσης της βιβλιοθήκης. Βεβαιωθείτε ότι το vercel.json είναι σωστό.");
    } finally {
      setLoadingLibrary(false);
    }
  };

  const convertToMp3 = async (file) => {
    if (!loaded) return;
    
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    
    try {
      const ffmpeg = ffmpegRef.current;
      const { fetchFile } = await import('@ffmpeg/util');

      const inputName = 'input.m4a';
      const outputName = 'output.mp3';

      // Γράψιμο του αρχείου στη virtual μνήμη
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Εκτέλεση μετατροπής με ασφαλείς παραμέτρους για αποφυγή crash
      // -vn: αφαιρεί τυχόν video/album art που μπλοκάρει τη μνήμη
      // -acodec libmp3lame: ο encoder για mp3
      await ffmpeg.exec([
        '-i', inputName,
        '-vn',
        '-acodec', 'libmp3lame',
        '-ac', '2',
        '-ar', '44100',
        outputName
      ]);

      // Ανάγνωση του τελικού αρχείου
      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      
      setOutputUrl(url);

      // ΚΑΘΑΡΙΣΜΟΣ: Διαγραφή αρχείων από τη virtual μνήμη για αποφυγή Access Violation
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

    } catch (err) {
      console.error(err);
      setError("Σφάλμα κατά τη μετατροπή. Δοκιμάστε με μικρότερο αρχείο ή ανανεώστε τη σελίδα.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '50px auto', 
      textAlign: 'center', 
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
      border: '1px solid #eee',
      borderRadius: '15px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ color: '#333' }}>M4A to MP3 Converter</h1>
      <p style={{ color: '#666' }}>Η μετατροπή γίνεται τοπικά στον browser σας (Private & Fast)</p>

      <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #eee' }} />

      {!loaded ? (
        <button 
          onClick={loadLibrary} 
          disabled={loadingLibrary}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '7px',
            cursor: 'pointer'
          }}
        >
          {loadingLibrary ? 'Φόρτωση βιβλιοθήκης...' : 'Εκκίνηση Εφαρμογής'}
        </button>
      ) : (
        <div>
          <input 
            type="file" 
            accept=".m4a" 
            onChange={(e) => e.target.files[0] && convertToMp3(e.target.files[0])} 
            disabled={processing}
            style={{ marginBottom: '20px' }}
          />
          {processing && (
            <div style={{ marginTop: '20px' }}>
              <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 2s linear infinite', margin: '0 auto' }}></div>
              <p>Μετατροπή σε εξέλιξη... παρακαλώ μην κλείνετε τη σελίδα.</p>
            </div>
          )}
        </div>
      )}

      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}

      {outputUrl && (
        <div style={{ marginTop: '30px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '10px' }}>
          <h3 style={{ color: 'green' }}>✓ Η μετατροπή ολοκληρώθηκε!</h3>
          <audio src={outputUrl} controls style={{ width: '100%', marginTop: '10px' }} />
          <br />
          <a href={outputUrl} download="converted.mp3" style={{ textDecoration: 'none' }}>
            <button style={{ 
              marginTop: '15px', 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              Λήψη αρχείου MP3
            </button>
          </a>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}