password = ENV["SEED_USER_PASSWORD"]

if password.blank?
  puts "SEED_USER_PASSWORD not set, skipping user seed."
else
  allowed_emails = ENV.fetch("ALLOWED_EMAILS", "")
    .split(",")
    .map(&:strip)
    .reject(&:blank?)

  if allowed_emails.empty?
    puts "ALLOWED_EMAILS not set, skipping user seed."
  else
    reset_password = ENV["RESET_SEED_USER_PASSWORD"] == "true"

    allowed_emails.each do |email|
      user = User.find_by(email: email)

      if user
        if reset_password
          user.update!(password: password)
          puts "Updated password for: #{email}"
        else
          puts "User already exists: #{email}"
        end

        next
      end

      User.create!(email: email, password: password)
      puts "Created user: #{email}"
    end
  end
end

if Holiday.exists?
  puts "Holidays already exist, skipping holiday import."
else
  begin
    imported_count = HolidayImporter.import_from_cabinet_office_csv
    puts "Imported #{imported_count} holidays."
  rescue StandardError => error
    warn "Failed to import holidays: #{error.class}: #{error.message}"
  end
end
