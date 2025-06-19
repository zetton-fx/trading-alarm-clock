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

## デバッグ機能

アプリケーションには開発者向けのデバッグ機能が組み込まれています。

### Developer Toolsの開き方

1. アプリケーションを起動
2. `Ctrl+Shift+I` (Linux/Windows) または `Cmd+Option+I` (Mac) でDeveloper Toolsを開く
3. Consoleタブを選択

### デバッグ関数

Developer ToolsのConsoleから以下の関数を実行できます：

#### **`debugShowSettings()`**
全設定を一覧表示します。メインプロセス（実際に使用される設定）とレンダラープロセス（UI表示用の設定）の両方を確認できます。

```javascript
debugShowSettings()
```

#### **`debugShowAlarmSettings()`**
アラーム設定のみを詳細表示します。

```javascript
debugShowAlarmSettings()
```

**表示内容：**
- グローバルアラーム音ファイル名
- グローバル先行アラーム音ファイル名
- ボリューム設定（%表示）
- 登録済みアラーム数

#### 📱 **`debugShowAppSettings()`**
アプリ設定のみを詳細表示します。

```javascript
debugShowAppSettings()
```

**表示内容：**
- サイズ設定
- 常に前面表示フラグ
- フォント設定
- 色設定（文字色・背景色）

#### ❓ **`debugHelp()`**
利用可能なデバッグ関数の一覧を表示します。

```javascript
debugHelp()
```

### デバッグのユースケース

1. **アラーム音が変わらない場合**
   ```javascript
   debugShowAlarmSettings()
   ```
   メインプロセスとレンダラープロセスの設定が同期されているか確認

2. **設定変更が反映されない場合**
   ```javascript
   debugShowSettings()
   ```
   実際に使用されている設定値を確認

3. **メモリ上の設定確認**
   各設定がメモリに正しくロードされているかを確認

### 注意事項

- デバッグ関数はアプリ起動時に自動で登録されます
- 本番環境でも利用可能ですが、開発・デバッグ目的での使用を推奨します
- 設定変更後は該当するデバッグ関数で変更が反映されているか確認できます

