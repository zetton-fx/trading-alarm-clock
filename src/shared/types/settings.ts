export interface AppSettings {
  // サイズ設定（1-6の6段階）
  size: 1 | 2 | 3 | 4 | 5 | 6;
  
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
  1: { windowWidth: 350, windowHeight: 200, fontSize: { date: 24, time: 36 } },
  2: { windowWidth: 400, windowHeight: 225, fontSize: { date: 28, time: 42 } },
  3: { windowWidth: 450, windowHeight: 250, fontSize: { date: 32, time: 48 } },
  4: { windowWidth: 500, windowHeight: 275, fontSize: { date: 36, time: 54 } },
  5: { windowWidth: 550, windowHeight: 300, fontSize: { date: 40, time: 60 } },
  6: { windowWidth: 2048, windowHeight: 1024, fontSize: { date: 120, time: 180 } }
};

// 時刻のみ表示用のサイズマッピング
export const sizeMappingTime = {
  1: { windowWidth: 350, windowHeight: 100, fontSize: { time: 48 } },
  2: { windowWidth: 400, windowHeight: 112, fontSize: { time: 56 } },
  3: { windowWidth: 450, windowHeight: 125, fontSize: { time: 64 } },
  4: { windowWidth: 500, windowHeight: 138, fontSize: { time: 72 } },
  5: { windowWidth: 550, windowHeight: 150, fontSize: { time: 80 } },
  6: { windowWidth: 2048, windowHeight: 512, fontSize: { time: 240 } }
};

// SettingsSize型をsizeMappingのキーから動的に生成
export type SettingsSize = keyof typeof sizeMappingDateTime;

export const fontStyles = ['DSEG7', 'DSEG14'] as const 