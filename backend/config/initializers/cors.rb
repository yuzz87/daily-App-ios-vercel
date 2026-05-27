frontend_origins = ENV.fetch("FRONTEND_URL", "http://localhost:3000")
  .split(",")
  .map(&:strip)

allowed_origins = (
  frontend_origins +
  [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://pwa-test-daily-v1.vercel.app"
  ]
).uniq

Rails.application.config.middleware.insert_before 0, Rack::Cors do
   allow do
     origins(*allowed_origins)

     resource "*",
       headers: :any,
       methods: [:get, :post, :put, :patch, :delete, :options, :head],
       expose: ["Authorization"]
   end
 end
