import { useState, useRef } from 'react';

export default function Converter() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const ffmpegRef = useRef(null);
  const fileInputRef = useRef(null); // Ref για να καθαρίζουμε το input αρχείου

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
      console.error(err);
      alert("Αποτυχία φόρτωσης. Δοκιμάστε ξανά.");
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

      // Καθαρισμός εσωτερικών αρχείων FFmpeg για εξοικονόμηση μνήμης
      await ffmpeg.deleteFile('input.m4a');
      await ffmpeg.deleteFile('output.mp3');
    } catch (err) {
      alert("Σφάλμα κατά τη μετατροπή.");
    } finally {
      setProcessing(false);
    }
  };

  // Η συνάρτηση που επαναφέρει την εφαρμογή
  const resetConverter = () => {
    setOutputUrl(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Καθαρίζει το όνομα του αρχείου από το κουμπί
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1 style={{ color: '#333' }}>M4A to MP3 Converter</h1>
      
      {!loaded ? (
        <button onClick={load} disabled={loading} style={{ padding: '12px 25px', fontSize: '16px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: '#0070f3', color: 'white' }}>
          {loading ? 'Φόρτωση...' : 'Ενεργοποίηση Μετατροπέα'}
        </button>
      ) : (
        <div style={{ background: '#f9f9f9', padding: '30px', borderRadius: '15px', display: 'inline-block' }}>
          {!outputUrl && !processing && (
            <>
              <p>Επιλέξτε το αρχείο .m4a για μετατροπή:</p>
              <input 
                type="file" 
                accept=".m4a" 
                ref={fileInputRef}
                onChange={(e) => e.target.files[0] && convert(e.target.files[0])} 
              />
            </>
          )}

          {processing && (
            <div style={{ margin: '20px' }}>
              <p>⏳ Μετατροπή: <strong>{fileName}</strong></p>
              <p>Παρακαλώ περιμένετε...</p>
            </div>
          )}

          {outputUrl && (
            <div style={{ marginTop: '10px' }}>
              <h3 style={{ color: 'green' }}>✓ Ολοκληρώθηκε!</h3>
              <audio src={outputUrl} controls style={{ marginBottom: '20px' }} />
              <br/>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <a 
                  href={outputUrl} 
                  download={fileName.replace('.m4a', '.mp3')} 
                  onClick={() => {
                    // Προαιρετικά: Μπορείς να καλέσεις το reset αυτόματα μετά από 2 δευτερόλεπτα
                    setTimeout(resetConverter, 2000);
                  }}
                  style={{ padding: '12px 20px', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}
                >
                  Download MP3
                </a>
                
                <button 
                  onClick={resetConverter}
                  style={{ padding: '12px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Νέα Μετατροπή
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}