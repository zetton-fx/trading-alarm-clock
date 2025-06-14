# Trading Alarm Clock

トレーダー向けに設計された、カスタマイズ可能なデジタル時計とアラーム機能を備えたデスクトップアプリです。

## 技術スタック

- **Electron** - デスクトップアプリフレームワーク
- **TypeScript** - 型安全な開発
- **React 19** - UIライブラリ
- **Tailwind CSS 4** - スタイリング
- **Vite** - ビルドツール
- **electron-vite** - Electron用Vite設定
- **Docker** - 開発環境


## Docker環境での実行

### 前提条件

- Docker & Docker Compose
- X11転送対応（Linuxホスト）

### セットアップ手順

1. **ホストマシンでX11アクセス許可を設定**
   ```bash
   xhost +local:
   ```

2. **Dockerコンテナを起動**
   ```bash
   docker compose run --rm trading-alarm-clock bash
   ```

3. **コンテナ内でdbusサービスを開始**
   ```bash
   sudo service dbus start
   ```

4. **npm ライブラリをインストール**
   ```bash
   npm install
   ```

5. **プロジェクトをビルド**
   ```bash
   npm run build
   ```

6. **開発環境用のアプリを起動**
   ```bash
   npm run dev
   ```

## エラーメッセージについて

開発時に以下のエラーメッセージが表示されますが、**アプリの動作には影響ありません**：

### DBusエラー
```
ERROR:dbus/bus.cc:408] Failed to connect to the bus
```
- システムサービス間の通信に関する警告
- アプリの動作には影響しません

### グラフィックスバッファエラー
```
ERROR:ui/gfx/linux/gbm_wrapper.cc
```
- グラフィックスバッファ管理に関する警告
- Docker環境では仮想的なグラフィックスを使用するため

### OpenGLエラー
```
ERROR:ui/gl/gl_surface_presentation_helper.cc
```
- GPU加速に関する警告
- ソフトウェアレンダリングで代替されるため問題なし

