class ApplicationController < ActionController::API
  before_action :authenticate_user!

  private

  def authenticate_user!
    super
  rescue JWT::DecodeError
    render json: { error: "認証が必要です" }, status: :unauthorized
  end
end
