type EventSearchProps = {
  searchKeyword: string;
  totalCount: number;
  filteredCount: number;
  onChangeKeyword: (value: string) => void;
  onClear: () => void;
};

export default function EventSearch({
  searchKeyword,
  totalCount,
  filteredCount,
  onChangeKeyword,
  onClear,
}: EventSearchProps) {
  const isSearching = searchKeyword.trim().length > 0;

  return (
    <div className="mb-3 rounded-lg bg-white p-3 shadow sm:mb-4 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full">
          <label className="mb-1 block text-sm font-bold">予定を検索</label>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onChangeKeyword(e.target.value)}
            placeholder="予定名・メモで検索"
            className="min-h-10 w-full rounded border px-3 py-2 text-base sm:w-80 sm:text-sm"
          />
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-xs text-gray-600 sm:text-sm">
            {isSearching
              ? `${filteredCount} / ${totalCount} 件表示`
              : `${totalCount} 件の予定`}
          </p>

          {isSearching && (
            <button
              onClick={onClear}
              className="min-h-10 rounded bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
            >
              クリア
            </button>
          )}
        </div>
      </div>
    </div>
  );
}