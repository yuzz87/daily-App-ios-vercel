"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { publicUrl } from "@/lib/publicPath";
import type { CalendarViewMode } from "../../types";

const VIEW_MODE_OPTIONS: { label: string; value: CalendarViewMode }[] = [
  { label: "週", value: "week" },
  { label: "月", value: "month" },
];

type CalendarHeaderProps = {
  currentYear: number;
  currentMonth: number;
  searchKeyword: string;
  onChangeKeyword: (value: string) => void;
  onClearKeyword: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  viewMode: CalendarViewMode;
  onChangeViewMode: (mode: CalendarViewMode) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onCreateEvent: () => void;
};

export default function CalendarHeader({
  currentYear,
  currentMonth,
  searchKeyword,
  onChangeKeyword,
  onPrev,
  onNext,
  onToday,
  viewMode,
  onChangeViewMode,
  isSidebarOpen,
  onToggleSidebar,
  onCreateEvent,
}: CalendarHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);


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
              <Image src={publicUrl("/arrow-left.svg")} alt="" width={30} height={30} />
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
            {/* 左側：サイドバー切り替え ＋ 週/月 表示モード切替 */}
            <div className="flex items-center gap-2 sm:order-1">
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
                title={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
              >
                <Image
                  src={publicUrl(isSidebarOpen ? "/package-open.svg" : "/menu.svg")}
                  alt=""
                  width={30}
                  height={30}
                />
              </button>

              {/* ハンバーガーの右隣に週/月の表示モード切替 */}
              <div className="flex gap-1 rounded-md border border-gray-300 bg-gray-50 p-1">
                {VIEW_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChangeViewMode(option.value)}
                    className={`shrink-0 rounded px-3 py-1.5 text-sm ${
                      viewMode === option.value
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
                  onClick={onPrev}
                  aria-label="前へ"
                  title="前へ"
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
                >
                  <Image
                    src={publicUrl("/circle-chevron-left.svg")}
                    alt=""
                    width={30}
                    height={30}
                  />
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  aria-label="次へ"
                  title="次へ"
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
                >
                  <Image
                    src={publicUrl("/circle-chevron-right.svg")}
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
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsSearchOpen(true);
                }}
                aria-label="検索"
                title="検索"
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
              >
                <Image src={publicUrl("/search.svg")} alt="" width={30} height={30} />
              </button>

              <button
                type="button"
                aria-label="音声検索"
                title="音声検索"
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
              >
                <Image src={publicUrl("/mic.svg")} alt="" width={30} height={30} />
              </button>

              <button
                type="button"
                onClick={onCreateEvent}
                aria-label="作成"
                title="作成"
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
              >
                <Image src={publicUrl("/square-plus.svg")} alt="" width={30} height={30} />
              </button>

              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen((current) => !current)}
                  aria-label="設定"
                  title="設定"
                  aria-expanded={isSettingsOpen}
                  aria-controls="calendar-settings-menu"
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
                >
                  <Image src={publicUrl("/settings.svg")} alt="" width={30} height={30} />
                </button>

                {isSettingsOpen ? (
                  <div
                    id="calendar-settings-menu"
                    className="fixed right-4 top-16 z-50 grid w-44 gap-2 rounded-md border border-gray-200 bg-white p-2 text-sm shadow-lg"
                  >
                    <Link
                      href="/demo/calendar"
                      className="flex min-h-10 items-center justify-center rounded-md border border-gray-200 px-3 font-semibold text-gray-800 transition hover:bg-teal-50 hover:text-teal-800"
                    >
                      Demo page
                    </Link>
                    <Link
                      href="/login"
                      className="flex min-h-10 items-center justify-center rounded-md border border-gray-200 px-3 font-semibold text-gray-800 transition hover:bg-stone-50"
                    >
                      Login page
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
