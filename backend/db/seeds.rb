allowed_emails = ENV.fetch("ALLOWED_EMAILS", "").split(",").map(&:strip)

allowed_emails.each do |email|
  next if User.exists?(email: email)

  password = ENV.fetch("SEED_USER_PASSWORD")
  User.create!(email: email, password: password)
  puts "Created user: #{email}"
end
