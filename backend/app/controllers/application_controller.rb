class ApplicationController < ActionController::API
  before_action :authenticate_user!, unless: :auth_bypassed?

  private

  def authenticate_user!
    super
  rescue JWT::DecodeError
    render json: { error: "認証が必要です" }, status: :unauthorized
  end

  def auth_bypassed?
    Rails.env.development?
  end
end
