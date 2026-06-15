password = ENV["SEED_USER_PASSWORD"]

if password.blank?
  puts "SEED_USER_PASSWORD not set, skipping user seed."
  return
end

allowed_emails = ENV.fetch("ALLOWED_EMAILS", "")
  .split(",")
  .map(&:strip)
  .reject(&:blank?)

if allowed_emails.empty?
  puts "ALLOWED_EMAILS not set, skipping user seed."
  return
end

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
