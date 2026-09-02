'use client';
import { useRef, useState } from 'react';

export default function Home() {
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // Turn on device rear camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } catch (err) {
      alert("Camera access failed: " + err.message);
    }
  };

  // Capture frame and send to backend route
  const captureAndScan = () => {
    setLoading(true);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    
    const imageBase64 = canvas.toDataURL('image/jpeg');

    fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 })
    })
    .then(res => res.json())
    .then(result => {
      if (result.error) {
        alert("Scan Error: " + result.error);
      } else {
        setData(result);
      }
      setLoading(false);
    })
    .catch((err) => {
      alert("Network Error: " + err.message);
      setLoading(false);
    });
  };

  return (
    <main className="max-w-md mx-auto p-4 flex flex-col items-center min-h-screen bg-slate-50">
      <h1 className="text-2xl font-bold mb-4 text-slate-800">AI Visual Search</h1>

      <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden shadow-lg mb-4">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {!isCameraActive && (
          <button onClick={startCamera} className="absolute inset-0 bg-black/60 text-white font-medium">
            Tap to Open Camera
          </button>
        )}
      </div>

      {isCameraActive && (
        <button 
          onClick={captureAndScan} 
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Scanning & Searching...' : 'Scan Object'}
        </button>
      )}

      {data && (
        <div className="w-full mt-6 p-4 bg-white rounded-2xl border shadow-sm text-slate-700">
          <h2 className="text-xl font-bold text-slate-900">{data.title}</h2>
          <p className="mt-2 text-sm leading-relaxed">{data.summary}</p>
          
          <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-400 mt-4 mb-2">Key Findings</h3>
          <ul className="space-y-1 text-sm">
            {data.facts?.map((fact, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-indigo-500">•</span> {fact}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

