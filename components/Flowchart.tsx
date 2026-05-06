'use client';

import React from 'react';
import { useGame } from '../context/GameContext';

interface FlowchartProps {
  onClose: () => void;
}

export const Flowchart: React.FC<FlowchartProps> = ({ onClose }) => {
  const { scenes, state, jumpToScene } = useGame();
  
  const handleNodeClick = (id: number | string) => {
    if (state.unlockedScenes.includes(id)) {
      jumpToScene(id);
      onClose();
    }
  };

  return (
    <div className="flowchart-overlay">
      <div className="flowchart-header">
        <h2>剧情线索图</h2>
        <button className="close-btn" onClick={onClose}>关闭</button>
      </div>
      
      <div className="flowchart-canvas">
        <div className="nodes-container">
          {scenes.map((scene, index) => {
            const isUnlocked = state.unlockedScenes.includes(scene.scene_id);
            return (
              <div key={scene.scene_id} className="node-wrapper">
                <div 
                  className={`node ${isUnlocked ? 'unlocked' : 'locked'}`}
                  onClick={() => handleNodeClick(scene.scene_id)}
                >
                  <div className="node-content">
                    <span className="id">{scene.scene_id}</span>
                    <span className="title">{isUnlocked ? scene.simple_description : '???'}</span>
                  </div>
                  {isUnlocked && <div className="pulse-ring"></div>}
                </div>
                {index < scenes.length - 1 && <div className="connector"></div>}
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .flowchart-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          z-index: 100;
          display: flex;
          flex-direction: column;
          color: white;
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.1); }
          to { opacity: 1; transform: scale(1); }
        }
        .flowchart-header {
          padding: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 215, 0, 0.2);
        }
        .flowchart-header h2 {
          font-size: 2rem;
          color: #ffd700;
          letter-spacing: 4px;
        }
        .close-btn {
          background: none;
          border: 1px solid #ffd700;
          color: #ffd700;
          padding: 8px 24px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .close-btn:hover {
          background: #ffd700;
          color: black;
        }
        .flowchart-canvas {
          flex: 1;
          overflow: auto;
          padding: 60px;
          display: flex;
          justify-content: center;
        }
        .nodes-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
        }
        .node-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
        }
        .node {
          width: 180px;
          height: 100px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          padding: 10px;
        }
        .unlocked {
          background: rgba(255, 215, 0, 0.1);
          border: 2px solid #ffd700;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
        }
        .unlocked:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 10px 30px rgba(255, 215, 0, 0.4);
        }
        .locked {
          background: rgba(255, 255, 255, 0.05);
          border: 2px dashed rgba(255, 255, 255, 0.1);
          cursor: not-allowed;
          opacity: 0.5;
        }
        .node-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .id {
          font-size: 0.8rem;
          color: rgba(255, 215, 0, 0.6);
          font-family: monospace;
        }
        .title {
          font-size: 1rem;
          font-weight: bold;
        }
        .connector {
          width: 2px;
          height: 40px;
          background: linear-gradient(to bottom, #ffd700, transparent);
        }
        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid #ffd700;
          border-radius: 12px;
          animation: pulse 2s infinite;
          pointer-events: none;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
