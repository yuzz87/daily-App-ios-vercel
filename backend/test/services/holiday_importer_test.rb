require "test_helper"

class HolidayImporterTest < ActiveSupport::TestCase
  test "imports holidays from cabinet office csv format" do
    Holiday.delete_all

    csv_data = <<~CSV.encode("Shift_JIS")
      国民の祝日・休日月日,国民の祝日・休日名称
      2026/01/01,元日
      2026/01/12,成人の日
    CSV

    imported_count = HolidayImporter.import(csv_data)

    assert_equal 2, imported_count
    assert_equal "元日", Holiday.find_by!(date: Date.new(2026, 1, 1)).name
    assert_equal "成人の日", Holiday.find_by!(date: Date.new(2026, 1, 12)).name
  end
end
