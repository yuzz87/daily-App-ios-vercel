frontend_origins = ENV.fetch("FRONTEND_URL", "")
  .split(",")
  .map(&:strip)
  .reject(&:blank?)

local_origins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]

allowed_origins = frontend_origins
allowed_origins += local_origins if Rails.env.development? || Rails.env.test?
allowed_origins.uniq!

if Rails.env.production? && allowed_origins.empty?
  raise "FRONTEND_URL must be configured in production for CORS."
end

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"],
      max_age: 600
  end
end
