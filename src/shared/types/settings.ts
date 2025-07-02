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
  font: 'DSEG7Modern',
  fontWeight: 'regular',
  fontStyle: 'normal',
  textColor: '#000000', // 黒色
  backgroundColor: '#ffffff', // 白色
  glowColor: '#ffffff', // 白色
  glowIntensity: 0
};

// 線形補間ヘルパー関数
const linearInterpolate = (start: number, end: number, step: number, totalSteps: number = 5): number => {
  if (step <= 1) return Math.round(start);
  if (step >= totalSteps) return Math.round(end);
  return Math.round(start + (end - start) * ((step - 1) / (totalSteps - 1)));
};

// 新しいサイズマッピングの基準
const dtStart = {
  windowWidth: 110, windowHeight: 60,
  fontSize: { date: 10, time: 15 },
  buttonSize: { main: 24, sub: 14 },
  iconSize: { main: 12, sub: 8 },
  popup: { width: 60, padding: 8, nameSize: 6, timeSize: 10, buttonPadding: 4, buttonFontSize: 7 }
};
const dtEnd = {
  windowWidth: 550, windowHeight: 210,
  fontSize: { date: 40, time: 78 },
  buttonSize: { main: 80, sub: 48 },
  iconSize: { main: 40, sub: 28 },
  popup: { width: 280, padding: 20, nameSize: 16, timeSize: 40, buttonPadding: 10, buttonFontSize: 16 }
};

const timeStart = {
  windowWidth: 110, windowHeight: 40,
  fontSize: { time: 15 },
  buttonSize: { main: 24, sub: 14 },
  iconSize: { main: 12, sub: 8 },
  popup: { width: 50, padding: 6, nameSize: 7, timeSize: 14, buttonPadding: 4, buttonFontSize: 7 }
};
const timeEnd = {
  windowWidth: 550, windowHeight: 140,
  fontSize: { time: 78 },
  buttonSize: { main: 80, sub: 48 },
  iconSize: { main: 40, sub: 28 },
  popup: { width: 280, padding: 16, nameSize: 24, timeSize: 78, buttonPadding: 8, buttonFontSize: 14 }
};

// 日時表示用のサイズマッピング
export const sizeMappingDateTime = {
  1: dtStart,
  2: {
    windowWidth: linearInterpolate(dtStart.windowWidth, dtEnd.windowWidth, 2),
    windowHeight: linearInterpolate(dtStart.windowHeight, dtEnd.windowHeight, 2),
    fontSize: { 
      date: linearInterpolate(dtStart.fontSize.date, dtEnd.fontSize.date, 2),
      time: linearInterpolate(dtStart.fontSize.time, dtEnd.fontSize.time, 2)
    },
    buttonSize: { 
      main: linearInterpolate(dtStart.buttonSize.main, dtEnd.buttonSize.main, 2),
      sub: linearInterpolate(dtStart.buttonSize.sub, dtEnd.buttonSize.sub, 2)
    },
    iconSize: { 
      main: linearInterpolate(dtStart.iconSize.main, dtEnd.iconSize.main, 2),
      sub: linearInterpolate(dtStart.iconSize.sub, dtEnd.iconSize.sub, 2)
    },
    popup: { 
      width: linearInterpolate(dtStart.popup.width, dtEnd.popup.width, 2),
      padding: linearInterpolate(dtStart.popup.padding, dtEnd.popup.padding, 2),
      nameSize: linearInterpolate(dtStart.popup.nameSize, dtEnd.popup.nameSize, 2),
      timeSize: linearInterpolate(dtStart.popup.timeSize, dtEnd.popup.timeSize, 2),
      buttonPadding: linearInterpolate(dtStart.popup.buttonPadding, dtEnd.popup.buttonPadding, 2),
      buttonFontSize: linearInterpolate(dtStart.popup.buttonFontSize, dtEnd.popup.buttonFontSize, 2)
    }
  },
  3: {
    windowWidth: linearInterpolate(dtStart.windowWidth, dtEnd.windowWidth, 3),
    windowHeight: linearInterpolate(dtStart.windowHeight, dtEnd.windowHeight, 3),
    fontSize: { 
      date: linearInterpolate(dtStart.fontSize.date, dtEnd.fontSize.date, 3),
      time: linearInterpolate(dtStart.fontSize.time, dtEnd.fontSize.time, 3)
    },
    buttonSize: { 
      main: linearInterpolate(dtStart.buttonSize.main, dtEnd.buttonSize.main, 3),
      sub: linearInterpolate(dtStart.buttonSize.sub, dtEnd.buttonSize.sub, 3)
    },
    iconSize: { 
      main: linearInterpolate(dtStart.iconSize.main, dtEnd.iconSize.main, 3),
      sub: linearInterpolate(dtStart.iconSize.sub, dtEnd.iconSize.sub, 3)
    },
    popup: { 
      width: linearInterpolate(dtStart.popup.width, dtEnd.popup.width, 3),
      padding: linearInterpolate(dtStart.popup.padding, dtEnd.popup.padding, 3),
      nameSize: linearInterpolate(dtStart.popup.nameSize, dtEnd.popup.nameSize, 3),
      timeSize: linearInterpolate(dtStart.popup.timeSize, dtEnd.popup.timeSize, 3),
      buttonPadding: linearInterpolate(dtStart.popup.buttonPadding, dtEnd.popup.buttonPadding, 3),
      buttonFontSize: linearInterpolate(dtStart.popup.buttonFontSize, dtEnd.popup.buttonFontSize, 3)
    }
  },
  4: {
    windowWidth: linearInterpolate(dtStart.windowWidth, dtEnd.windowWidth, 4),
    windowHeight: linearInterpolate(dtStart.windowHeight, dtEnd.windowHeight, 4),
    fontSize: { 
      date: linearInterpolate(dtStart.fontSize.date, dtEnd.fontSize.date, 4),
      time: linearInterpolate(dtStart.fontSize.time, dtEnd.fontSize.time, 4)
    },
    buttonSize: { 
      main: linearInterpolate(dtStart.buttonSize.main, dtEnd.buttonSize.main, 4),
      sub: linearInterpolate(dtStart.buttonSize.sub, dtEnd.buttonSize.sub, 4)
    },
    iconSize: { 
      main: linearInterpolate(dtStart.iconSize.main, dtEnd.iconSize.main, 4),
      sub: linearInterpolate(dtStart.iconSize.sub, dtEnd.iconSize.sub, 4)
    },
    popup: { 
      width: linearInterpolate(dtStart.popup.width, dtEnd.popup.width, 4),
      padding: linearInterpolate(dtStart.popup.padding, dtEnd.popup.padding, 4),
      nameSize: linearInterpolate(dtStart.popup.nameSize, dtEnd.popup.nameSize, 4),
      timeSize: linearInterpolate(dtStart.popup.timeSize, dtEnd.popup.timeSize, 4),
      buttonPadding: linearInterpolate(dtStart.popup.buttonPadding, dtEnd.popup.buttonPadding, 4),
      buttonFontSize: linearInterpolate(dtStart.popup.buttonFontSize, dtEnd.popup.buttonFontSize, 4)
    }
  },
  5: dtEnd
};

// 時刻のみ表示用のサイズマッピング
export const sizeMappingTime = {
  1: { ...timeStart, isCompactPopup: true },
  2: {
    windowWidth: linearInterpolate(timeStart.windowWidth, timeEnd.windowWidth, 2),
    windowHeight: linearInterpolate(timeStart.windowHeight, timeEnd.windowHeight, 2),
    fontSize: { 
      time: linearInterpolate(timeStart.fontSize.time, timeEnd.fontSize.time, 2)
    },
    buttonSize: { 
      main: linearInterpolate(timeStart.buttonSize.main, timeEnd.buttonSize.main, 2),
      sub: linearInterpolate(timeStart.buttonSize.sub, timeEnd.buttonSize.sub, 2)
    },
    iconSize: { 
      main: linearInterpolate(timeStart.iconSize.main, timeEnd.iconSize.main, 2),
      sub: linearInterpolate(timeStart.iconSize.sub, timeEnd.iconSize.sub, 2)
    },
    popup: { 
      width: linearInterpolate(timeStart.popup.width, timeEnd.popup.width, 2),
      padding: linearInterpolate(timeStart.popup.padding, timeEnd.popup.padding, 2),
      nameSize: linearInterpolate(timeStart.popup.nameSize, timeEnd.popup.nameSize, 2),
      timeSize: linearInterpolate(timeStart.popup.timeSize, timeEnd.popup.timeSize, 2),
      buttonPadding: linearInterpolate(timeStart.popup.buttonPadding, timeEnd.popup.buttonPadding, 2),
      buttonFontSize: linearInterpolate(timeStart.popup.buttonFontSize, timeEnd.popup.buttonFontSize, 2)
    },
    isCompactPopup: true
  },
  3: {
    windowWidth: linearInterpolate(timeStart.windowWidth, timeEnd.windowWidth, 3),
    windowHeight: linearInterpolate(timeStart.windowHeight, timeEnd.windowHeight, 3),
    fontSize: { 
      time: linearInterpolate(timeStart.fontSize.time, timeEnd.fontSize.time, 3)
    },
    buttonSize: { 
      main: linearInterpolate(timeStart.buttonSize.main, timeEnd.buttonSize.main, 3),
      sub: linearInterpolate(timeStart.buttonSize.sub, timeEnd.buttonSize.sub, 3)
    },
    iconSize: { 
      main: linearInterpolate(timeStart.iconSize.main, timeEnd.iconSize.main, 3),
      sub: linearInterpolate(timeStart.iconSize.sub, timeEnd.iconSize.sub, 3)
    },
    popup: { 
      width: linearInterpolate(timeStart.popup.width, timeEnd.popup.width, 3),
      padding: linearInterpolate(timeStart.popup.padding, timeEnd.popup.padding, 3),
      nameSize: linearInterpolate(timeStart.popup.nameSize, timeEnd.popup.nameSize, 3),
      timeSize: linearInterpolate(timeStart.popup.timeSize, timeEnd.popup.timeSize, 3),
      buttonPadding: linearInterpolate(timeStart.popup.buttonPadding, timeEnd.popup.buttonPadding, 3),
      buttonFontSize: linearInterpolate(timeStart.popup.buttonFontSize, timeEnd.popup.buttonFontSize, 3)
    }
  },
  4: {
    windowWidth: linearInterpolate(timeStart.windowWidth, timeEnd.windowWidth, 4),
    windowHeight: linearInterpolate(timeStart.windowHeight, timeEnd.windowHeight, 4),
    fontSize: { 
      time: linearInterpolate(timeStart.fontSize.time, timeEnd.fontSize.time, 4)
    },
    buttonSize: { 
      main: linearInterpolate(timeStart.buttonSize.main, timeEnd.buttonSize.main, 4),
      sub: linearInterpolate(timeStart.buttonSize.sub, timeEnd.buttonSize.sub, 4)
    },
    iconSize: { 
      main: linearInterpolate(timeStart.iconSize.main, timeEnd.iconSize.main, 4),
      sub: linearInterpolate(timeStart.iconSize.sub, timeEnd.iconSize.sub, 4)
    },
    popup: { 
      width: linearInterpolate(timeStart.popup.width, timeEnd.popup.width, 4),
      padding: linearInterpolate(timeStart.popup.padding, timeEnd.popup.padding, 4),
      nameSize: linearInterpolate(timeStart.popup.nameSize, timeEnd.popup.nameSize, 4),
      timeSize: linearInterpolate(timeStart.popup.timeSize, timeEnd.popup.timeSize, 4),
      buttonPadding: linearInterpolate(timeStart.popup.buttonPadding, timeEnd.popup.buttonPadding, 4),
      buttonFontSize: linearInterpolate(timeStart.popup.buttonFontSize, timeEnd.popup.buttonFontSize, 4)
    }
  },
  5: timeEnd
};

// SettingsSize型をsizeMappingのキーから動的に生成
export type SettingsSize = keyof typeof sizeMappingDateTime;

export const fontStyles = ['DSEG7', 'DSEG14'] as const 