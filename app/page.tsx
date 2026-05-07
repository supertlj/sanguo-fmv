'use client';

import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { VideoEngine } from '../components/VideoEngine';
import { InteractionOverlay } from '../components/InteractionOverlay';
import { Flowchart } from '../components/Flowchart';
import { GlobalMenu } from '../components/GlobalMenu';
import { HotspotEditor } from '../components/HotspotEditor';

export default function Home() {
  const { currentScene, setCurrentScene, isLoading, scenes } = useGame();
  const [hasStarted, setHasStarted] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [videoProgress, setVideoProgress] = useState({ current: 0, duration: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleVideoTimeUpdate = (current: number, duration: number) => {
    setVideoProgress({ current, duration });
  };

  const handleVideoEnd = () => {
    if (currentScene) {
      // 1. Priority: Return logic (for flashbacks)
      if (currentScene.return_to_id) {
        setCurrentScene(currentScene.return_to_id);
        return;
      }
      
      // 2. Priority: Explicit leads_to (for linear but complex ID paths)
      if (currentScene.leads_to) {
        setCurrentScene(currentScene.leads_to);
        return;
      }

      // 3. Fallback: For non-interactive scenes, move to the next scene in the registry array
      if (!currentScene.is_interactive && currentScene.scene_id !== 'result_scene') {
        const currentIndex = scenes.findIndex(s => s.scene_id === currentScene.scene_id);
        if (currentIndex !== -1 && currentIndex < scenes.length - 1) {
          const nextScene = scenes[currentIndex + 1];
          setCurrentScene(nextScene.scene_id);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>正在加载三国时空...</p>
        <style jsx>{`
          .loading-screen {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #000;
            color: #fff;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 215, 0, 0.3);
            border-top: 3px solid #ffd700;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="start-screen" onClick={() => setHasStarted(true)}>
        <div className="bg-overlay"></div>
        <div className="content">
          <h1 className="title">代號三國：龍起</h1>
          <p className="subtitle">THE THREE KINGDOMS: REBIRTH</p>
          <div className="start-prompt">点击进入乱世</div>
        </div>
        <style jsx>{`
          .start-screen {
            height: 100vh;
            width: 100vw;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            overflow: hidden;
            position: relative;
          }
          .bg-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, rgba(0,0,0,1) 70%);
          }
          .content {
            z-index: 10;
            text-align: center;
          }
          .title {
            font-size: 4rem;
            color: #ffd700;
            text-shadow: 0 0 20px rgba(255,215,0,0.5);
            margin-bottom: 0.5rem;
            letter-spacing: 0.5rem;
          }
          .subtitle {
            color: rgba(255,255,255,0.5);
            font-size: 1rem;
            letter-spacing: 0.3rem;
            margin-bottom: 4rem;
          }
          .start-prompt {
            color: #fff;
            font-size: 1.5rem;
            letter-spacing: 0.2rem;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.98); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000' }}>
      <div className="game-content-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
        <VideoEngine onVideoEnd={handleVideoEnd} onTimeUpdate={handleVideoTimeUpdate} />
        <InteractionOverlay videoProgress={videoProgress} />
        
        {/* Editor Tool - Hidden by default, toggled via Shift+E */}
        <HotspotEditor onExport={(points) => {
          console.log('Main Page received points:', points);
        }} />
        
        {/* Game Menu Buttons */}
        <div className="game-menu">
          <button className="menu-btn" onClick={() => setShowFlowchart(true)}>
            剧情线图
          </button>
          <button className="menu-btn" onClick={() => setShowMenu(true)}>
            系统菜单
          </button>
        </div>

        {showFlowchart && <Flowchart onClose={() => setShowFlowchart(false)} />}
        {showMenu && <GlobalMenu onClose={() => setShowMenu(false)} />}

        {/* Dev Stats Overlay */}
        <div className="dev-stats">
          Scene: {currentScene?.scene_id} | {currentScene?.simple_description}
        </div>
      </div>

      <style jsx>{`
        .game-menu {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 50;
          display: flex;
          gap: 10px;
        }
        .menu-btn {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 215, 0, 0.4);
          color: #ffd700;
          padding: 8px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s;
        }
        .menu-btn:hover {
          background: rgba(255, 215, 0, 0.2);
          border-color: #ffd700;
        }
        .dev-stats {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0,0,0,0.5);
          color: rgba(255,255,255,0.5);
          padding: 5px 10px;
          font-size: 12px;
          pointer-events: none;
        }
      `}</style>
    </main>
  );
}
