This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

1. 保存対象は「ストップウォッチの1セッション」ですか？
   - 自分で保存ボタンを押した時間にしてください。
2. ラップは保存しますか？

- ラップも保存してもいいですが、最優先は、総保存時間としてください

3. 「勉強時間」として扱うなら、カテゴリや科目は必要ですか？
   - 例: 睡眠、プログラミング
   - 必要に応じて、カテゴリを増やせるような機能にしてください
   - 予測やグラフ化にはカテゴリがあると後で使いやすいです。
4. /prediction は何を表示するページにしたいですか？
   - 保存済みストップウォッチ記録一覧
   - 日別合計
   - 週別合計
   - 将来の予測グラフ
5. 保存タイミングはどれがよいですか？
   - Stop を押したら保存ボタンを表示
   - Reset 前に保存確認
6. backend は Rails API + PostgreSQL で保存してよいですか？
   - 既存方針どおりなら、Next.js から DB 直接アクセスはせず Rails API 経由です。
7. 同じ日に保存をした際は、timestampを確認して、同じ日の合計を取得してください。
