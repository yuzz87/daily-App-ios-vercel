class ApplicationController < ActionController::API
  before_action :authenticate_user!

  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

  private

  def authenticate_user!
    super
  rescue JWT::DecodeError
    render json: { error: "Authentication is required." }, status: :unauthorized
  end

  def render_not_found
    render json: { error: "Resource not found." }, status: :not_found
  end
end
