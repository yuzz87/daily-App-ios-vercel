ENV["RAILS_ENV"] ||= "test"
ENV["DEVISE_JWT_SECRET_KEY"] ||= "test-secret-key-#{'x' * 64}"
require_relative "../config/environment"
require "rails/test_help"
require "securerandom"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors, with: :threads)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
    def create_user(email: nil)
      User.create!(
        email: email || "user-#{SecureRandom.hex(8)}@example.com",
        password: "password123"
      )
    end

    def auth_headers_for(user)
      token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
      { "Authorization" => "Bearer #{token}" }
    end
  end
end
