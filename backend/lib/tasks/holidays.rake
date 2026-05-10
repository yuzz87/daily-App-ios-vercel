require "csv"
require "open-uri"

namespace :holidays do
  desc "Import Japanese holidays from Cabinet Office CSV"
  task import: :environment do
    url = "https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv"

    puts "Downloading CSV..."

    csv_data = URI.open(url).read

    utf8_data = csv_data.encode(
      "UTF-8",
      "Shift_JIS",
      invalid: :replace,
      undef: :replace
    )

    rows = CSV.parse(utf8_data, headers: true)

    imported_count = 0

    rows.each do |row|
      date_text = row["国民の祝日・休日月日"]
      name = row["国民の祝日・休日名称"]

      next if date_text.blank? || name.blank?

      holiday_date = Date.strptime(date_text, "%Y/%m/%d")

      holiday = Holiday.find_or_initialize_by(date: holiday_date)
      holiday.name = name
      holiday.save!

      imported_count += 1
    end

    puts "Imported #{imported_count} holidays."
  end
end