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
    iconSize: { main: 24, sub: 16 }
  },
  2: {
    windowWidth: 302,
    windowHeight: 153,
    fontSize: { date: 28, time: 42 },
    buttonSize: { main: 56, sub: 32 },
    iconSize: { main: 28, sub: 18 }
  },
  3: {
    windowWidth: 385,
    windowHeight: 172,
    fontSize: { date: 32, time: 54 },
    buttonSize: { main: 64, sub: 40 },
    iconSize: { main: 32, sub: 24 }
  },
  4: {
    windowWidth: 468,
    windowHeight: 192,
    fontSize: { date: 36, time: 66 },
    buttonSize: { main: 72, sub: 44 },
    iconSize: { main: 36, sub: 26 }
  },
  5: {
    windowWidth: 550,
    windowHeight: 210,
    fontSize: { date: 40, time: 78 },
    buttonSize: { main: 80, sub: 48 },
    iconSize: { main: 40, sub: 28 }
  }
};

// 時刻のみ表示用のサイズマッピング
export const sizeMappingTime = {
  1: {
    windowWidth: 220,
    windowHeight: 80,
    fontSize: { time: 30 },
    buttonSize: { main: 48, sub: 28 },
    iconSize: { main: 24, sub: 16 }
  },
  2: {
    windowWidth: 302,
    windowHeight: 102,
    fontSize: { time: 42 },
    buttonSize: { main: 56, sub: 32 },
    iconSize: { main: 28, sub: 18 }
  },
  3: {
    windowWidth: 385,
    windowHeight: 115,
    fontSize: { time: 54 },
    buttonSize: { main: 64, sub: 40 },
    iconSize: { main: 32, sub: 24 }
  },
  4: {
    windowWidth: 468,
    windowHeight: 128,
    fontSize: { time: 66 },
    buttonSize: { main: 72, sub: 44 },
    iconSize: { main: 36, sub: 26 }
  },
  5: {
    windowWidth: 550,
    windowHeight: 140,
    fontSize: { time: 78 },
    buttonSize: { main: 80, sub: 48 },
    iconSize: { main: 40, sub: 28 }
  }
};

// SettingsSize型をsizeMappingのキーから動的に生成
export type SettingsSize = keyof typeof sizeMappingDateTime;

export const fontStyles = ['DSEG7', 'DSEG14'] as const 