# Codex用 ボイスメモアプリ実装指示書セット

目的: 既存のフロントエンド簡易版を、音声ファイルを保存しないボイスメモアプリとして完成させる。

前提:

- フロントエンドのみ
- pnpm
- Next.js / React / TypeScript
- Railsは使わない
- 音声ファイルは保存しない
- 保存先はまず localStorage
- 将来 Vercel + Postgres + Mastra へ拡張できる形にする

## Codexへの渡し方

おすすめ順序:

1. `AGENTS.md` をプロジェクトルートに配置する
2. `prompts/01_project_audit.md` をCodexに渡す
3. `prompts/02_types_and_storage.md` から順番に渡す
4. 1タスクごとに `pnpm build` まで確認させる
5. 失敗したら次へ進まず、直前タスクの修正を依頼する

## ファイル一覧

```txt
codex_voice_memo_instructions/
├─ README.md
├─ AGENTS.md
├─ spec/
│  ├─ 00_full_policy.md
│  ├─ 01_data_model.md
│  ├─ 02_storage_spec.md
│  ├─ 03_ui_spec.md
│  ├─ 04_recording_speech_spec.md
│  ├─ 05_future_vercel_postgres_mastra.md
│  └─ 06_non_goals.md
├─ prompts/
│  ├─ 01_project_audit.md
│  ├─ 02_types_and_storage.md
│  ├─ 03_dummy_data_and_list.md
│  ├─ 04_detail_edit_delete.md
│  ├─ 05_recorder_speech_to_text.md
│  ├─ 06_search_and_tags.md
│  ├─ 07_refactor_components.md
│  ├─ 08_vercel_ready_check.md
│  └─ 09_final_review.md
└─ checklists/
   ├─ phase1_localstorage_checklist.md
   ├─ vercel_deploy_checklist.md
   └─ future_expansion_checklist.md
```

## 最重要方針

音声ファイルは保存しない。保存するのは `title / memo / tags / transcript / durationSec / createdAt / updatedAt` のみ。
