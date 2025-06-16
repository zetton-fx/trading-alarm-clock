import React, { useState, useEffect } from 'react';
import { AppSettings, defaultSettings } from '../../../shared/types/settings';
import { useSettingsStore } from '../store/settingsStore';

const SettingsWindow: React.FC = () => {
  const { 
    settings: currentSettings, 
    isLoading,
    saveSettings, 
    resetSettings,
    loadSettings
  } = useSettingsStore();
  
  const [settings, setSettings] = useState<AppSettings>(currentSettings);

  useEffect(() => {
    // 設定ウィンドウが開かれた時に最新の設定を読み込む
    const initializeSettings = async () => {
      await loadSettings();
    };
    initializeSettings();
  }, [loadSettings]);

  useEffect(() => {
    // currentSettingsが更新されたらローカル状態も更新
    console.log('設定ウィンドウ: currentSettingsが更新されました', currentSettings);
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = async () => {
    try {
      await saveSettings(settings);
      window.close();
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings();
      setSettings(defaultSettings);
    } catch (error) {
      console.error('設定のリセットに失敗しました:', error);
    }
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      backgroundColor: 'white',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '20px',
        paddingBottom: '10px'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* ヘッダー */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px' 
          }}>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              margin: 0 
            }}>
              設定
            </h1>
          </div>

          {/* 表示設定 */}
          <section style={{ marginBottom: '20px' }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '12px' 
            }}>
              表示設定
            </h2>
            
            {/* サイズ */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#4b5563',
                marginBottom: '8px' 
              }}>
                サイズ
              </label>
              <select
                value={settings.size}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  size: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value={1}>最小 (350x200)</option>
                <option value={2}>小 (400x225)</option>
                <option value={3}>中 (450x250)</option>
                <option value={4}>大 (500x275)</option>
                <option value={5}>最大 (550x300)</option>
              </select>
            </div>

            {/* 日時表示形式 */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#4b5563',
                marginBottom: '8px' 
              }}>
                日時表示形式
              </label>
              <select
                value={settings.displayFormat}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  displayFormat: e.target.value as 'datetime' | 'time' 
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="datetime">日付と時刻</option>
                <option value="time">時刻のみ</option>
              </select>
            </div>

            {/* 常に前面表示 */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={settings.alwaysOnTop}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    alwaysOnTop: e.target.checked 
                  }))}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563' }}>
                  常に前面に表示
                </span>
              </label>
            </div>
          </section>

          {/* テーマ設定 */}
          <section style={{ marginBottom: '20px' }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '12px' 
            }}>
              テーマ
            </h2>
            
            {/* 文字色 */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#4b5563',
                marginBottom: '8px' 
              }}>
                文字色
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    textColor: e.target.value 
                  }))}
                  style={{
                    width: '48px',
                    height: '40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={settings.textColor}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    textColor: e.target.value 
                  }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* 背景色 */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#4b5563',
                marginBottom: '8px' 
              }}>
                背景色
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    backgroundColor: e.target.value 
                  }))}
                  style={{
                    width: '48px',
                    height: '40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    backgroundColor: e.target.value 
                  }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* 発光色 */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#4b5563',
                marginBottom: '8px' 
              }}>
                発光色
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="color"
                  value={settings.glowColor}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    glowColor: e.target.value 
                  }))}
                  style={{
                    width: '48px',
                    height: '40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={settings.glowColor}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    glowColor: e.target.value 
                  }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* フォント */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#4b5563',
                marginBottom: '8px' 
              }}>
                フォント
              </label>
              <select
                value={settings.font}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  font: e.target.value as AppSettings['font'] 
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <optgroup label="DSEG7 フォント">
                  <option value="DSEG7Classic">DSEG7 Classic</option>
                  <option value="DSEG7ClassicMini">DSEG7 Classic Mini</option>
                  <option value="DSEG7Modern">DSEG7 Modern</option>
                  <option value="DSEG7ModernMini">DSEG7 Modern Mini</option>
                </optgroup>
                <optgroup label="DSEG14 フォント">
                  <option value="DSEG14Classic">DSEG14 Classic</option>
                  <option value="DSEG14ClassicMini">DSEG14 Classic Mini</option>
                  <option value="DSEG14Modern">DSEG14 Modern</option>
                  <option value="DSEG14ModernMini">DSEG14 Modern Mini</option>
                </optgroup>
                <optgroup label="システムフォント">
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                  <option value="Impact">Impact</option>
                  <option value="Lucida Console">Lucida Console</option>
                  <option value="Tahoma">Tahoma</option>
                  <option value="Palatino">Palatino</option>
                  <option value="Garamond">Garamond</option>
                  <option value="Bookman">Bookman</option>
                  <option value="Avant Garde">Avant Garde</option>
                </optgroup>
                <optgroup label="日本語フォント">
                  <option value="Hiragino Sans">Hiragino Sans</option>
                  <option value="Meiryo">Meiryo</option>
                  <option value="Noto Sans JP">Noto Sans JP</option>
                  <option value="Yu Gothic">Yu Gothic</option>
                  <option value="MS Gothic">MS Gothic</option>
                  <option value="MS Mincho">MS Mincho</option>
                </optgroup>
              </select>
            </div>

            {/* フォントウェイト */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#4b5563',
                marginBottom: '8px' 
              }}>
                フォントウェイト
              </label>
              <select
                value={settings.fontWeight}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  fontWeight: e.target.value as AppSettings['fontWeight'] 
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="light">Light (軽い)</option>
                <option value="regular">Regular (標準)</option>
                <option value="bold">Bold (太字)</option>
              </select>
            </div>

            {/* フォントスタイル */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#4b5563',
                marginBottom: '8px' 
              }}>
                フォントスタイル
              </label>
              <select
                value={settings.fontStyle}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  fontStyle: e.target.value as AppSettings['fontStyle'] 
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="normal">Normal (標準)</option>
                <option value="italic">Italic (斜体)</option>
              </select>
            </div>

            {/* 発光強度 */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500',
                color: '#4b5563',
                marginBottom: '8px' 
              }}>
                文字の発光強度: {settings.glowIntensity}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={settings.glowIntensity}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  glowIntensity: Number(e.target.value) 
                }))}
                style={{ width: '100%' }}
              />
            </div>
          </section>
        </div>
      </div>

      {/* ボタン - 一番下に固定 */}
      <div style={{ 
        padding: '16px 20px 20px 20px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: 'white',
        flexShrink: 0,
        boxShadow: '0 -1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto',
          display: 'flex', 
          justifyContent: 'space-between'
        }}>
          <button
            onClick={handleReset}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              color: '#4b5563',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            リセット
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '8px 16px',
                color: '#4b5563',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsWindow; 