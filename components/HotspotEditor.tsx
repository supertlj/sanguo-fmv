'use client';

import React, { useState, useEffect } from 'react';

interface HotspotEditorProps {
  onExport: (points: [number, number][]) => void;
}

export const HotspotEditor: React.FC<HotspotEditorProps> = ({ onExport }) => {
  const [points, setPoints] = useState<[number, number][]>([]);
  const [active, setActive] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'E' && e.shiftKey) {
        setActive(!active);
        console.log('Hotspot Editor:', !active ? 'ENABLED' : 'DISABLED');
      }
      if (active) {
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
          setPoints(prev => prev.slice(0, -1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  const handleClick = (e: React.MouseEvent) => {
    if (!active) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Round to 2 decimal places for cleanliness
    const newPoint: [number, number] = [parseFloat(x.toFixed(2)), parseFloat(y.toFixed(2))];
    setPoints([...points, newPoint]);
  };

  const handleExport = () => {
    const jsonString = JSON.stringify(points);
    console.log('EXPORTED POINTS:', jsonString);
    navigator.clipboard.writeText(jsonString);
    alert('坐标已复制到剪贴板！可以直接粘贴到 JSON 中。');
    onExport(points);
  };

  const clear = () => {
    if (confirm('确定清空当前点位吗？')) setPoints([]);
  };

  if (!active) return (
    <div className="editor-toggle-hint">
      按 <kbd>Shift + E</kbd> 开启热点编辑器
      <style jsx>{`
        .editor-toggle-hint {
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.5);
          color: rgba(255,255,255,0.4);
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 10px;
          z-index: 1000;
          pointer-events: none;
        }
        kbd {
          background: #444;
          padding: 2px 4px;
          border-radius: 3px;
          color: #fff;
        }
      `}</style>
    </div>
  );

  return (
    <div className="hotspot-editor-overlay" onClick={handleClick}>
      {/* SVG Canvas for drawing */}
      <svg className="editor-canvas" viewBox="0 0 100 100" preserveAspectRatio="none">
        {points.length > 0 && (
          <polyline
            points={points.map(p => p.join(',')).join(' ')}
            fill="rgba(255, 215, 0, 0.2)"
            stroke="#ffd700"
            strokeWidth="0.5"
          />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="0.5" fill="#fff" />
        ))}
      </svg>

      {/* Control Panel */}
      <div className="editor-controls" onClick={e => e.stopPropagation()}>
        <div className="editor-header">热点勾勒大师 Pro</div>
        <div className="points-count">当前点数: {points.length}</div>
        <div className="actions">
          <button onClick={() => setPoints(prev => prev.slice(0, -1))}>撤销 (Ctrl+Z)</button>
          <button onClick={clear}>清空</button>
          <button className="export-btn" onClick={handleExport}>导出 JSON</button>
        </div>
        <div className="editor-hint">点击屏幕添加顶点，勾勒出物品轮廓</div>
      </div>

      <style jsx>{`
        .hotspot-editor-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 9999;
          cursor: crosshair;
          background: rgba(255, 215, 0, 0.05);
        }
        .editor-canvas {
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .editor-controls {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #1a1a1a;
          border: 1px solid #ffd700;
          padding: 20px;
          border-radius: 8px;
          color: white;
          width: 240px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .editor-header {
          font-weight: bold;
          color: #ffd700;
          border-bottom: 1px solid #333;
          padding-bottom: 10px;
          text-align: center;
        }
        .points-count {
          font-size: 0.9rem;
          color: #aaa;
        }
        .actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        button {
          background: #333;
          border: none;
          color: white;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        button:hover { background: #444; }
        .export-btn {
          background: #ffd700;
          color: #000;
          font-weight: bold;
        }
        .export-btn:hover { background: #ffcc00; }
        .editor-hint {
          font-size: 0.75rem;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};
