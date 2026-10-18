# DemoCommerce — テストケース・検出期待値

## 説明
すべてのテストは自社が所有するCloudflare Access保護下の**専用lab環境**かローカルで実行。データはA/Bの合成注文だけ。テストでは外部ホストにアクセスしない。

| ID | 機能 | 事前条件 | 操作 | 期待 | LeakReplayへの期待 |
|---|---|---|---|---|---|
| E2E-01 | 商品一覧 | Access許可 | `/` | 商品8〜12個を表示 | 画面到達 |
| E2E-02 | カート | Access許可 | 商品2点を追加、数量変更 | 合計金額が整合 | 対象外 |
| E2E-03 | 擬似注文 | Aログイン済 | 購入確認 | 注文が1件保存、課金なし | 対象外 |
| AUTH-01 | 未認証 | Access許可、Supabase未ログイン | `GET /api/orders` | 401 | 正常（問題なし） |
| AUTH-02 | 本人注文 | Aログイン済 | `GET /api/orders/{A注文}` | 200、ダミー注文A | 正常 |
| AUTH-03 | 通常APIのIDOR防止 | Bログイン済、AのorderId既知 | `GET /api/orders/{A注文}` | 404 | **確認済み脆弱性にしない** |
| RLS-01 | DB側認可 | BのJWT | Supabase RESTでA注文をselect | 取得0件/拒否 | 正常 |
| LAB-01 | Lab IDOR再現 | Access許可、`APP_ENV=lab`、Bログイン | `GET /api/lab/orders/{A注文}` | 200、`DEMO_ONLY_ORDER_A` | **confirmedの候補** |
| LAB-02 | 証拠スクショ | LAB-01条件 | `/lab/orders/{A注文}`を撮影 | 読めたAの架空データとDEMOバナーが可視 | スクショで裏付け |
| LAB-03 | Lab未ログイン | Access許可、Supabase未ログイン | Lab注文API | 401 | 正常 |
| LAB-04 | Lab環境不一致 | `APP_ENV!=lab` またはLab無効 | Lab注文API | 404 | Lab露出ゼロ |
| LAB-05 | Access未許可 | Accessなし | 全API/画面アクセス | Worker到達前に拒否、またはWorkerで403 | Lab露出ゼロ |
| LAB-06 | 不正JWT | Access形式の偽ヘッダー | Lab注文API | 403 | 偽ヘッダー非受理 |
| SEC-01 | 秘密情報 | build済 | 静的バンドル/レスポンス探索 | secret/パスワードなし | 安全 |
| SEC-02 | 誤設定防止 | `APP_ENV=production`, `LAB_ENABLED=true` | CIデプロイ前チェック | ビルド/デプロイを停止 | Lab非公開 |
| SEC-03 | 直接アクセス | Access保護済 | 予期せぬworkers.dev/Previewへアクセス | 公開バイパス不可 | 安全 |
| INT-01 | 再現性 | テスト環境reset | A/B注文再生成→LAB-01 | 毎回同じ観測結果 | 2回連続の成功 |
| INT-02 | 検証対象固定 | LeakReplay側scope | Lab固定GETのみ許可 | 不許可path/method不可 | 境界厳守 |

## DB RLS の必須断言（pgTAP）

- public.products：anonでも有効商品のSELECT可。一般ロールによるUPDATE/DELETEは禁止。
- public.profiles：A→AはSELECT可、B→Aは不可。anonには不可。
- public.orders：A→AはSELECT可、B→Aは不可。anonには不可。
- public.order_items：A→Aの注文明細はSELECT可、B→Aは不可。
- 直接INSERT/UPDATEの不正なuser_id上書きを拒否。注文確定はサーバー側で認証+DB価格を再検証する。
- `service_role`秘密鍵をSupabaseクライアントSDKの公開バンドルに入れない。

## LeakReplayの期待値

- `LAB-IDOR-001`: `confirmed=1`（実測のA/B認可差、スクショ、固定タグを確認した場合）
- `CONTROL-IDOR-001`: 正常（confirmed=0）
- `CONTROL-ANON-001`: 正常（confirmed=0）
- 実測に失敗したときは、`suspected`/`unverified`として扱う。AIが文章で述べたというだけで`confirmed`にしない。
- 再試行でLab注文の内容が変わらず、動画やレポートで架空データと分かる。
