'use client';

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

interface InteractionOverlayProps {
  videoProgress: { current: number; duration: number };
}

export const InteractionOverlay: React.FC<InteractionOverlayProps> = ({ videoProgress }) => {
  const { state, currentScene, setCurrentScene, addToInventory, updateAffection, getItemById } = useGame();
  const [notification, setNotification] = useState<{ text: string; color: string } | null>(null);
  const [hoveredOption, setHoveredOption] = useState<any>(null);

  if (!currentScene || !currentScene.is_interactive) return null;

  const { interaction_type: type, interaction_config: config } = currentScene;

  // QTE Logic: Check if we are in the QTE time window
  const isQTEActive = type === 'qte' && 
                      config?.duration && 
                      videoProgress.duration > 0 && 
                      videoProgress.current >= videoProgress.duration - config.duration;

  // Visibility logic: Most interactions show immediately, QTE shows only when active
  const shouldShow = type === 'qte' ? isQTEActive : true;

  if (!shouldShow) return null;

  const handleOptionClick = (option: any) => {
    // Character affection logic (keep it generic or data-driven later)
    if (option.text?.includes('救') || option.text?.includes('买下')) {
      const char = currentScene.detailed_description?.includes('甄姬') ? '甄姬' : 
                   currentScene.detailed_description?.includes('小乔') ? '小乔' : '系统';
      showAffectionGain(char, 1);
    }
    
    if (type === 'qte') showAffectionGain('刘备', 1);

    if (option.item) {
      addToInventory(option.item);
      const itemData = getItemById(option.item);
      if (itemData) {
        setNotification({ text: `获得物品：${itemData.name}`, color: '#ffd700' });
        setTimeout(() => setNotification(null), 3000);
      }
    }
    
    setTimeout(() => setCurrentScene(option.leads_to), 300);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (type === 'qte' && config?.layout === 'full_screen') {
      const firstOption = currentScene.options?.[0];
      if (firstOption) handleOptionClick(firstOption);
    }
  };

  const showAffectionGain = (name: string, value: number) => {
    setNotification({ text: `${name} 好感度 +${value}`, color: '#ffd700' });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div 
      className={`overlay-container ${isQTEActive ? 'qte-active' : ''} type-${type}`}
      onClick={handleOverlayClick}
    >
      {notification && (
        <div className="affection-toast">
          <div className="toast-icon">✨</div>
          <div className="toast-text">{notification.text}</div>
        </div>
      )}

      <div className="interaction-content">
        
        {/* QTE Progress Bar */}
        {type === 'qte' && isQTEActive && (
          <div className="qte-container">
            <div className="qte-prompt">{config.qte_text || '快速行动！'}</div>
            <div className="qte-progress-wrapper">
              <div className="qte-node left"></div>
              <div className="qte-bar-bg">
                <div 
                  className="qte-bar-fill" 
                  style={{ animationDuration: `${config.duration}s` }}
                ></div>
              </div>
              <div className="qte-node right"></div>
            </div>
          </div>
        )}

        {/* Hotspot Layer (Polygonal) */}
        {type === 'hotspots' && (
          <div className="hotspot-layer">
            {config.hint_text && <div className="hotspot-hint">{config.hint_text}</div>}
            
            {/* 1. Magnifier Layer (Zoom Effect) */}
            {hoveredOption?.effect === 'zoom' && (
              <div 
                className="magnifier-lens"
                style={{
                  clipPath: `polygon(${hoveredOption.points.map((p: any) => `${p[0]}% ${p[1]}%`).join(', ')})`,
                  '--zoom-scale': hoveredOption.scale || 1.02
                } as any}
              >
                <video 
                  src={currentScene.video_file ? `/videos/segments/${currentScene.video_file}` : `/videos/segments/scene_${String(currentScene.scene_id).padStart(2, '0')}.dat`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(var(--zoom-scale, 1.02))`,
                    transformOrigin: `${hoveredOption.points[0][0]}% ${hoveredOption.points[0][1]}%`
                  }}
                  autoPlay
                  muted
                  loop
                  ref={(el) => {
                    if (el) {
                      const mainVideo = document.querySelector('video.video-layer') as HTMLVideoElement;
                      if (mainVideo) el.currentTime = mainVideo.currentTime;
                    }
                  }}
                />
              </div>
            )}

            <svg className="hotspot-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <filter id="hotspotGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feMorphology operator="dilate" radius="1.2" in="SourceAlpha" result="thicken" />
                  <feGaussianBlur in="thicken" stdDeviation="3" result="blurred" />
                  <feFlood floodColor="var(--glow-color, #ffd700)" floodOpacity="0.8" result="glowColor" />
                  <feComposite in="glowColor" in2="blurred" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {currentScene.options?.filter(opt => !config?.filter_collected || !state.inventory.includes(opt.item || '')).map((option, index) => {
                if (!option.points) return null;
                const pointsStr = option.points.map(p => p.join(',')).join(' ');
                
                return (
                  <polygon
                    key={index}
                    points={pointsStr}
                    className={`hotspot-polygon ${hoveredOption === option ? 'active' : ''}`}
                    style={{ 
                      '--glow-color': option.color || '#ffd700',
                      // If effect is zoom, we hide the glow
                      filter: option.effect === 'zoom' ? 'none' : 'url(#hotspotGlow)',
                      opacity: option.effect === 'zoom' ? (hoveredOption === option ? 1 : 0) : 1
                    } as any}
                    onMouseEnter={() => setHoveredOption(option)}
                    onMouseLeave={() => setHoveredOption(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptionClick(option);
                    }}
                  />
                );
              })}
            </svg>

            {/* Continue Button logic */}
            {(() => {
              const options = currentScene.options || [];
              if (options.length === 0) return null;

              // Check if all items defined in options are present in inventory
              const isAllCollected = options.every(opt => {
                if (!opt.item) return true; // Skip options that don't grant items
                return state.inventory.includes(opt.item);
              });

              const targetScene = config?.all_collected_leads_to;

              if (isAllCollected && targetScene) {
                return (
                  <div 
                    className="continue-knob-container"
                    onClick={() => setCurrentScene(targetScene)}
                  >
                    <div className="continue-text">继续</div>
                    <div className="continue-arrow">→</div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Standard Choice List */}
        {type === 'choice' && (
          <div className="options-container">
            <div className="choice-list">
              {currentScene.options?.map((option, index) => (
                <button 
                  key={index} 
                  className="choice-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionClick(option);
                  }}
                >
                  <span className="choice-text">{option.text}</span>
                  <div className="choice-border"></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Floating Label for Hotspots */}
        {hoveredOption && type === 'hotspots' && (
          <div 
            className="hotspot-floating-label"
            style={{ 
              left: `${hoveredOption.points?.[0][0]}%`, 
              top: `${hoveredOption.points?.[0][1]}%` 
            }}
          >
            {getItemById(hoveredOption.item)?.name || hoveredOption.item || hoveredOption.text}
          </div>
        )}
      </div>

      <style jsx>{`
        .overlay-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .overlay-container.qte-active, .type-hotspots, .type-choice {
          pointer-events: auto;
        }

        .interaction-content {
          width: 100%;
          height: 100%;
          position: relative;
        }

        /* QTE Styles */
        .qte-container {
          position: absolute;
          bottom: 15%;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          animation: qteFadeIn 0.5s ease-out;
        }
        @keyframes qteFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .qte-prompt {
          color: #ffd700;
          font-size: 1.4rem;
          letter-spacing: 4px;
          text-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
        }

        .qte-progress-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 500px;
        }

        .qte-node {
          width: 12px;
          height: 12px;
          background: #ffd700;
          transform: rotate(45deg);
          box-shadow: 0 0 15px #ffd700;
        }

        .qte-bar-bg {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .qte-bar-fill {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, #ffd700, transparent);
          animation: qteShrink linear forwards;
        }

        @keyframes qteShrink {
          from { transform: scaleX(1); opacity: 1; }
          to { transform: scaleX(0); opacity: 0.5; }
        }

        /* Hotspot Styles */
        .hotspot-layer { 
          width: 100%; 
          height: 100%; 
          position: absolute; 
          top: 0; 
          left: 0; 
          pointer-events: none;
        }
        .magnifier-lens {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 5;
          overflow: hidden;
          transition: clip-path 0.2s ease-out;
        }
        .hotspot-svg { width: 100%; height: 100%; display: block; position: absolute; top: 0; left: 0; }
        .hotspot-polygon {
          fill: rgba(255, 215, 0, 0);
          stroke: none;
          cursor: pointer;
          transition: all 0.5s ease;
          pointer-events: auto;
        }
        .hotspot-polygon:hover {
          fill: rgba(255, 215, 0, 0.05);
          filter: url(#hotspotGlow);
        }

        .hotspot-hint {
          position: absolute;
          top: 8%;
          width: 100%;
          text-align: center;
          color: rgba(255, 215, 0, 0.8);
          font-size: 1.2rem;
          letter-spacing: 5px;
          text-shadow: 0 0 10px rgba(0,0,0,1);
          pointer-events: none;
        }

        .hotspot-floating-label {
          position: absolute;
          padding: 8px 16px;
          background: rgba(0,0,0,0.7);
          border: 1px solid #ffd700;
          border-radius: 4px;
          color: #ffd700;
          font-size: 0.9rem;
          transform: translate(-50%, -120%);
          pointer-events: none;
          animation: floatIn 0.3s ease-out;
          white-space: nowrap;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
          z-index: 20;
        }
        @keyframes floatIn { from { opacity: 0; transform: translate(-50%, -100%); } to { opacity: 1; transform: translate(-50%, -120%); } }

        /* Choice Styles */
        .options-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .choice-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 400px;
        }
        .choice-btn {
          position: relative;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 215, 0, 0.2);
          padding: 22px;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.4s;
          overflow: hidden;
          letter-spacing: 2px;
        }
        .choice-btn:hover {
          background: rgba(255, 215, 0, 0.1);
          border-color: #ffd700;
          transform: translateX(10px);
          box-shadow: -5px 0 20px rgba(255, 215, 0, 0.2);
        }

        /* Continue Knob Styles */
        .continue-knob-container {
          position: absolute;
          bottom: 12%;
          right: 6%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.4));
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: breathe 3s infinite ease-in-out;
        }
        .continue-knob-container:hover {
          transform: scale(1.15);
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .continue-text {
          writing-mode: vertical-rl;
          color: #fcf4d9;
          font-size: 2rem;
          font-family: 'Ma Shan Zheng', cursive;
          letter-spacing: 0.3em;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 0 0 25px rgba(255, 215, 0, 0.4);
          font-weight: normal;
          user-select: none;
        }
        .continue-arrow {
          color: #fcf4d9;
          font-size: 2.2rem;
          text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
          animation: arrowSlide 1.5s infinite ease-in-out;
          user-select: none;
          margin-top: -10px;
        }
        @keyframes arrowSlide {
          0% { transform: translateY(0); }
          50% { transform: translateY(10px); }
          100% { transform: translateY(0); }
        }

        /* Affection Toast */
        .affection-toast {
          position: absolute;
          top: 10%;
          right: 5%;
          background: rgba(0,0,0,0.8);
          border: 1px solid #ffd700;
          padding: 15px 30px;
          display: flex;
          align-items: center;
          gap: 15px;
          animation: toastSlide 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 100;
        }
        @keyframes toastSlide { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .toast-icon { font-size: 1.5rem; }
        .toast-text { color: #ffd700; font-size: 1.1rem; letter-spacing: 2px; }
      `}</style>
    </div>
  );
};
