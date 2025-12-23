import { useState, useRef } from 'react';

export default function AudioConverter() {
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
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core-dist@0.12.6/dist/umd';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        // Αυτό βοηθάει αν ο browser έχει θέμα μνήμης
        classWorkerURL: await toBlobURL(`${baseURL}/ffmpeg-worker.js`, 'text/javascript'),
      });

      ffmpegRef.current = ffmpeg;
      setLoaded(true);
    } catch (err) {
      console.error(err);
      alert("Αποτυχία μνήμης. Κλείστε άλλες καρτέλες στον browser και δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  const convertToMp3 = async (file) => {
    if (!loaded) return;
    setProcessing(true);
    const ffmpeg = ffmpegRef.current;
    const { fetchFile } = await import('@ffmpeg/util');

    try {
      await ffmpeg.writeFile('input.m4a', await fetchFile(file));
      
      // Χρησιμοποιούμε πολύ απλές ρυθμίσεις για να μην κρασάρει
      await ffmpeg.exec(['-i', 'input.m4a', '-vn', '-ab', '128k', 'output.mp3']);

      const data = await ffmpeg.readFile('output.mp3');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      setOutputUrl(url);
      
      // Καθαρισμός μνήμης
      await ffmpeg.deleteFile('input.m4a');
      await ffmpeg.deleteFile('output.mp3');
    } catch (err) {
      console.error(err);
      alert("Η μετατροπή απέτυχε λόγω έλλειψης μνήμης.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'sans-serif' }}>
      <h2>M4A to MP3 Converter</h2>
      {!loaded ? (
        <button onClick={load} disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Φόρτωση...' : 'Ενεργοποίηση'}
        </button>
      ) : (
        <div>
          <input type="file" accept=".m4a" onChange={(e) => e.target.files[0] && convertToMp3(e.target.files[0])} />
          {processing && <p>Μετατροπή... παρακαλώ περιμένετε.</p>}
        </div>
      )}
      {outputUrl && (
        <div style={{ marginTop: '20px' }}>
          <audio src={outputUrl} controls />
          <br/><br/>
          <a href={outputUrl} download="audio.mp3" style={{ background: 'green', color: 'white', padding: '10px', borderRadius: '5px', textDecoration: 'none' }}>
            Download MP3
          </a>
        </div>
      )}
    </div>
  );
}