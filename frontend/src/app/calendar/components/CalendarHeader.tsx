import Image from "next/image";
import { useState } from "react";

type CalendarHeaderProps = {
  currentYear: number;
  currentMonth: number;
  loading: boolean;
  searchKeyword: string;
  onChangeKeyword: (value: string) => void;
  onClearKeyword: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export default function CalendarHeader({
  currentYear,
  currentMonth,
  loading,
  searchKeyword,
  onChangeKeyword,
  onClearKeyword,
  onPrevMonth,
  onNextMonth,
  onToday,
  isSidebarOpen,
  onToggleSidebar,
}: CalendarHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isSearching = searchKeyword.trim().length > 0;

  function toggleSearch() {
    setIsSearchOpen((prev) => !prev);
  }

  return (
    <div className="mt-3 mb-3 p-3 overflow-x-auto sm:mb-4 sm:p-4">
      <div className="flex min-w-max items-center justify-between gap-3">
        <div className="flex justify-between gap-2 sm:order-1">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
            title={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
          >
            <Image
              src={isSidebarOpen ? "/menu.svg" : "/package-open.svg"}
              alt=""
              width={30}
              height={30}
            />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 text-center sm:order-2">
          <button
          type="button"
          onClick={onToday}
          className="flex h-10 w-16 cursor-pointer items-center justify-center rounded-full border border-black hover:bg-gray-300/50"
          >今日</button>
          <h2 className="text-xl font-bold sm:text-2xl">
            {currentYear}年 {currentMonth + 1}月
          </h2>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="先月"
              title="先月"
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
              aria-label="来月"
              title="来月"
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

        <div className="flex items-center gap-5 sm:order-3">
          <div className="flex items-center gap-2">
            {isSearchOpen && (
              <div className="relative w-64 sm:w-80">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(event) => onChangeKeyword(event.target.value)}
                  placeholder="検索"
                  autoFocus
                  className="min-h-10 w-full rounded-full border bg-white py-2 pl-4 pr-10 text-sm outline-none focus:border-gray-400"
                />

                {isSearching && (
                  <button
                    type="button"
                    onClick={onClearKeyword}
                    aria-label="検索をクリア"
                    title="検索をクリア"
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
                  >
                    <Image src="/arrow-left.svg" alt="" width={18} height={18} />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={toggleSearch}
              aria-label="検索"
              title="検索"
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-300/50"
            >
              <Image src="/search.svg" alt="" width={30} height={30} />
            </button>
          </div>

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
    </div>
  );
}