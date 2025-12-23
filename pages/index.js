import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function AudioConverter() {
  const [loaded, setLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const ffmpegRef = useRef(new FFmpeg());

  // Φόρτωση του FFmpeg library
  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    setLoaded(true);
  };

  const convertToMp3 = async (file) => {
    if (!loaded) await load();
    
    setProcessing(true);
    const ffmpeg = ffmpegRef.current;
    const inputName = 'input.m4a';
    const outputName = 'output.mp3';

    // Γράψσιμο του αρχείου στη μνήμη του ffmpeg
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Εκτέλεση της εντολής μετατροπής
    // -i: input, -acodec: codec για mp3
    await ffmpeg.exec(['-i', inputName, '-acodec', 'libmp3lame', outputName]);

    // Ανάγνωση του αποτελέσματος
    const data = await ffmpeg.readFile(outputName);
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));
    
    setOutputUrl(url);
    setProcessing(false);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>M4A to MP3 Converter</h1>
      <p>Η μετατροπή γίνεται τοπικά στον browser σας!</p>
      
      {!loaded && <button onClick={load}>Ενεργοποίηση Converter</button>}

      {loaded && (
        <div style={{ marginTop: '20px' }}>
          <input 
            type="file" 
            accept=".m4a" 
            onChange={(e) => e.target.files[0] && convertToMp3(e.target.files[0])} 
            disabled={processing}
          />
        </div>
      )}

      {processing && <p>Παρακαλώ περιμένετε, η μετατροπή είναι σε εξέλιξη...</p>}

      {outputUrl && (
        <div style={{ marginTop: '30px' }}>
          <h3>Έτοιμο!</h3>
          <audio src={outputUrl} controls />
          <br />
          <a href={outputUrl} download="converted.mp3">
            <button style={{ marginTop: '10px', padding: '10px 20px' }}>Download MP3</button>
          </a>
        </div>
      )}
    </div>
  );
}