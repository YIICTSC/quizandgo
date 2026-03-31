# Quiz & Go!

クイズ付きゴルフゲームです。  
シングルプレイは静的配信だけでも動きます。マルチプレイは Socket.IO サーバーが必要です。

## ローカル起動

1. `npm install`
2. 必要なら `.env.local` を作成
3. `npm run dev`
4. ブラウザで `http://localhost:3000`

## 環境変数

- `PORT`: Render などの本番サーバー用ポート
- `VITE_SOCKET_URL`: フロントエンドが接続する Socket.IO サーバーURL
- `VITE_BASE_PATH`: GitHub Pages 用のベースパス
- `GEMINI_API_KEY`: 必要な場合のみ使用

## Render 公開

このリポジトリには [render.yaml](/render.yaml) を追加してあります。

### Render の設定

- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/api/health`

### Render に設定すると安全な環境変数

- `NODE_ENV=production`
- `VITE_SOCKET_URL=https://<your-render-service>.onrender.com`

Render 側では、フロントエンドの静的ファイルと Socket.IO サーバーを同じURLで配信できます。

## GitHub Pages 公開

GitHub Pages は静的ホスティングなので、マルチプレイ接続先は Render 側を使います。

### 必要な GitHub Actions Secrets / Variables

- `VITE_SOCKET_URL`: Render の本番URL

### 必要な Actions 変数

- `VITE_BASE_PATH=/<repo-name>/`

Pages 用 workflow は [.github/workflows/deploy-pages.yml](/.github/workflows/deploy-pages.yml) にあります。

### GitHub Pages でできること

- シングルプレイ
- Render サーバーに接続するマルチプレイUI

### GitHub Pages だけではできないこと

- Socket.IO サーバーのホスト
- マルチプレイの部屋管理そのもの
