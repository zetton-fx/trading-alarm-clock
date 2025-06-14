import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'

function createWindow(): void {
  // メインウィンドウを作成
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 開発モードではlocalhost、本番モードではファイルを読み込み
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// このメソッドは、Electronが初期化を終えて、ブラウザウィンドウを作成する準備ができたときに呼び出されます
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // macOSでは、通常、アプリケーションのアイコンがクリックされたときにウィンドウが開いていない場合、
    // ウィンドウを再作成します
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Windowsおよび Linuxではすべてのウィンドウが閉じられたときにアプリを終了します
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}) 