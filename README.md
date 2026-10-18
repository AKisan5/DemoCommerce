# DemoCommerce — LeakReplayの検査用通販サイト

Cloudflare Workers（React/Vite/Hono）とSupabase（Auth/PostgreSQL/RLS）で作るテスト通販サイトのCodex向け実装ドキュメントです。**このZIPにはアプリ本体は含まれません。**

## 最初にやること

1. 別のGitHubリポジトリを作成する（LeakReplay本体とは分ける）。
2. 本ZIPのファイルをリポジトリ直下へ配置する。
3. Codexに`CODEX_START.md`を渡す。最初はM0+M1まで実装。
4. Supabase環境とCloudflare Accessは外部アカウントで準備し、資格情報を安全に設定する。
5. 通常の通販機能・RLSテストが成功した後にLab専用シナリオをM3で追加する。

## ファイル

- `SPEC.md`: 実装要件・Mermaid構成図・DB設計・API・受け入れ基準
- `AGENTS.md`: Codexが守るルール
- `CODEX_START.md`: Codexへ最初に送る指示
- `TEST_MATRIX.md`: E2E・RLS・漏洩テストと期待結果
- `DEPLOY_CLOUDFLARE_SUPABASE.md`: 外部設定・認証・デプロイ前確認
- `integrations/leakreplay-fixtures.json`: LeakReplay側と検査対象を揃えるテスト契約（実際のドメインやトークンは入れない）
- `.env.example`, `.dev.vars.example`: 変数名のみの設定例

## 最重要の安全性

意図的な不備は**Cloudflare Accessで保護されたLab専用環境**にのみ実装する。一般公開状態では使用しない。個人情報/実決済は禁止。通常APIは正しい認可を維持する。
