# Codex開発ルール — DemoCommerce

## 読む順序
`CODEX_START.md` → `SPEC.md` → `TEST_MATRIX.md` → `DEPLOY_CLOUDFLARE_SUPABASE.md` → `integrations/leakreplay-fixtures.json`。

## 固定条件
- React/Vite/TypeScript + Hono + Cloudflare Workers（UI + API同一Worker）、Supabase PostgreSQL + Auth。D1/Workers KV/本番決済/AI APIは使用しない。
- これはLeakReplayの**検査用通販サイト**であり、LeakReplay本体とは別リポジトリ。
- 商品8〜12個、テストアカウントA/B、注文と明細、カート、テスト注文、本人限定の注文履歴。
- 初回作業は**M0 + M1**。M2以降、意図的な脆弱性コード、クラウドデプロイは自動で作らない。
- Labの再現不備は**専用lab環境かつCloudflare AccessでWorker全体を保護した場合のみ**許可。Labの環境フラグは全条件を満たさない限り404。
- 通常の注文APIは必ず所有者認証。SupabaseのRLSとGRANTを維持し、Labを通すためにDBの広範なアクセス権を付与しない。
- Lab専用コードを使う場合、データは全件ダミー、別Supabaseプロジェクト、`APP_ENV=lab`、`LAB_ENABLED=true`、Access JWT検証を必須にする。
- 決済処理、現実の顧客情報、実際の配送・メール送信・分析追跡、カード番号、実住所の入力は実装しない。
- `SUPABASE_SECRET_KEY`、認証情報、Access service tokenはWorker Secrets/ローカル未追跡ファイルのみに保存。Git、UI、ログ、スクショ、LLM入力に含めない。
- 追加のライブラリは必要最低限。Cloudflare Workers互換を確認して採用。URLやアカウントID、Supabase project refを推測しない。
- テスト用の脆弱なAPIをLab以外から呼べる設計にしない。Cloudflare Accessの設定前はLabをデプロイしない。
- 不具合の誤検知・検出漏れを測れるよう、脆弱ケースと正常ケースを両方実装してテストする。

## Codexの作業手順
1. まずファイル構成とpackage.jsonを確認。足りないものだけ作る。
2. `CODEX_START.md`指定のMilestoneのみ作る。`SPEC.md`にない機能を勝手に追加しない。
3. 外部接続が不要なコード/テストから着手する。未設定のIDやSecretsは`.example`のみ作り、ダミー値で本番認証を突破しない。
4. 実装完了後、型・lint・unit・DBテストを実行。未実行項目は理由を明記する。
5. 変更ファイル、実装Milestone、動作確認結果、必要な外部設定、次の実装ステップを報告する。
