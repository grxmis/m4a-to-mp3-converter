import { useState, useRef } from 'react';
// Αφαιρούμε τα imports από την κορυφή για να μην χτυπάει ο server
// import { FFmpeg } from '@ffmpeg/ffmpeg'; 

export default function AudioConverter() {
  const [loaded, setLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const ffmpegRef = useRef(null);

  const load = async () => {
    // Φορτώνουμε τις βιβλιοθήκες ΜΟΝΟ όταν πατηθεί το κουμπί (client-side)
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL, fetchFile } = await import('@ffmpeg/util');
    
    const ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    ffmpegRef.current = ffmpeg;
    setLoaded(true);
  };

  const convertToMp3 = async (file) => {
    if (!loaded) return;
    
    setProcessing(true);
    const ffmpeg = ffmpegRef.current;
    const { fetchFile } = await import('@ffmpeg/util'); // Dynamic import και εδώ

    const inputName = 'input.m4a';
    const outputName = 'output.mp3';

    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec(['-i', inputName, '-acodec', 'libmp3lame', outputName]);

    const data = await ffmpeg.readFile(outputName);
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
    
    setOutputUrl(url);
    setProcessing(false);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>M4A to MP3 Converter</h1>
      
      {!loaded ? (
        <button onClick={load} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Ενεργοποίηση Converter (WebAssembly)
        </button>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <input 
            type="file" 
            accept=".m4a" 
            onChange={(e) => e.target.files[0] && convertToMp3(e.target.files[0])} 
            disabled={processing}
          />
        </div>
      )}

      {processing && <p style={{ color: 'blue' }}>Μετατροπή σε εξέλιξη... Παρακαλώ περιμένετε.</p>}

      {outputUrl && (
        <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '20px' }}>
          <h3>Το MP3 σας είναι έτοιμο!</h3>
          <audio src={outputUrl} controls />
          <br />
          <a href={outputUrl} download="converted.mp3">
            <button style={{ marginTop: '10px', padding: '10px 20px', background: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Download MP3
            </button>
          </a>
        </div>
      )}
    </div>
  );
}