Rack::Attack.cache.store = Rails.cache

# /api/auth/sign_in への試行を IP アドレスごとに制限
# 20秒間に5回まで（5回失敗したら20秒待つ必要がある）
Rack::Attack.throttle("sign_in/ip", limit: 5, period: 20) do |req|
  req.ip if req.path == "/api/auth/sign_in" && req.post?
end

# 同じメールアドレスへの試行を制限
# 1分間に10回まで
Rack::Attack.throttle("sign_in/email", limit: 10, period: 60) do |req|
  if req.path == "/api/auth/sign_in" && req.post?
    body = req.body.read
    req.body.rewind
    email = begin
      JSON.parse(body).dig("user", "email").to_s.downcase.strip
    rescue
      nil
    end
    email.presence
  end
end

# 制限超過時は JSON で 429 を返す
Rack::Attack.throttled_responder = lambda do |_req|
  [
    429,
    { "Content-Type" => "application/json" },
    [ { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" }.to_json ]
  ]
end
