namespace :holidays do
  desc "Import Japanese holidays from Cabinet Office CSV"
  task import: :environment do
    puts "Downloading CSV..."

    imported_count = HolidayImporter.import_from_cabinet_office_csv
    puts "Imported #{imported_count} holidays."
  end
end
