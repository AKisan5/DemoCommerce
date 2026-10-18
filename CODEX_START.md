# Codexへの最初の実装指示（コピーして実行可能）

このリポジトリをLeakReplayの検査対象にする**架空の通販サイト DemoCommerce**として実装してください。

1. `AGENTS.md`, `SPEC.md`, `TEST_MATRIX.md`, `DEPLOY_CLOUDFLARE_SUPABASE.md`を読む。
2. **まずM0+M1だけ**実装する。Cloudflare Workers + Hono + React/Vite/TypeScriptに、Supabase PostgreSQL/Authを接続できる構造にする。実際の資格情報がない場合は環境変数の例とMockを使い、勝手に固定値を埋めない。
3. 最初の画面は商品一覧、商品詳細、ログイン画面。商品8〜12点、価格JPY、スマホ/PC対応。Supabaseのmigrations/seed、テストA/Bユーザー作成CLI、通常テーブルのRLS（ordersは本人だけ閲覧可）を作る。
4. セキュリティ要件：商品/注文/プロフィールのRLSとGRANTを明示。secret/service_role keyをブラウザへ渡さない。架空テストデータだけ扱う。**M0+M1では意図的な脆弱性APIを作らない。**
5. `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`と、可能なら`supabase db reset`、`supabase test db`を試し、結果を報告する。
6. デプロイやM2以降に移らず、変更ファイルと追加で必要な環境変数・外部設定を報告して終了する。

仕様やSDKが更新されている場合は公式ドキュメントを優先して適用し、独自の変更点をREADMEに記録してください。強制的な安全制約とテスト契約は変更しないでください。
