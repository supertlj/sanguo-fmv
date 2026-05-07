'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

interface VideoEngineProps {
  onVideoEnd: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const VideoEngine: React.FC<VideoEngineProps> = ({ onVideoEnd, onTimeUpdate }) => {
  const { currentScene } = useGame();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [isBufferLoading, setIsBufferLoading] = useState(false);

  useEffect(() => {
    if (!currentScene) return;

    const videoSrc = `/videos/segments/${(currentScene.video_file || `scene_${String(currentScene.scene_id).padStart(2, '0')}.mp4`).replace('.mp4', '.dat')}`;

    const loadVideo = async () => {
      setIsBufferLoading(true);
      try {
        // Fetch via JS to ensure IDM doesn't see a raw <video src> or <link> tag first
        const response = await fetch(videoSrc);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        setBlobUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (error) {
        console.error('Failed to load video blob:', error);
      } finally {
        setIsBufferLoading(false);
      }
    };

    loadVideo();
  }, [currentScene?.scene_id]);

  useEffect(() => {
    if (blobUrl && videoRef.current) {
      videoRef.current.src = blobUrl;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'AbortError') {
            console.warn("Playback issue:", error);
          }
        });
      }
    }
  }, [blobUrl]);

  return (
    <div className="video-container">
      {isBufferLoading && (
        <div className="buffer-overlay">
          <div className="mini-spinner"></div>
          <span>正在缓冲时空...</span>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="video-layer active"
        onEnded={onVideoEnd}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          onTimeUpdate?.(video.currentTime, video.duration);
        }}
        playsInline
      />

      <style jsx>{`
        .video-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          background: black;
          overflow: hidden;
        }
        .video-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .buffer-overlay {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,0.5);
          font-size: 12px;
          background: rgba(0,0,0,0.4);
          padding: 5px 12px;
          border-radius: 20px;
          backdrop-filter: blur(5px);
        }
        .mini-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top: 2px solid #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
