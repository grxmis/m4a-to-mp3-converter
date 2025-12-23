import { useState, useRef } from 'react';

export default function Converter() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const ffmpegRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();

      // Χρησιμοποιούμε το JSDelivr που είναι συχνά πιο γρήγορο και σταθερό
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setLoaded(true);
    } catch (err) {
      console.error("FFmpeg Load Error Details:", err);
      alert("Αποτυχία φόρτωσης. Δοκιμάστε 1) Incognito mode 2) Κλείσιμο άλλων καρτελών 3) Έλεγχο του vercel.json");
    } finally {
      setLoading(false);
    }
  };

  const convert = async (file) => {
    setProcessing(true);
    try {
      const { fetchFile } = await import('@ffmpeg/util');
      const ffmpeg = ffmpegRef.current;
      
      await ffmpeg.writeFile('input.m4a', await fetchFile(file));
      await ffmpeg.exec(['-i', 'input.m4a', '-acodec', 'libmp3lame', 'output.mp3']);
      
      const data = await ffmpeg.readFile('output.mp3');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      setOutputUrl(url);
    } catch (err) {
      alert("Σφάλμα κατά τη μετατροπή.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1>M4A to MP3 Converter</h1>
      {!loaded ? (
        <button onClick={load} disabled={loading} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          {loading ? 'Φόρτωση (Παρακαλώ περιμένετε)...' : 'Ενεργοποίηση Μετατροπέα'}
        </button>
      ) : (
        <div>
          <input type="file" accept=".m4a" onChange={(e) => e.target.files[0] && convert(e.target.files[0])} />
          {processing && <p>Μετατροπή σε εξέλιξη...</p>}
        </div>
      )}
      {outputUrl && (
        <div style={{ marginTop: '20px' }}>
          <audio src={outputUrl} controls />
          <br/><br/>
          <a href={outputUrl} download="audio.mp3" style={{ padding: '10px', background: 'green', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
            Download MP3
          </a>
        </div>
      )}
    </div>
  );
}