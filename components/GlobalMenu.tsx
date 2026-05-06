'use client';

import React from 'react';
import { useGame } from '../context/GameContext';

interface GlobalMenuProps {
  onClose: () => void;
}

export const GlobalMenu: React.FC<GlobalMenuProps> = ({ onClose }) => {
  const { state, saveGame, loadGame, saveSlots, removeFromInventory, getItemById } = useGame();
  const [activeTab, setActiveTab] = React.useState<'affection' | 'inventory' | 'saveload' | 'settings'>('affection');

  const handleSave = (slotId: string) => {
    saveGame(slotId);
  };

  const handleLoad = (slotId: string) => {
    loadGame(slotId);
    onClose();
  };

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-window" onClick={e => e.stopPropagation()}>
        <div className="menu-sidebar">
          <button 
            className={`tab-btn ${activeTab === 'affection' ? 'active' : ''}`}
            onClick={() => setActiveTab('affection')}
          >
            红颜录
          </button>
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            百宝箱
          </button>
          <button 
            className={`tab-btn ${activeTab === 'saveload' ? 'active' : ''}`}
            onClick={() => setActiveTab('saveload')}
          >
            进度管理
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            设置
          </button>
          <div className="sidebar-footer">
            <button className="exit-btn" onClick={onClose}>返回游戏</button>
          </div>
        </div>

        <div className="menu-content">
          {activeTab === 'affection' && (
            <div className="tab-pane">
              <h2 className="pane-title">红颜录</h2>
              <div className="affection-list">
                {Object.keys(state.affection).length > 0 ? (
                  Object.entries(state.affection).map(([name, value]) => (
                    <div key={name} className="affection-card">
                      <div className="char-avatar">
                        <span className="avatar-text">{name[0]}</span>
                      </div>
                      <div className="char-info">
                        <div className="char-header">
                          <span className="char-name">{name}</span>
                          <span className="char-value">好感度 {value}</span>
                        </div>
                        <div className="affection-bar-bg">
                          <div className="affection-bar-fill" style={{ width: `${Math.min(value * 10, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">尚未邂逅任何红颜</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="tab-pane">
              <h2 className="pane-title">百宝箱</h2>
              <div className="inventory-grid">
                {state.inventory.length > 0 ? (
                  state.inventory.map((itemId, index) => {
                    const item = getItemById(itemId);
                    return (
                      <div key={index} className="inventory-slot group">
                        <div className="slot-icon">{item?.icon || '🎁'}</div>
                        <div className="slot-name">{item?.name || itemId}</div>
                        <button 
                          className="item-delete-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`确定要丢弃 ${item?.name || itemId} 吗？`)) {
                              removeFromInventory(itemId);
                            }
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">囊中羞涩，暂无道具</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'saveload' && (
            <div className="tab-pane">
              <h2 className="pane-title">进度管理</h2>
              <div className="save-slots-list">
                {/* Manual Save Slots (1-4) */}
                {[1, 2, 3, 4].map(num => {
                  const slotId = `slot_${num}`;
                  const slotData = saveSlots.find(s => s.id === slotId);
                  return (
                    <div key={slotId} className="save-slot-card">
                      <div className="slot-info">
                        <div className="slot-title">存档 {num}</div>
                        <div className="slot-desc">
                          {slotData ? `${slotData.sceneDescription} (${new Date(slotData.timestamp).toLocaleString()})` : '空存档'}
                        </div>
                      </div>
                      <div className="slot-actions">
                        <button className="save-btn" onClick={() => handleSave(slotId)}>保存</button>
                        {slotData && <button className="load-btn" onClick={() => handleLoad(slotId)}>加载</button>}
                      </div>
                    </div>
                  );
                })}
                
                {/* Auto Save Slot */}
                {(() => {
                  const autoSlot = saveSlots.find(s => s.id === 'auto');
                  if (autoSlot) {
                    return (
                      <div className="save-slot-card auto-slot">
                        <div className="slot-info">
                          <div className="slot-title">自动存档</div>
                          <div className="slot-desc">
                            {autoSlot.sceneDescription} ({new Date(autoSlot.timestamp).toLocaleString()})
                          </div>
                        </div>
                        <div className="slot-actions">
                          <button className="load-btn" onClick={() => handleLoad('auto')}>加载</button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="tab-pane">
              <h2 className="pane-title">系统设置</h2>
              <div className="settings-list">
                <div className="setting-item">
                  <label>主音量</label>
                  <input type="range" className="gold-slider" />
                </div>
                <div className="setting-item">
                  <label>文字速度</label>
                  <input type="range" className="gold-slider" />
                </div>
                <div className="setting-item">
                  <label>全屏模式</label>
                  <button className="toggle-btn">开启</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(15px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .menu-window {
          width: 900px;
          height: 600px;
          background: rgba(15, 15, 15, 0.95);
          border: 1px solid rgba(255, 215, 0, 0.2);
          box-shadow: 0 0 50px rgba(0,0,0,0.8);
          display: flex;
          overflow: hidden;
          animation: slideUp 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .menu-sidebar {
          width: 200px;
          background: rgba(0, 0, 0, 0.3);
          border-right: 1px solid rgba(255, 215, 0, 0.1);
          display: flex;
          flex-direction: column;
          padding: 40px 0;
        }
        .tab-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          padding: 20px 40px;
          text-align: left;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          letter-spacing: 2px;
        }
        .tab-btn:hover, .tab-btn.active {
          color: #ffd700;
          background: rgba(255, 215, 0, 0.05);
        }
        .tab-btn.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 4px;
          height: 100%;
          background: #ffd700;
        }

        .sidebar-footer {
          margin-top: auto;
          padding: 20px;
        }
        .exit-btn {
          width: 100%;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 10px;
          cursor: pointer;
          transition: 0.3s;
        }
        .exit-btn:hover { border-color: #ffd700; color: #ffd700; }

        .menu-content {
          flex: 1;
          padding: 40px 60px;
          overflow-y: auto;
        }
        .pane-title {
          font-size: 1.8rem;
          color: #ffd700;
          margin-bottom: 40px;
          letter-spacing: 4px;
          border-bottom: 1px solid rgba(255, 215, 0, 0.1);
          padding-bottom: 10px;
        }

        /* Save Slots Styles */
        .save-slots-list { display: flex; flex-direction: column; gap: 15px; }
        .save-slot-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: 0.3s;
        }
        .save-slot-card:hover { border-color: rgba(255, 215, 0, 0.3); }
        .auto-slot { border-left: 4px solid #ffd700; }
        .slot-title { font-weight: bold; color: #ffd700; margin-bottom: 5px; }
        .slot-desc { font-size: 0.85rem; color: rgba(255,255,255,0.5); }
        .slot-actions { display: flex; gap: 10px; }
        .save-btn, .load-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 6px 20px;
          border-radius: 20px;
          cursor: pointer;
          transition: 0.3s;
        }
        .save-btn:hover { background: #ffd700; color: black; border-color: #ffd700; }
        .load-btn:hover { background: #fff; color: black; border-color: #fff; }

        /* Affection Styles */
        .affection-list { display: flex; flex-direction: column; gap: 30px; }
        .affection-card {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 8px;
        }
        .char-avatar {
          width: 60px;
          height: 60px;
          background: #333;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: #ffd700;
          border: 1px solid #ffd700;
        }
        .char-info { flex: 1; }
        .char-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .char-name { font-size: 1.2rem; font-weight: bold; }
        .char-value { color: #ffd700; font-size: 0.9rem; }
        .affection-bar-bg {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        .affection-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffd700, #ff8c00);
          transition: width 1s ease-out;
        }

        /* Inventory Styles */
        .inventory-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .inventory-slot {
          position: relative; /* Fixed: Added relative positioning */
          aspect-ratio: 1;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: 0.3s;
        }
        .inventory-slot:hover {
          background: rgba(255, 215, 0, 0.05);
          border-color: rgba(255, 215, 0, 0.3);
        }
        .slot-icon { font-size: 2rem; }
        .slot-name { font-size: 0.8rem; color: rgba(255,255,255,0.6); text-align: center; padding: 0 5px; }
        .item-delete-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          background: #ff4d4f;
          border: 2px solid #1a1a1a;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          font-size: 16px;
          font-weight: bold;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        .inventory-slot:hover .item-delete-btn {
          opacity: 1;
        }
        .item-delete-btn:hover {
          background: rgba(255, 0, 0, 0.8);
        }

        /* Settings Styles */
        .settings-list { display: flex; flex-direction: column; gap: 30px; }
        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .gold-slider {
          width: 300px;
          accent-color: #ffd700;
        }
        .toggle-btn {
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid #ffd700;
          color: #ffd700;
          padding: 5px 20px;
          cursor: pointer;
        }
        .empty-state {
          text-align: center;
          padding: 100px 0;
          color: rgba(255,255,255,0.2);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};
