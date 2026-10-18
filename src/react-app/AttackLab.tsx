import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import './attack-lab.css';

const cases = [
  { id: 'login', name: 'SQLインジェクション / ログイン', detail: '入力をSQLへ直接連結するログイン。パスワードを知らなくても認証を突破できます。' },
  { id: 'search', name: 'SQLインジェクション / 顧客検索', detail: '検索条件を書き換えて102件の架空顧客を取得。UNION SELECTも実際のSQLiteで評価します。' },
  { id: 'idor', name: 'IDOR / 他人の顧客情報', detail: '所有者チェックがないため、IDの変更だけで他人の架空顧客情報を取得できます。' },
  { id: 'role', name: '権限改ざん / 管理者エクスポート', detail: '利用者が渡すroleを信用する管理画面。一般ユーザーでも管理者として顧客102件を取得できます。' },
  { id: 'profile', name: '過剰な情報返却 / プロフィール', detail: '画面には不要な住所、生年月日、免許証サンプル番号、社内メモまで返します。' },
  { id: 'file', name: 'パストラバーサル / バックアップ', detail: 'ファイル名の「../」で公開レポートの外へ移動し、架空のバックアップ102件を取得できます。仮想ファイル内での再現です。' },
  { id: 'weak', name: '弱いパスワード / 管理者', detail: 'デバッグ設定に公開されたadminパスワードで管理者としてログインできます。' },
  { id: 'backup', name: '認証なし / 顧客バックアップ公開', detail: '認証チェックがないバックアップAPI。ログインせずに架空顧客102件を取得できます。' },
  { id: 'debug', name: '設定漏洩 / デバッグ情報', detail: 'デモ管理者のパスワード、無効なサンプルAPIキー、テーブル名、バックアップの場所が公開されています。' },
  { id: 'xss', name: '反射型XSS / HTMLの直接出力', detail: '入力したHTMLをそのまま表示し、JavaScriptを実行できる隔離画面です。成功すると「DEMO XSS EXECUTED」と表示されます。' },
] as const;
type CaseId = typeof cases[number]['id'];
type Viewer = { id: number; email: string; role: string };

export function AttackLab() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [active, setActive] = useState<CaseId>('login');
  const mode = 'vulnerable';
  const [xss, setXss] = useState('<script>document.getElementById("proof").textContent="DEMO XSS EXECUTED"</script>');
  const [frame, setFrame] = useState('');
  const [email, setEmail] = useState('buyer-b@example.test');
  const [password, setPassword] = useState('demo-password');
  const [term, setTerm] = useState("' OR 1=1 --");
  const [customer, setCustomer] = useState('1');
  const [file, setFile] = useState('../backups/customers.json');
  const [role, setRole] = useState('admin');
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [http, setHttp] = useState<number | null>(null);
  const [requestLine, setRequestLine] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/attack-lab/status', { signal: controller.signal }).then((r) => setAvailable(r.ok)).catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    void fetch('/api/attack-lab/me', { signal: controller.signal }).then(async (r) => { if (r.ok) setViewer((await r.json() as { viewer: Viewer }).viewer); }).catch(() => undefined);
    return () => controller.abort();
  }, []);
  const selected = cases.find((item) => item.id === active)!;
  async function send(path: string, body?: unknown) {
    setBusy(true); setHttp(null); setResult(null);
    setRequestLine(`${body ? 'POST' : 'GET'} /api/attack-lab${path}`);
    try {
      const response = await fetch(`/api/attack-lab${path}`, {
        method: body ? 'POST' : 'GET', credentials: 'same-origin',
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      });
      const data = await response.json();
      setHttp(response.status); setResult(data);
      if (path === '/login' && response.ok) setViewer((data as { viewer: Viewer }).viewer);
      if (path === '/logout') setViewer(null);
      setEvents((current) => [`${new Date().toLocaleTimeString('ja-JP')} ${path.split('?')[0]} → ${response.status}`, ...current].slice(0, 8));
    } catch { setResult({ error: '接続できませんでした。もう一度お試しください。' }); }
    finally { setBusy(false); }
  }
  function run(event: FormEvent) {
    event.preventDefault();
    if (active === 'backup') { void send('/backups/customers.json'); return; }
    if (active === 'debug') { void send('/debug/config'); return; }
    if (active === 'xss') { setFrame(`/api/attack-lab/reflection?q=${encodeURIComponent(xss)}`); setRequestLine('GET /api/attack-lab/reflection'); setResult({ note: '下の隔離フレームで実行結果を確認してください。', synthetic: true }); return; }
    if (active === 'login' || active === 'weak') { void send('/login', { email, password, mode }); return; }
    const query = new URLSearchParams({ mode });
    if (active === 'search') { query.set('q', term); void send(`/search?${query}`); }
    if (active === 'idor') void send(`/customers/${encodeURIComponent(customer)}?${query}`);
    if (active === 'role') { query.set('role', role); void send(`/admin/export?${query}`); }
    if (active === 'profile') void send(`/profile?${query}`);
    if (active === 'file') { query.set('file', file); void send(`/download?${query}`); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ demo: true, case: active, mode, status: http, result }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `democommerce-${active}-${mode}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (available === null) return <main className="section-wrap attack-page"><p>検証環境を確認しています…</p></main>;
  if (!available) return <main className="section-wrap attack-page"><h1>検証Labは無効です</h1><p>この環境では脆弱性デモを実行できません。</p><Link to="/">ストアへ戻る</Link></main>;
  return <main className="section-wrap attack-page">
    <div className="attack-kicker">DEMOCOMMERCE SECURITY LAB · SYNTHETIC DATA ONLY</div>
    <div className="attack-heading"><div><h1>壊して、仕組みを知る。</h1><p>入力から、ログイン突破、顧客情報の取得まで。10の脆弱な攻撃面を用意しました。</p></div><Link to="/">ストアを探索する →</Link></div>
    <div className="attack-notice"><strong>意図的に脆弱なデモ環境です。</strong> 全102件が架空データです。SQLは外部DBに接続しない、リクエスト専用のSQLiteで実行します。実際のメールアドレスやパスワードは入力しないでください。</div>
    <div className="attack-toolbar"><strong>VULNERABLE ONLY / 攻撃テスト専用</strong><span>{viewer ? `ログイン中：${viewer.email} / ${viewer.role} / ID ${viewer.id}` : '未ログイン'}</span>{viewer && <button type="button" onClick={() => void send('/logout', {})} disabled={busy}>ログアウト</button>}</div>
    <div className="attack-grid"><aside className="attack-cases" aria-label="検証ケース">{cases.map((item, i) => <button type="button" key={item.id} aria-pressed={active === item.id} onClick={() => { setActive(item.id); setResult(null); setHttp(null); if (item.id === 'weak') { setEmail('admin@example.test'); setPassword('admin'); } }}><span>{String(i + 1).padStart(2, '0')}</span>{item.name}</button>)}</aside>
    <section className="attack-card"><p className="attack-kicker">VULNERABLE CASE</p><h2>{selected.name}</h2><p>{selected.detail}</p><form onSubmit={run}>
      {(active === 'login' || active === 'weak') && <><label>メールアドレス / SQL入力<input type="text" autoComplete="off" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={256} required /></label><label>デモ用パスワード<input type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={256} required /></label><div className="attack-examples"><button type="button" onClick={() => { setEmail("' OR 1=1 --"); setPassword('unknown'); }}>SQLiの入力例を入れる</button><button type="button" onClick={() => { setEmail('buyer-b@example.test'); setPassword('demo-password'); }}>通常のBアカウント</button></div></>}
      {active === 'search' && <label>顧客メール検索 / SQL入力<input value={term} onChange={(e) => setTerm(e.target.value)} maxLength={256} /><small>例：' OR 1=1 -- ／ buyer-b@example.test</small></label>}
      {active === 'idor' && <label>取得する顧客ID<input value={customer} onChange={(e) => setCustomer(e.target.value)} inputMode="numeric" maxLength={3} /><small>B（ID 2）でログイン後、A（ID 1）を取得して比較できます。</small></label>}
      {active === 'role' && <label>リクエストで指定するrole<input value={role} onChange={(e) => setRole(e.target.value)} maxLength={32} /></label>}
      {active === 'file' && <label>ダウンロードする仮想ファイル<input value={file} onChange={(e) => setFile(e.target.value)} maxLength={256} /><small>通常：summary.json ／ 比較：../backups/customers.json</small></label>}
      {active === 'xss' && <label>反射させるHTML<textarea value={xss} onChange={(e) => setXss(e.target.value)} maxLength={512} rows={4} /></label>}
      {!viewer && !['login', 'weak', 'backup', 'debug', 'xss'].includes(active) && <p className="attack-warning">先にログインケースで、通常ログインまたはSQLiによるログインを実行してください。</p>}
      <button className="button button-dark" type="submit" disabled={busy}>{busy ? '実行中…' : ['login', 'weak'].includes(active) ? 'ログインを検証する' : 'リクエストを実行する'} →</button>
    </form></section></div>
    <section className="attack-output"><div className="attack-output-heading"><h2>観測結果 {http !== null && <span className={http >= 400 ? 'rejected' : 'received'}>HTTP {http}</span>}</h2><button type="button" onClick={download} disabled={result === null}>結果をJSON保存</button></div><code>{requestLine || '検証を実行すると、HTTPステータスとレスポンスが表示されます。'}</code>{frame && active === 'xss' && <iframe title="隔離されたXSS実行結果" src={frame} sandbox="allow-scripts" style={{ width: '100%', height: 260, border: '1px solid #acb7a4', marginTop: 16 }} />}<pre aria-live="polite">{result === null ? '入力を書き換えて、ログイン突破や架空顧客データの取得を試してください。' : JSON.stringify(result, null, 2)}</pre></section>
    {events.length > 0 && <section className="attack-history"><h2>この画面での実行履歴</h2>{events.map((event, i) => <p key={i}>{event}</p>)}</section>}
    <p className="attack-footnote">通常のSupabaseセッションとは別のLab用セッションです。デモDBは毎回初期化され、攻撃による変更は残りません。LeakReplayの現在の公開ページ診断ではログイン攻撃は実行されません。</p>
  </main>;
}
