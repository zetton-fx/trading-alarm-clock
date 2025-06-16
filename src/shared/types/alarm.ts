export interface AlarmItem {
  id: string
  name: string
  hour: number
  minute: number
  enabled: boolean
  preAlarmEnabled: boolean
}

export interface AlarmSettings {
  alarms: AlarmItem[]
  globalAlarmSound: string
  globalPreAlarmSound: string
  globalVolume: number
  globalPreAlarmVolume: number
  globalPreAlarmEnabled: boolean
  globalPreAlarmMinutes: number
  globalOffsetSeconds: number // アラーム時刻の何秒前に鳴らすか
  globalAutoEnableAlarm: boolean // アラーム追加時に自動でON
  globalAutoEnablePreAlarm: boolean // 先行アラーム追加時に自動でON
}

export const defaultAlarmSettings: AlarmSettings = {
  alarms: [],
  globalAlarmSound: 'alarm-upbeat-piano-and-trumpet.mp3',
  globalPreAlarmSound: 'alarm-electric-timer-beeping.mp3',
  globalVolume: 50,
  globalPreAlarmVolume: 30,
  globalPreAlarmEnabled: false,
  globalPreAlarmMinutes: 5,
  globalOffsetSeconds: 0,
  globalAutoEnableAlarm: true,
  globalAutoEnablePreAlarm: false
}

export const alarmSounds = [
  { value: 'alarm-upbeat-piano-and-trumpet.mp3', label: 'ピアノとトランペット' },
  { value: 'alarm-electric-timer-beeping.mp3', label: 'エレクトリックタイマー' },
  { value: 'alarm-uplifting-background-music.mp3', label: 'アップリフティング' },
  { value: 'alarm-positive-boost.mp3', label: 'ポジティブブースト' },
  { value: 'alarm-joyful-upbeat-energy.mp3', label: 'ジョイフルエナジー' }
] 