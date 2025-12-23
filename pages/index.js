import { useState, useRef } from 'react';

export default function AudioConverter() {
  const [loaded, setLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const ffmpegRef = useRef(null);

  const load = async () => {
    // Χρησιμοποιούμε την έκδοση 0.11.6 που είναι πιο σταθερή
    const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
    const ffmpeg = createFFmpeg({ log: true });
    
    await ffmpeg.load();
    ffmpegRef.current = ffmpeg;
    setLoaded(true);
  };

  const convertToMp3 = async (file) => {
    if (!loaded) return;
    setProcessing(true);
    
    const ffmpeg = ffmpegRef.current;
    const { fetchFile } = await import('@ffmpeg/util');

    const inputName = 'input.m4a';
    const outputName = 'output.mp3';

    try {
      // Γράψιμο αρχείου
      ffmpeg.FS('writeFile', inputName, await fetchFile(file));

      // Εκτέλεση μετατροπής
      await ffmpeg.run('-i', inputName, '-acodec', 'libmp3lame', outputName);

      // Διάβασμα αποτελέσματος
      const data = ffmpeg.FS('readFile', outputName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
      
      setOutputUrl(url);

      // Καθαρισμός μνήμης αμέσως μετά
      ffmpeg.FS('unlink', inputName);
      ffmpeg.FS('unlink', outputName);
    } catch (err) {
      console.error(err);
      alert("Σφάλμα μνήμης. Δοκιμάστε ένα μικρότερο αρχείο.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>M4A to MP3 (Stable Version)</h1>
      
      {!loaded ? (
        <button onClick={load} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Φόρτωση Μετατροπέα
        </button>
      ) : (
        <div>
          <input 
            type="file" 
            accept=".m4a" 
            onChange={(e) => e.target.files[0] && convertToMp3(e.target.files[0])} 
            disabled={processing}
          />
          {processing && <p>Η μετατροπή ξεκίνησε... Παρακαλώ περιμένετε.</p>}
        </div>
      )}

      {outputUrl && (
        <div style={{ marginTop: '30px' }}>
          <audio src={outputUrl} controls />
          <br />
          <a href={outputUrl} download="converted.mp3">
            <button style={{ marginTop: '10px', padding: '10px 20px', background: 'green', color: 'white' }}>
              Download MP3
            </button>
          </a>
        </div>
      )}
    </div>
  );
}