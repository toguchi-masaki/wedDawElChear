# 電気イスゲーム 設計書

## 1. ゲーム概要

| 項目 | 内容 |
|------|------|
| ゲーム名 | 電気イスゲーム（仮） |
| プレイ人数 | 2人 |
| 最大ターン数 | 8ターン（先攻・後攻が1回ずつ守備を行う = 1ターン） |
| 勝利条件 | 守備側としてスコア 40 以上を達成する |
| 敗北条件 | ① 守備側としてアウトを 3 回受ける<br>② 8ターン終了時点でスコアが相手を下回る<br>③ 逆転不可の点数差になる |

---

## 2. 用語定義

| 用語 | 説明 |
|------|------|
| **イス** | 1〜12 の番号が付いた選択肢。各番号の値はその番号と等しい（イス5 = 5点） |
| **攻撃側** | イスにアウトを仕掛ける役割のプレイヤー |
| **守備側** | イスを選択する役割のプレイヤー |
| **isOut** | 攻撃側がそのイスにアウトを仕掛けているかどうかのフラグ |
| **score** | 守備側の累積得点。アウト時にリセットされる |
| **outCount** | 守備側がアウトを受けた回数。ゲームを通じて累積される |
| **非アクティブ化** | セーフ選択したイスを以降の選択肢から除外すること |
| **ターン（表示）** | 先攻・後攻が1回ずつ守備を行う1セット。最大8ターン |
| **サイクル（内部）** | 攻撃側設定 → 守備側選択 の1回のやり取り。内部カウンタは1〜16 |
| **逆転不可** | 残りアクティブイスの合計値を全取りしても相手スコアに届かない状態 |

---

## 3. ゲームフロー

```
開始（cycle = 1、表示ターン = 1）
 │
 ▼
[B] 攻撃側: イス1〜12 から 1つだけアウトを設定
 │
 ▼
[C] 守備側: アクティブなイスから 1 つ選択
 │
 ▼
[D] isOut?
 ├─ true  ─▶ [E] score = 0 / outCount++
 └─ false ─▶ [F] score += choice / choice を非アクティブ化
 │
 ▼
[G] 判定（優先順位順）
 ├─ score >= 40              ─▶ [H] 守備側 勝利（ゲーム終了）
 ├─ outCount == 3            ─▶ [I] 守備側 敗北（ゲーム終了）
 ├─ cycle == 16              ─▶ [K] スコア比較 → 高い方が勝利（ゲーム終了）
 ├─ 逆転不可の点数差         ─▶ [L] 下回っている側が敗北（ゲーム終了）
 └─ Continuation             ─▶ [J] cycle++ / プレイヤー交代 ─▶ [B] へ戻る
```

---

## 4. 状態定義

### 4.1 ゲーム状態（GameState）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `phase` | Phase | 現在の画面フェーズ |
| `players` | Player[2] | 2人のプレイヤー情報 |
| `setterIdx` | 0 \| 1 | 現在攻撃側のプレイヤーインデックス |
| `chooserIdx` | 0 \| 1 | 現在守備側のプレイヤーインデックス |
| `turn` | number | 内部サイクルカウンタ（1〜16）。表示は `ceil(turn/2)` |
| `deactivated` | Set\<number\> | 非アクティブ化済みのイス番号 |
| `outNumbers` | Set\<number\> | 攻撃側が今サイクルに指定したアウト番号（1つのみ） |
| `lastPick` | number \| null | 直前に守備側が選んだ番号 |
| `lastIsOut` | boolean | 直前の選択がアウトだったか |
| `history` | TurnRecord[] | 全サイクルの選択履歴 |
| `gameOver` | boolean | ゲーム終了フラグ |
| `winnerIdx` | 0 \| 1 \| -1 | 勝者のインデックス（-1 = 未決定） |
| `winReason` | string | 勝敗理由のメッセージ |
| `readyFlags` | [boolean, boolean] | 各プレイヤーの準備完了フラグ（Phase 4.0 追加） |

### 4.2 プレイヤー情報（Player）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `name` | string | プレイヤー名 |
| `score` | number | 現在のスコア（アウト時に 0 リセット） |
| `outCount` | number | アウト累積回数（ゲーム中リセットなし） |

### 4.3 フェーズ遷移（Phase）

```
START（トップ画面 /）
 └─▶ LOBBY（ルーム作成後 /game/:roomId — P2入室待ち）
      └─▶ WAITING_LOBBY（P2入室後 — 両者の準備完了待ち）
           └─▶ SETTER_SETUP（両者準備完了後にゲーム開始 / 守備側は WaitingScreen）
                └─▶ CHOOSER_PICK（守備側選択 / 攻撃側は WaitingScreen）
                     └─▶ RESULT（両デバイスで結果表示）
                          ├─▶ GAME_OVER（ゲーム終了）
                          └─▶ SETTER_SETUP（次サイクル・ロール交代）
```

> **Phase 2.1 変更点:** `SETTER_PRIVATE` / `CHOOSER_PRIVATE`（1デバイス受け渡し画面）を廃止し、`LOBBY` を追加。マルチデバイス化により各プレイヤーが自分のデバイスで操作する。
> **Phase 4.0 変更点:** `WAITING_LOBBY` を追加。P2入室後に両者が準備完了ボタンを押すまでゲームを開始しない。`GameState` に `readyFlags: [boolean, boolean]` を追加。

---

## 5. ロジック仕様

### 5.1 攻撃側の設定ルール

- アクティブなイス（非アクティブ化されていない番号）の中から、**ちょうど 1 つ**をアウトとして指定する
- 設定内容は守備側に非公開（デバイス受け渡し画面で遮蔽）
- 前サイクルの設定は次サイクルに引き継がれない（毎サイクル再設定）

### 5.2 選択時の処理

```
守備側がイス n を選択した場合:

if isOut(n):
    defender.score    = 0
    defender.outCount = outCount + 1
else:
    defender.score    = score + n
    deactivated.add(n)
```

### 5.3 判定ロジック（優先順位順）

| 優先 | 条件 | 結果 | 備考 |
|------|------|------|------|
| 1 | `defender.score >= 40` | 守備側 勝利 | スコア到達 |
| 2 | `defender.outCount >= 3` | 守備側 敗北（攻撃側 勝利） | アウト上限 |
| 3 | `cycle == MAX_CYCLES` | スコア高い方が勝利（同点は引き分け） | 8ターン終了 |
| 4 | アクティブなイスが残り **1つ** になった | スコア高い方が勝利（同点は引き分け） | 最終イス残留 |
| 5 | 逆転不可の点数差 | スコアの低い方が敗北 | 下記参照 |
| 6 | 上記以外 | Continuation → プレイヤー交代 | 次サイクルへ |

### 5.4 逆転不可の判定

**定義:** 残りアクティブイスを全て取っても相手スコアに届かない場合

```
remainingSum = sum(アクティブなイスの値)

trailing  = min(player[0].score, player[1].score) 側プレイヤー
leading   = max(player[0].score, player[1].score) 側プレイヤー

逆転不可 ⟺ trailing.score + remainingSum < leading.score
```

**例:**  
- Player A のスコア: 25、Player B のスコア: 5
- 残りアクティブイス: {1, 2, 3}（合計 6）
- `5 + 6 = 11 < 25` → 逆転不可 → Player B 敗北

**補足:**
- outCount によるスコアリセットは考慮しない（最大値で判定）
- 残りイスが 0 かつスコアが同点の場合は引き分けとする

### 5.5 プレイヤー交代

- Continuation 判定後、内部サイクル数をインクリメントし攻撃側 / 守備側を入れ替える
- スコアおよび outCount はプレイヤーごとに独立して保持される
- 非アクティブ化されたイスはゲーム全体を通じて維持される

---

## 6. 定数

| 定数名 | 値 | 説明 |
|--------|----|------|
| `WIN_SCORE` | 40 | 勝利に必要なスコア |
| `MAX_OUTS` | 3 | 敗北となるアウト回数 |
| `MAX_TURNS` | 16 | 内部サイクル上限（表示ターン8の2倍） |
| `LENGE_COUNT` | 12 | イスの総数（1〜12） |

---

## 7. 画面設計

### 7.1 画面一覧

| 画面 | フェーズ / 条件 | 表示対象 | 説明 |
|------|----------------|----------|------|
| スタート画面 | `/`（ルーム未作成） | P1 | 名前入力・ルール確認・ルーム作成ボタン |
| 参加画面 | `/game/:roomId`（未参加の端末） | P2 | 名前入力・参加ボタン |
| ロビー画面 | `LOBBY` | P1 | QRコード・URL表示・P2入室待ち |
| 攻撃側設定画面 | `SETTER_SETUP`（自分が攻撃側） | 攻撃側のみ | アウトにするイス番号を1つタップ選択 |
| 待機画面 | `SETTER_SETUP`（自分が守備側） / `CHOOSER_PICK`（自分が攻撃側） | 待機中プレイヤー | スピナー＋「相手が操作中」メッセージ |
| 守備側選択画面 | `CHOOSER_PICK`（自分が守備側） | 守備側のみ | アクティブなイスから 1 つ選び、選択確定ボタンで確認 |
| 結果画面 | `RESULT` | 両プレイヤー | アウト / セーフの結果・スコア更新表示 |
| ゲーム終了画面 | `GAME_OVER` | 両プレイヤー | 勝者・勝因の表示 |

> **廃止:** `SETTER_PRIVATE`（攻撃側受け渡し）・`CHOOSER_PRIVATE`（守備側受け渡し）はマルチデバイス化により不要となり削除。

### 7.2 スコアボード表示項目

スコアボードは**テーブル形式**で常時表示する。すべての画面（受け渡し画面・設定画面・選択画面・結果画面・終了画面）で確認できる。

表示項目:

- プレイヤー名 / 現在の役割（攻撃 / 守備）
- 現在のスコア（数値）
- スコアの進捗バー（0〜40 を可視化）
- アウトカウント（ドット 3 個で視覚表示）
- 現在のターン数（例: `ターン 3 / 8`）※ `ceil(内部cycle/2)` で表示
- 残りアクティブイスの合計値（逆転不可判定の参考値として表示）
- **選択履歴ログ**（各プレイヤーの選択番号と結果を時系列表示）

### 7.3 選択履歴ログ

各ターンの選択結果を、スコアボード内にプレイヤーごとで時系列に表示する。

#### 表示形式

```
T1  7  ✅ +7
T3  3  ✅ +3
T5  12 💥 ±0
```

#### 表示項目（1行 = 1レコード）

| 項目 | 内容 |
|------|------|
| ターン番号 | 表示ターン（`ceil(cycle/2)`） |
| 選択したイス番号 | 守備側が選んだ番号 |
| 結果アイコン | ✅ セーフ / 💥 アウト |
| スコア変動 | セーフ: `+n`（n = 選択番号）、アウト: `±0`（リセット表記） |

#### データ定義

履歴レコード（`TurnRecord`）を `GameState` に追加する。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `turn` | number | 内部サイクル番号 |
| `playerIdx` | 0 \| 1 | 守備側だったプレイヤー |
| `pick` | number | 選択したイス番号 |
| `isOut` | boolean | アウトだったか |
| `scoreDelta` | number | スコア変動値（アウト時は 0、セーフ時は選択番号の値） |

---

## 8. コンポーネント構成

```
App.tsx                     BrowserRouter・ルーティング（/ と /game/:roomId）
├── GameRoomRoute           ?role=spectator を検出し GameRoom / SpectatorScreen を切替
├── StartScreen             スタート画面（名前入力・ルーム作成）
├── JoinScreen              参加画面（P2 が /game/:roomId を開いたとき）
├── LobbyScreen             ロビー画面（QRコード・URL・P2入室待ち / 観戦URL追加）
├── WaitingScreen           待機画面（相手のターン中に表示）
├── SetterSetupScreen       攻撃側設定画面
├── ChooserPickScreen       守備側選択画面
├── ResultScreen            結果画面
├── GameOverScreen          ゲーム終了画面
├── SpectatorScreen         観戦画面（読み取り専用・観戦者数表示）
├── WaitingLobbyScreen      両者準備完了待ち画面（Phase 4.0 追加）
├── Scoreboard              スコアボード（テーブル形式、ゲーム中常時表示）
└── LengeGrid               イスボタングリッド（共通 UI）
```

### 8.1 新規追加ファイル（Phase 2）

| ファイル | 役割 |
|---------|------|
| `src/lib/supabase.ts` | Supabase クライアントシングルトン |
| `src/lib/roomUtils.ts` | `createRoom` / `joinRoom` / `serialize` / `deserialize` |
| `src/hooks/useRoom.ts` | Realtime サブスクリプション・楽観的 dispatch |

### 8.2 新規追加ファイル（Phase 3）

| ファイル | 役割 |
|---------|------|
| `src/hooks/useSpectatorRoom.ts` | 読み取り専用 Realtime + Supabase Presence で観戦者数集計 |
| `src/components/SpectatorScreen.tsx` | 観戦専用UI（Scoreboard・LengeGrid・フェーズバナー・観戦者数） |

---

## 9. 状態管理

- `useReducer` による単一ストアで全ゲーム状態を管理
- Phase 2 以降は `useRoom` フックが Supabase と双方向同期を担う
  - dispatch → reducer でローカル更新（楽観的） → Supabase DB 書き込み
  - Supabase Realtime → `setGameState` で相手端末の変更を受信

### 9.1 Action 一覧

| Action | 発火タイミング |
|--------|----------------|
| `SELECT_OUT` | 攻撃側設定画面でイス番号をタップ（1つのみ選択・再タップで解除） |
| `SETTER_DONE` | 攻撃側設定完了ボタン押下 |
| `CHOOSE` | 守備側選択画面でイス番号をタップ |
| `CONTINUE` | 結果画面で次のターンへボタン押下 |
| `RESET` | ゲーム終了画面でもう一度プレイボタン押下 |
| `SYNC_STATE` | Supabase Realtime から状態変更を受信したとき（内部） |
| `PLAYER_READY` | `WAITING_LOBBY` 画面で「準備完了」ボタン押下。両者完了で `SETTER_SETUP` へ遷移 |

> **廃止:** `START_GAME` / `SHOW_SETTER_SETUP` / `SHOW_CHOOSER_PICK` / `ABORT` はマルチデバイス化に伴い削除。ルーム作成・参加・中断はルーティングで処理する。

---

## 10. Phase 2 以降のロードマップ

現状（Phase 1）は1デバイスをパス回しする形式。Phase 2以降は**マルチデバイス化**を軸に機能を拡張する。

### 優先度マトリクス

| Priority | Phase | 機能 | 状況 | 理由・依存関係 |
|----------|-------|------|------|----------------|
| 🔴 必須 | 2.0 | Vercelデプロイ準備 | ✅ デプロイ完了 | 以降の全機能の前提。URL共有・QR発行もデプロイ済み環境が必要 |
| 🔴 必須 | 2.1 | Supabase Realtime 実装 | ✅ デプロイ完了 | マルチデバイス対戦の基盤。これなしでURL対戦は成立しない |
| 🔴 必須 | 2.2 | 対戦URL・QRコード発行 | ✅ デプロイ完了 | Phase 2.1に依存。ゲームルームIDでURL生成、QRコードで招待 |
| 🟡 重要 | 3.0 | 観戦機能・観戦URL/QR発行 | ✅ デプロイ完了 | Phase 2.2に依存。読み取り専用のゲーム状態ストリームを分岐 |
| 🟡 重要 | 3.1 | 思考時間制限機能 | ✅ デプロイ完了 | マルチデバイス化後に自然なニーズ。on/off + 秒数設定のオプション |
| 🟢 随時 | 各Phase | UI修正 | 📋 未着手 | 各Phase完了後に対応。要件は実装後に定義 |
| 🔴 必須 | 4.0 | 入室フロー改善 | ✅ デプロイ完了 | URL/QR発行→P1待機→P2入室→両者準備完了→ゲーム開始の順序に修正 |
| 🔴 必須 | 4.1 | 降参・切断対応 | ✅ 実装完了 | 中断時に相手・観戦者へ通知。降参ボタンで強制終了 |
| 🟡 重要 | 4.2 | 観戦UX改善 | 📋 未着手 | 途中参加・離脱確認・リアルタイム反映 |
| 🟡 重要 | 4.3 | スコアボード電光掲示板UI | 📋 未着手 | ターンごとの選択番号＋○×描画。野球電光掲示板風レイアウト |

---

### Phase 2.0 — Vercelデプロイ準備

**目的:** 本番環境の整備とURL共有の前提構築

**要件:**
- `vercel.json` または Next.js / Vite の設定調整
- 環境変数管理（Supabase接続情報など）
- ビルド・プレビューデプロイの確認

---

### Phase 2.1 — Supabase Realtime 実装　✅ デプロイ完了

**目的:** 2台のデバイスが同一ゲーム状態をリアルタイムで共有する

**実装内容:**

| 項目 | 実装詳細 |
|------|---------|
| DB テーブル | `rooms`（id, game_state JSONB, player1_token, player2_token, created_at, expires_at） |
| シリアライズ | `Set<number>` ↔ `number[]` を `serialize` / `deserialize` で変換（`src/lib/roomUtils.ts`） |
| Realtime | `supabase.channel().on('postgres_changes', UPDATE)` で `game_state` 変更を購読 |
| 同期モデル | 楽観的更新（ローカル即時 → Supabase 書き込み → Realtime で相手端末に伝播） |
| プレイヤー識別 | ルーム参加時に `crypto.randomUUID()` でトークン生成 → `localStorage` に保存 |
| フェーズ廃止 | `SETTER_PRIVATE` / `CHOOSER_PRIVATE` を削除し `LOBBY` を追加 |

**Supabase セットアップ（要実行）:**

```sql
create table public.rooms (
  id text primary key,
  game_state jsonb not null,
  player1_token text not null,
  player2_token text,
  created_at timestamptz default now() not null,
  expires_at timestamptz default (now() + interval '6 hours') not null
);
alter table public.rooms enable row level security;
create policy "rooms_select" on public.rooms for select using (true);
create policy "rooms_insert" on public.rooms for insert with check (true);
create policy "rooms_update" on public.rooms for update using (true);
alter publication supabase_realtime add table public.rooms;
```

**Vercel 環境変数（要設定）:**

| 変数名 | 用途 |
|--------|------|
| `VITE_SUPABASE_URL` | Supabase プロジェクト URL |
| `VITE_SUPABASE_ANON_KEY` | anon/public キー（クライアント専用） |

**既知の制約:**
- `outNumbers`（攻撃側の選択）は `game_state` に含まれるため、守備側が直接 Supabase API を叩けば参照可能。カジュアルゲームとして許容し、Phase 3 以降で Edge Functions による分離を検討する。

---

### Phase 2.2 — 対戦URL・QRコード発行　✅ デプロイ完了

**目的:** URLを共有するだけで対戦を開始できるようにする

**実装内容:**

| 項目 | 実装詳細 |
|------|---------|
| roomId 生成 | 6文字英数字（紛らわしい文字 I/O/0/1 を除外）`generateRoomId()` |
| ルーティング | `react-router-dom` で `/` と `/game/:roomId` を分岐 |
| 招待URL | `${window.location.origin}/game/${roomId}` をクリップボードコピー可能 |
| QRコード | `qrcode.react` の `QRCodeSVG` で 180px 表示（`LobbyScreen`） |
| 入室待機 | P2 参加後 Realtime 経由で P1 も自動的に `SETTER_SETUP` へ遷移 |
| 有効期限 | ルーム作成から 6 時間（`expires_at` カラム）。クリーンアップは未実装（要 Supabase Cron / Edge Function） |

---

### Phase 3.0 — 観戦機能　✅ デプロイ完了

**目的:** 第三者がゲームの進行をリアルタイムで閲覧できる

**要件:**
- 観戦URL（`/game/[roomId]?role=spectator`）の発行・QRコード生成 ✅
- 観戦者は操作不可の読み取り専用ビュー ✅
- 観戦者数の表示（Supabase Presence） ✅
- 観戦者向けのUI（スコアボード・履歴ログを中心とした俯瞰レイアウト） ✅

**実装内容:**

| 項目 | 実装詳細 |
|------|---------|
| ルーティング | `/game/:roomId?role=spectator` で `SpectatorScreen` を表示 |
| 状態同期 | `useSpectatorRoom` フック（dispatch なし・読み取り専用） |
| 観戦者数 | Supabase Presence (`spectators_${roomId}` チャンネル) でリアルタイム集計 |
| 観戦URL発行 | `LobbyScreen` に折りたたみセクションとして観戦QR/URLを追加 |
| 盤面表示 | `LengeGrid`（操作不可）+ フェーズバナー |
| 情報開示 | 観戦者には `outNumbers`（攻撃側設定）を含む全情報を表示。不正なし前提 |

---

### Phase 3.1 — 思考時間制限機能　✅ デプロイ完了

**目的:** 各サイクルの意思決定に時間制限を設け緊張感を加える

**要件:**
- ゲーム開始前の設定: on/off トグル + 制限秒数の選択（10/20/30/60秒） ✅
- タイマーの適用対象: `SETTER_SETUP`（アウト設定）と `CHOOSER_PICK`（イス選択）の両フェーズ ✅
- タイムアップ時の処理: 攻撃側・守備側ともにアクティブイスからランダム選択 ✅
- タイマー表示UI（カウントダウン数字 + プログレスバー、残り10秒で赤点滅） ✅
- マルチデバイス時: `timerStartedAt`（ISO timestamp）を `game_state` に同期し全端末が同一基準で残り時間を計算 ✅

**実装内容:**

| 項目 | 実装詳細 |
|------|---------|
| GameState 追加フィールド | `timerEnabled: boolean` / `timerSeconds: number` / `timerStartedAt: string \| null` |
| タイマー起動タイミング | P2入室時・`SETTER_DONE`・`CONTINUE` アクション時に `timerStartedAt = new Date().toISOString()` をセット |
| タイムアップ処理 | 攻撃側・守備側ともにアクティブイスからランダム選択（既に選択中の場合はそのまま確定） |
| 設定UI | `StartScreen` にチェックボックス + 秒数ボタン4種（10/20/30/60秒）を追加 |
| タイマーUI | `CountdownTimer` コンポーネント（全デバイス共通）。観戦者・待機側にも残り時間を表示 |

---

### UI修正（各Phase随時）

各Phaseの実装完了後にレイアウト・導線を見直す。要件は実装後に定義する。

---

### Phase 4.0 — 入室フロー改善　✅ デプロイ完了

**目的:** URL/QRコード発行後にP1も待機し、両プレイヤーの準備完了を確認してからゲームを開始する

**現状の問題:** P1がルーム作成と同時にゲームホスト状態になっており、P2入室前からフローが進んでしまう

**要件:**
- URL/QRコード発行時点でルーム作成・P1は待機画面（`WAITING_LOBBY`）へ遷移
- P2が入室後、両プレイヤーに「準備完了」ボタンを表示
- 両者が準備完了を押した時点でゲームスタート（`SETTER_SETUP` へ遷移）

**フェーズ追加:**

```
START
 └─▶ LOBBY（QRコード・URL表示）
      └─▶ WAITING_LOBBY（P1・P2の入室待ち / 準備完了待ち）
           └─▶ SETTER_SETUP（両者準備完了後にゲーム開始）
```

**実装内容:**

| 項目 | 実装詳細 |
|------|---------|
| 新フェーズ | `WAITING_LOBBY`: 両プレイヤーが入室するまでの待機画面 |
| 準備完了 | `GameState` に `readyFlags: [boolean, boolean]` を追加。`PLAYER_READY` アクションで各自がフラグを立てる |
| ゲーム開始 | `readyFlags` が両方 `true` になった時点で `SETTER_SETUP` へ自動遷移 |
| 待機画面 | 入室済みプレイヤーの名前・準備完了状態をリアルタイム表示 |

---

### Phase 4.1 — 降参・切断対応　✅ 実装完了

**目的:** プレイヤーが中断・離席した場合に相手・観戦者が取り残されないようにする

**現状の問題:** どちらかが離脱してもゲーム状態が更新されず、相手・観戦者が状況を把握できない

**要件:**
- 降参ボタンを設置（確認ダイアログ付き）。降参した側が即座に敗北しゲーム終了 ✅
- Supabase Presence で切断（タブ閉じ・通信断）を検知し、相手・観戦者に通知バナーを表示 ✅
- 切断後 30 秒応答がない場合は自動的に降参扱いとする ✅

**実装内容:**

| 項目 | 実装詳細 |
|------|---------|
| 降参アクション | `SURRENDER` アクション: `winnerIdx` を相手のインデックスに、`winReason` を「降参」に設定しゲーム終了 |
| 降参確認UI | 確認ダイアログ（「本当に降参しますか？」）を表示してから `SURRENDER` を発火 |
| 切断検知 | Supabase Presence (`players_${roomId}_presence` チャンネル) でプレイヤーの接続状態を監視。相手が一度接続後に切断した場合のみ検知（未参加時の誤検知を防止） |
| 切断通知 | 切断検知時に画面上部に警告バナーを表示（「相手の接続が切断されました」＋自動降参カウントダウン） |
| 自動降参 | 切断後 30 秒以上 Presence が復帰しない場合、残存クライアントが `SURRENDER` を代理発火 |
| フェーズ | `GAME_OVER` に統合（`ABANDONED` フェーズは不要と判断） |

---

### Phase 4.2 — 観戦UX改善

**目的:** 観戦体験を向上させる3機能を追加する

#### 4.2.1 観戦離脱機能

- 観戦画面に「観戦を終了」ボタンを設置
- 押下時に確認ダイアログ（「観戦を終了しますか？」）を表示
- 確認後、トップ画面（`/`）へリダイレクト

#### 4.2.2 途中参加対応

- 現状: 観戦URLにアクセスした時点でのリアルタイム状態のみ受信
- 改善: `useSpectatorRoom` 初回マウント時に Supabase から現在の `game_state` を即時フェッチし、最新状態から観戦を開始できるようにする（既に動作している可能性あり。未確認なら検証する）

#### 4.2.3 リアルタイム反映

**目的:** 観戦者の画面をプレイヤーと同等のリアルタイムで更新する

| 項目 | 実装詳細 |
|------|---------|
| 方式 | 既存の `useSpectatorRoom` が購読している Supabase Realtime をそのまま使用し、遅延なく `spectatorState` を更新する |
| 確認事項 | 現状の実装が既にリアルタイム反映になっているか検証し、遅延が発生している場合は原因を調査・修正する |

---

### Phase 4.3 — スコアボード電光掲示板UI

**目的:** ターンごとの選択結果を野球の電光掲示板風に一覧表示し、ゲームの流れを視覚的に把握しやすくする

**要件:**
- 縦軸: ターン（T1〜T8）、横軸: プレイヤー2人
- 各セルに選択した番号を表示し、その上に ○（セーフ）または ×（アウト）を描画
- 現在のターンは強調表示、未プレイのセルは空欄

**表示イメージ:**

```
       P1（攻/守）   P2（守/攻）
T1       7 ○          3 ×
T2       5 ○         11 ○
T3      12 ×          8 ○
T4        -            -
...
```

**実装内容:**

| 項目 | 実装詳細 |
|------|---------|
| コンポーネント | `ScoreboardGrid`（新規）: 8行×2列のグリッドテーブル |
| データソース | `GameState.history`（`TurnRecord[]`）を表示ターン（`ceil(cycle/2)`）でグループ化して描画 |
| ○×描画 | セル内に番号テキストを置き、その上に SVG または CSS で ○（緑）/ ×（赤）を重ねて描画 |
| アウト累計 | 各プレイヤー列の下部にアウト数（●●● 形式）を表示 |
| スコア合計 | 各プレイヤー列の最終行に現在のスコアを表示 |
| 現スコアボード | 既存の `Scoreboard` コンポーネントと統合するか、タブ切替で併存させるか実装時に判断 |

---

## 11. セキュリティ方針（Phase 2 以降 共通）

Phase 2 以降のすべての実装において、以下のセキュリティ方針を横断的に適用する。

---

### 11.1 環境変数・機密情報の管理

| 項目 | 方針 |
|------|------|
| APIキー・パスワード | ソースコード・リポジトリへのハードコード禁止。`.env.local` 等の環境変数ファイルで管理する |
| `.env` ファイルの除外 | `.gitignore` に `.env*`（`.env.local`, `.env.production` 等）を必ず追加する |
| Vercel 環境変数 | 本番・プレビュー・開発の各環境ごとに Vercel ダッシュボードで設定し、コード内に値を持たない |
| Supabase キーの分離 | `NEXT_PUBLIC_SUPABASE_ANON_KEY`（公開可）はクライアント用途のみ。`SUPABASE_SERVICE_ROLE_KEY`（非公開）はサーバーサイド専用とし、クライアントバンドルに含めない |

---

### 11.2 公開範囲の制御・通信の暗号化

| 項目 | 方針 |
|------|------|
| HTTPS | Vercel デプロイにより本番通信は常時 HTTPS。HTTP アクセスは HTTPS へリダイレクトする（Vercel デフォルト設定で有効） |
| デバッグモード | `NODE_ENV=production` 環境ではデバッグログ・エラー詳細を非表示にする。`console.log` のデバッグ出力は本番ビルドから除去する |
| 不要なファイルの除外 | `.gitignore` および Vercel のデプロイ設定で、開発用設定ファイル・テストデータ・シークレットファイルをリポジトリ・デプロイ成果物から除外する |
| Supabase RLS | 全テーブルで Row Level Security を有効化し、認証済みユーザーが自身に関連するデータのみ操作できるよう制限する（Phase 2.1 参照） |

---

### 11.3 依存ライブラリの脆弱性管理

| 項目 | 方針 |
|------|------|
| 定期的な脆弱性チェック | `npm audit` を各 Phase の実装完了時に実行し、High / Critical の脆弱性がないことを確認してからリリースする |
| 自動検出 | GitHub の Dependabot アラートを有効化し、既知の脆弱性が検出された場合に通知を受け取る |
| ライブラリ選定基準 | 新規ライブラリの追加時は、メンテナンス状況（最終更新日・Issue 対応状況）と npm audit の結果を確認する |
