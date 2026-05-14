password = ENV["SEED_USER_PASSWORD"]

if password.nil?
  puts "SEED_USER_PASSWORD not set, skipping user seed."
  return
end

allowed_emails = ENV.fetch("ALLOWED_EMAILS", "").split(",").map(&:strip)

allowed_emails.each do |email|
  next if User.exists?(email: email)

  User.create!(email: email, password: password)
  puts "Created user: #{email}"
end
