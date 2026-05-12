"use client";

import { useState } from "react";
import Image from "next/image";

type CalendarHeaderProps = {
  currentYear: number;
  currentMonth: number;
  searchKeyword: string;
  onChangeKeyword: (value: string) => void;
  onClearKeyword: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onCreateEvent: () => void;
};

export default function CalendarHeader({
  currentYear,
  currentMonth,
  searchKeyword,
  onChangeKeyword,
  onPrevMonth,
  onNextMonth,
  onToday,
  isSidebarOpen,
  onToggleSidebar,
  onCreateEvent,
}: CalendarHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);


  return (
    <div className="bg-teal-100/20" >
      <div className="mx-auto w-full lg:w-225 lg:max-w-225 flex justify-center items-center overflow-x-auto p-1">
        {isSearchOpen ? (
          <div className="flex min-w-max items-center gap-3">
            {/* 検索モードを閉じる */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              aria-label="検索を閉じる"
              title="検索を閉じる"
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
            >
              <Image src="/arrow-left.svg" alt="" width={30} height={30} />
            </button>

            {/* 検索入力欄 */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchKeyword}
                onChange={(event) => onChangeKeyword(event.target.value)}
                placeholder="検索"
                autoFocus
                className="min-h-10 w-full rounded-full border bg-white py-2 pl-4 pr-10 text-sm outline-none focus:border-gray-400"
              />
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-3">
            {/* 左側：サイドバー切り替え */}
            <div className="flex justify-between gap-2 sm:order-1">
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
                title={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
              >
                <Image
                  src={isSidebarOpen ? "/package-open.svg" : "/menu.svg"}
                  alt=""
                  width={30}
                  height={30}
                />
              </button>
            </div>

            {/* 中央：今日・年月・月移動 */}
            <div className="flex items-center justify-center gap-3 text-center sm:order-2">
              <button
                type="button"
                onClick={onToday}
                className="flex h-10 w-16 cursor-pointer items-center justify-center rounded-full border border-black text-sm hover:bg-gray-300/50"
              >
                今日
              </button>

              <h2 className="text-xl font-bold sm:text-2xl">
                {currentYear}年 {currentMonth + 1}月
              </h2>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={onPrevMonth}
                  aria-label="前の月"
                  title="前の月"
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
                >
                  <Image
                    src="/circle-chevron-left.svg"
                    alt=""
                    width={30}
                    height={30}
                  />
                </button>

                <button
                  type="button"
                  onClick={onNextMonth}
                  aria-label="次の月"
                  title="次の月"
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
                >
                  <Image
                    src="/circle-chevron-right.svg"
                    alt=""
                    width={30}
                    height={30}
                  />
                </button>
              </div>
            </div>

            {/* 右側：検索・音声検索・作成・設定 */}
            <div className="flex items-center gap-5 sm:order-3">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="検索"
                title="検索"
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
              >
                <Image src="/search.svg" alt="" width={30} height={30} />
              </button>

              <button
                type="button"
                aria-label="音声検索"
                title="音声検索"
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
              >
                <Image src="/mic.svg" alt="" width={30} height={30} />
              </button>

              <button
                type="button"
                onClick={onCreateEvent}
                aria-label="作成"
                title="作成"
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
              >
                <Image src="/square-plus.svg" alt="" width={30} height={30} />
              </button>

              <button
                type="button"
                aria-label="設定"
                title="設定"
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
              >
                <Image src="/settings.svg" alt="" width={30} height={30} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
