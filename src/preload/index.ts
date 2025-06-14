import { contextBridge } from 'electron'

// プリロードスクリプト：セキュアな通信のために使用
// 今回のデジタル時計アプリでは特別な通信は不要ですが、
// 将来的な拡張のために基本的な構造を提供します

contextBridge.exposeInMainWorld('electronAPI', {
  // 必要に応じて、ここにメインプロセスとの通信用のAPIを追加
  platform: process.platform
}) 