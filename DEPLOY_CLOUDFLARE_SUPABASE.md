# DemoCommerce — Cloudflare / Supabase限定公開手順

> この手順は人間による外部設定が必要。Codexは未提供のIDを生成・推測しない。必要な設定の一覧とスクリプトを作るが、外部リソースの作成・有料サービス登録は承認後に行う。

## 1. 推奨環境

- **local**: Cloudflare Vite pluginを通してWorkersランタイムを再現、Supabase CLIのローカルDB。`LAB_ENABLED`はローカル検証に限り使用可。
- **lab**: Cloudflare専用Worker + 専用Supabaseプロジェクト + 全アクセスをCloudflare Accessで保護。A/Bのダミー注文のみ。LeakReplay接続先。
- **production（将来）**: MVPでは作らない。商用目的で追加する場合Lab機能を別ビルド/別Workerで物理分離し、脆弱機能を含めない。

## 2. Cloudflare Workers

公式のReact/Vite/Honoテンプレートを参照して1 Worker構成。`src/worker/index.ts`がHono API、React SPAはWorkers Static Assetsに同梱。公開RouteはLab専用ホスト（例：`lab-shop.example.test`はダミーなので実際のDNS設定時に置換）。実ホスト名は指定しない。

必要なBindings/設定：

| 名前 | 取扱い | 説明 |
|---|---|---|
| `APP_ENV=lab` | Binding（server） | `lab`専用環境 |
| `LAB_ENABLED=true` | Binding（server） | 専用Labのときだけtrue。その他false固定 |
| `SUPABASE_URL` | config | 専用SupabaseプロジェクトURL |
| `SUPABASE_PUBLISHABLE_KEY` | config / 公開可能 | Supabaseのpublishable key。RLSは必須 |
| `SUPABASE_SECRET_KEY` | **Workers secret** | サーバー専用キー。公開ブラウザに埋め込まない |
| `ACCESS_TEAM_DOMAIN` | config | `https://<team>.cloudflareaccess.com` |
| `ACCESS_AUD` | config | 対象AccessアプリのAudience |
| `ALLOWED_ORIGIN` | config | 許可するフロントOriginを正確に指定 |

- `.dev.vars`と`.env`はGit対象外。`.dev.vars.example`、`.env.example`のみGit管理。
- Secretsの追加はCloudflare Dashboardまたは `wrangler secret put` を使う。
- 事前の`assert-lab-isolated`チェックで **Lab有効 && lab環境ではない** 場合はビルド/デプロイ失敗。
- Deploy後はCloudflare Access設定を確認し、Workers.dev/Preview/Custom Domainのいずれにも無認証で到達できないかE2Eテスト。
- Cloudflare AccessはWorkerレベルでproductionとpreviewを両方対象として設定。通常のホスト別保護だけに頼らない。
- Worker自身も`Cf-Access-Jwt-Assertion`のJWTをJWKで検証し、issuer、audience、expiryをチェックする。検証不能時はfail closed。
- `Cache-Control: no-store`とRate Limiting。秘密情報をログに残さない。

## 3. Supabase

- **Lab専用の新規プロジェクト**を作成。既存の実運用Supabaseとは接続しない。
- `supabase init` → `supabase start` → `supabase db reset`でローカル再現可能にし、Schemaは`supabase/migrations`、商品は`supabase/seed.sql`で管理。
- テストユーザー作成/注文投入は`npm run fixtures:provision`等の独立スクリプト。パスワードは環境変数/秘密ストア管理。
- `supabase test db`でRLSと権限を検証。リモートにDBを適用する場合は `supabase db push --dry-run` で差分を確認後、`supabase db push`。
- `supabase db reset --linked` はLab限定であってもデータを消去する。Codexが自動で実行しない。

## 4. LeakReplayと通信するために

- Cloudflare Accessの**サービス認証情報**を使用する場合はLeakReplay側Tool Gatewayが秘密管理する。Agents APIへ値を渡さない。
- Supabase Auth A/Bの資格情報もLeakReplay Tool Gateway側からセッションを確立する。Cookieやtokenはモデル入力とスクショから除外。
- 診断前に、固定ホスト・固定path/GETのみを許可するAllowlistを設定。Supabase AuthやAccess認証のために必要なドメインを追加する場合も具体的な完全一致で指定。
- メカニカルな疎通テスト：認証なし→Access拒否、認証済→A注文200、Bで通常API A注文404、BでLab API A注文200。

## 5. デプロイ前チェック

- [ ] 全データが架空データであることを確認
- [ ] 他の顧客/本番Supabaseプロジェクトと資格情報が共有されていない
- [ ] Cloudflare AccessがWorker全体（Preview含む）に設定済み
- [ ] Access JWT検証のissuer/audience/署名検証を通過
- [ ] 本番向け経路にLab機能が存在しない（404）
- [ ] `workers.dev`やPreview URLから迂回できない
- [ ] 商品・注文のRLSとpgTAPが成功
- [ ] Supabase secret keyがclient bundle、ログ、Gitに存在しない
- [ ] ペイメント、メール、実住所入力が存在しない
- [ ] 1000件などの大量取得・破壊操作・無制限リクエストができない
- [ ] LeakReplay検査が固定テストシナリオ・GETリクエストのみで実行される

## 6. 公式ドキュメント

- https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/local-development/cli-workflows
