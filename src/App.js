import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import './App.css';

const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

export default function App() {
  const videoRef = useRef(null);
  const [emotion, setEmotion] = useState(null);
  const [suggestedSongs, setSuggestedSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState(null);

  const moodQueries = {
    happy: [
      "Bollywood latest upbeat songs 2025 Arijit Singh Neha Kakkar",
      "Bollywood party songs 2025 upbeat hits",
      "Fun Hindi songs 2025 peppy Bollywood"
    ],
    sad: [
      "Bollywood sad songs 2025 Arijit Singh Atif Aslam",
      "Emotional Hindi songs 2025",
      "Melancholic Bollywood songs 2025"
    ],
    angry: [
      "Energetic Hindi rock workout songs Bollywood 2025",
      "Hindi power songs 2025 high energy",
      "Bollywood action intense music 2025"
    ],
    surprised: [
      "Fun Bollywood songs 2025 playful peppy hits",
      "Hindi dance hits 2025",
      "Bollywood fun upbeat mix 2025"
    ],
    neutral: [
      "Chill Hindi acoustic or soft Bollywood songs 2025",
      "Bollywood calm relaxing songs 2025",
      "Hindi mellow songs 2025"
    ],
    fearful: [
      "Calm Hindi instrumental songs relaxing background music",
      "Soft Hindi meditation music 2025",
      "Relaxing Hindi spa songs 2025"
    ],
    disgusted: [
      "Indie Hindi songs 2025 soulful mellow tracks",
      "Hindi indie soft fusion songs 2025",
      "Alternative Bollywood calm songs 2025"
    ],
    fallback: [
      "Top trending Bollywood Hindi songs 2025"
    ]
  };

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri(`${process.env.PUBLIC_URL}/models`);
      await faceapi.nets.faceExpressionNet.loadFromUri(`${process.env.PUBLIC_URL}/models`);      
      startVideo();
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
    });
  };

  const detectMood = async () => {
    setLoading(true);
    setSuggestedSongs([]);
    setPlayingVideoId(null);

    if (videoRef.current) {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      let topEmotion = "fallback";

      if (detections && detections.expressions) {
        topEmotion = Object.entries(detections.expressions)
          .sort((a, b) => b[1] - a[1])[0][0];
        setEmotion(topEmotion);
      } else {
        setEmotion("No face detected — showing trending Hindi songs");
      }

      await fetchSongs(topEmotion);
    }

    setLoading(false);
  };

  const fetchSongs = async (emotion) => {
    const apiKey = "AIzaSyCAmjEEZjbxfcP8qktcPDeg497X2nEOFq0"; // 🔹 Replace with your key
    const queries = moodQueries[emotion] || moodQueries.fallback;
    const query = queries[Math.floor(Math.random() * queries.length)];

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&regionCode=IN&maxResults=20&key=${apiKey}`
    );
    const data = await res.json();

    if (data.items && data.items.length > 0) {
      const filtered = data.items
        .filter(item => item.id.videoId)
        .map(item => ({
          title: item.snippet.title,
          videoId: item.id.videoId,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url
        }));

      const shuffled = shuffleArray(filtered).slice(0, 10);
      setSuggestedSongs(shuffled);
    }
  };

  return (
    <div className="app-container">
      <h1> ✨ShiNe✨ </h1>

      <div className="video-container">
        <video ref={videoRef} autoPlay muted width="300" />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={detectMood}>Detect Mood</button>
          <button onClick={() => { setSuggestedSongs([]); setEmotion(null); setPlayingVideoId(null); }} style={{backgroundColor:'#ef4444'}}>Reset</button>
        </div>
      </div>

      {loading && <p className="status">Detecting mood & fetching songs...</p>}
      {emotion && !loading && <p className="status">{emotion}</p>}

      <div className="grid-container">
        {suggestedSongs.map((song) => (
          <div key={song.videoId} className="song-tile">
            {playingVideoId === song.videoId ? (
              <iframe
                width="100%"
                height="180"
                src={`https://www.youtube.com/embed/${song.videoId}?autoplay=1`}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            ) : (
              <img
                src={song.thumbnail}
                alt={song.title}
                onClick={() => setPlayingVideoId(song.videoId)}
              />
            )}
            <div className="song-content">
              <p>{song.title}</p>
              <a href={song.url} target="_blank" rel="noopener noreferrer">Open in YouTube</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
