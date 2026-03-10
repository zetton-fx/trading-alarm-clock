import React, { useState, useEffect } from 'react';
import { AppSettings, defaultSettings, sizeMappingDateTime, sizeMappingTime } from '../../../shared/types/settings';
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

  // カウントダウン試聴
  const previewCountdown = (pitchBeep: number, pitchBell: number, bellDuration: number, text?: string) => {
    if (text) {
      if ((window as any).electronAPI.platform === 'linux') {
        ;(window as any).electronAPI.speakText(text)
      } else {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'ja-JP'
        utterance.rate = 1.2
        speechSynthesis.speak(utterance)
      }
    }
    try {
      const gainValue = settings.countdownVolume / 100
      const ctx = new AudioContext()
      const times = [0, 1.0, 2.0, 3.0]
      times.forEach((t, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = i === 3 ? pitchBell : pitchBeep
        const duration = i === 3 ? bellDuration : 0.15
        gain.gain.setValueAtTime(gainValue, ctx.currentTime + t)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + duration)
        osc.start(ctx.currentTime + t)
        osc.stop(ctx.currentTime + t + duration)
      })
      setTimeout(() => ctx.close(), 5000)
    } catch (e) {
      console.error('試聴エラー:', e)
    }
  }

  // 表示形式に基づいて適切なサイズマッピングを選択
  const currentSizeMapping =
    settings.displayFormat === 'datetime' ? sizeMappingDateTime : sizeMappingTime;

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
                {Object.keys(currentSizeMapping).map((sizeKey) => {
                  const sizeValue = Number(sizeKey) as keyof typeof currentSizeMapping
                  let label = `サイズ ${sizeValue}`
                  if (sizeValue === 1) {
                    label += ' (最小)'
                  }
                  if (sizeValue === 5) {
                    label += ' (最大)'
                  }
                  return (
                    <option key={sizeValue} value={sizeValue}>
                      {label}
                    </option>
                  )
                })}
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

          {/* カウントダウン設定 */}
          <section style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              カウントダウン
            </h2>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
              毎分・毎5分・毎15分・毎時間の4秒前にピッピッピッピーンで通知します。上位が優先（毎時間 &gt; 毎15分 &gt; 毎5分 &gt; 毎分）
            </p>

            {/* 音量 */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4b5563',
                marginBottom: '8px'
              }}>
                音量: {settings.countdownVolume}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.countdownVolume}
                onChange={(e) => setSettings(prev => ({ ...prev, countdownVolume: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>

            {/* テーブルヘッダー */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 60px 80px 80px',
              gap: '8px',
              alignItems: 'center',
              padding: '6px 8px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px 6px 0 0',
              border: '1px solid #e5e7eb',
              borderBottom: 'none'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>種類</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textAlign: 'center' }}>有効</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textAlign: 'center' }}>アナウンス</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textAlign: 'center' }}>試聴</span>
            </div>

            {[
              {
                label: '毎時間',
                desc: '「まもなく○時です」',
                enabledKey: 'countdownEveryHour' as const,
                announceKey: 'countdownEveryHourAnnounce' as const,
                pitchBeep: 1568, pitchBell: 2093, bellDuration: 1.2,
                previewText: 'まもなく10時です',
                hasAnnounce: true,
              },
              {
                label: '毎15分',
                desc: '「まもなく15分です」',
                enabledKey: 'countdownEvery15Min' as const,
                announceKey: 'countdownEvery15MinAnnounce' as const,
                pitchBeep: 1319, pitchBell: 2093, bellDuration: 1.2,
                previewText: 'まもなく15分です',
                hasAnnounce: true,
              },
              {
                label: '毎5分',
                desc: '「まもなく5分です」',
                enabledKey: 'countdownEvery5Min' as const,
                announceKey: 'countdownEvery5MinAnnounce' as const,
                pitchBeep: 1047, pitchBell: 2093, bellDuration: 1.2,
                previewText: 'まもなく5分です',
                hasAnnounce: true,
              },
              {
                label: '毎分',
                desc: '音のみ',
                enabledKey: 'countdownEveryMinute' as const,
                announceKey: null as null,
                pitchBeep: 880, pitchBell: 1760, bellDuration: 0.8,
                previewText: undefined as undefined,
                hasAnnounce: false,
              },
            ].map((row, idx, arr) => (
              <div
                key={row.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 80px 80px',
                  gap: '8px',
                  alignItems: 'center',
                  padding: '10px 8px',
                  border: '1px solid #e5e7eb',
                  borderTop: 'none',
                  borderRadius: idx === arr.length - 1 ? '0 0 6px 6px' : '0',
                  backgroundColor: settings[row.enabledKey] ? '#f0f9ff' : 'white',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{row.label}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{row.desc}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={settings[row.enabledKey]}
                    onChange={(e) => setSettings(prev => ({ ...prev, [row.enabledKey]: e.target.checked }))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ textAlign: 'center' }}>
                  {row.hasAnnounce && row.announceKey ? (
                    <input
                      type="checkbox"
                      checked={settings[row.announceKey]}
                      disabled={!settings[row.enabledKey]}
                      onChange={(e) => setSettings(prev => ({ ...prev, [row.announceKey!]: e.target.checked }))}
                      style={{ width: '16px', height: '16px', cursor: settings[row.enabledKey] ? 'pointer' : 'not-allowed', opacity: settings[row.enabledKey] ? 1 : 0.4 }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px', color: '#d1d5db' }}>─</span>
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => previewCountdown(
                      row.pitchBeep, row.pitchBell, row.bellDuration,
                      row.hasAnnounce && row.announceKey && settings[row.announceKey] ? row.previewText : undefined
                    )}
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      color: '#374151',
                    }}
                  >
                    試聴
                  </button>
                </div>
              </div>
            ))}
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