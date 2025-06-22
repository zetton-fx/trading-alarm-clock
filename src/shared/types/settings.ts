export interface AppSettings {
  // サイズ設定（1-6の6段階）
  size: 1 | 2 | 3 | 4 | 5;
  
  // 常に前面表示フラグ
  alwaysOnTop: boolean;
  
  // 日時表示形式（'datetime' | 'time'）
  displayFormat: 'datetime' | 'time';
  
  // フォント設定
  font: 'DSEG7Classic' | 'DSEG7ClassicMini' | 'DSEG7Modern' | 'DSEG7ModernMini' | 'DSEG14Classic' | 'DSEG14ClassicMini' | 'DSEG14Modern' | 'DSEG14ModernMini' | 'Arial' | 'Helvetica' | 'Times New Roman' | 'Courier New' | 'Verdana' | 'Georgia' | 'Trebuchet MS' | 'Comic Sans MS' | 'Impact' | 'Lucida Console' | 'Tahoma' | 'Palatino' | 'Garamond' | 'Bookman' | 'Avant Garde' | 'Hiragino Sans' | 'Meiryo' | 'Noto Sans JP' | 'Yu Gothic' | 'MS Gothic' | 'MS Mincho';
  
  // フォントウェイト設定
  fontWeight: 'light' | 'regular' | 'bold';
  
  // フォントスタイル設定
  fontStyle: 'normal' | 'italic';
  
  // 文字色
  textColor: string;
  
  // 背景色
  backgroundColor: string;
  
  // 発光色
  glowColor: string;
  
  // 文字の発光強度（0-10）
  glowIntensity: number;
}

// デフォルト設定
export const defaultSettings: AppSettings = {
  size: 3,
  alwaysOnTop: true,
  displayFormat: 'datetime',
  font: 'DSEG7Classic',
  fontWeight: 'regular',
  fontStyle: 'normal',
  textColor: '#ffffff', // 白色
  backgroundColor: '#000000', // 黒色
  glowColor: '#a1b6e8', // 水色
  glowIntensity: 2
};

// 日時表示用のサイズマッピング
export const sizeMappingDateTime = {
  1: {
    windowWidth: 220,
    windowHeight: 120,
    fontSize: { date: 20, time: 30 },
    buttonSize: { main: 48, sub: 28 },
    iconSize: { main: 24, sub: 16 },
    popup: { width: 120, padding: 16, nameSize: 12, timeSize: 20, buttonPadding: 8, buttonFontSize: 13 }
  },
  2: {
    windowWidth: 302,
    windowHeight: 153,
    fontSize: { date: 28, time: 42 },
    buttonSize: { main: 56, sub: 32 },
    iconSize: { main: 28, sub: 18 },
    popup: { width: 160, padding: 16, nameSize: 13, timeSize: 28, buttonPadding: 8, buttonFontSize: 14 }
  },
  3: {
    windowWidth: 385,
    windowHeight: 172,
    fontSize: { date: 32, time: 54 },
    buttonSize: { main: 64, sub: 40 },
    iconSize: { main: 32, sub: 24 },
    popup: { width: 200, padding: 20, nameSize: 14, timeSize: 32, buttonPadding: 10, buttonFontSize: 14 }
  },
  4: {
    windowWidth: 468,
    windowHeight: 192,
    fontSize: { date: 36, time: 66 },
    buttonSize: { main: 72, sub: 44 },
    iconSize: { main: 36, sub: 26 },
    popup: { width: 240, padding: 20, nameSize: 15, timeSize: 36, buttonPadding: 10, buttonFontSize: 15 }
  },
  5: {
    windowWidth: 550,
    windowHeight: 210,
    fontSize: { date: 40, time: 78 },
    buttonSize: { main: 80, sub: 48 },
    iconSize: { main: 40, sub: 28 },
    popup: { width: 280, padding: 20, nameSize: 16, timeSize: 40, buttonPadding: 10, buttonFontSize: 16 }
  }
};

// 時刻のみ表示用のサイズマッピング
export const sizeMappingTime = {
  1: {
    windowWidth: 220,
    windowHeight: 80,
    fontSize: { time: 30 },
    buttonSize: { main: 48, sub: 28 },
    iconSize: { main: 24, sub: 16 },
    popup: { width: 100, padding: 12, nameSize: 13, timeSize: 28, buttonPadding: 8, buttonFontSize: 13 },
    isCompactPopup: true
  },
  2: {
    windowWidth: 302,
    windowHeight: 102,
    fontSize: { time: 42 },
    buttonSize: { main: 56, sub: 32 },
    iconSize: { main: 28, sub: 18 },
    popup: { width: 140, padding: 14, nameSize: 18, timeSize: 42, buttonPadding: 8, buttonFontSize: 14 },
    isCompactPopup: true
  },
  3: {
    windowWidth: 385,
    windowHeight: 115,
    fontSize: { time: 54 },
    buttonSize: { main: 64, sub: 40 },
    iconSize: { main: 32, sub: 24 },
    popup: { width: 200, padding: 16, nameSize: 20, timeSize: 54, buttonPadding: 8, buttonFontSize: 14 }
  },
  4: {
    windowWidth: 468,
    windowHeight: 128,
    fontSize: { time: 66 },
    buttonSize: { main: 72, sub: 44 },
    iconSize: { main: 36, sub: 26 },
    popup: { width: 240, padding: 16, nameSize: 22, timeSize: 66, buttonPadding: 8, buttonFontSize: 14 }
  },
  5: {
    windowWidth: 550,
    windowHeight: 140,
    fontSize: { time: 78 },
    buttonSize: { main: 80, sub: 48 },
    iconSize: { main: 40, sub: 28 },
    popup: { width: 280, padding: 16, nameSize: 24, timeSize: 78, buttonPadding: 8, buttonFontSize: 14 }
  }
};

// SettingsSize型をsizeMappingのキーから動的に生成
export type SettingsSize = keyof typeof sizeMappingDateTime;

export const fontStyles = ['DSEG7', 'DSEG14'] as const 