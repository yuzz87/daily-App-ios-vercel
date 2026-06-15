module Api
  module Auth
    class RegistrationsController < Devise::RegistrationsController
      skip_before_action :authenticate_user!, only: [:create]

      before_action :check_allowed_email, only: :create

      private

      def check_allowed_email
        allowed = ENV.fetch("ALLOWED_EMAILS", "").split(",").map(&:strip)
        return if allowed.include?(sign_up_params[:email])

        render json: { error: "登録が許可されていないメールアドレスです" }, status: :forbidden
      end

      def respond_with(resource, _opts = {})
        if resource.persisted?
          render json: { user: { email: resource.email } }, status: :created
        else
          render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
        end
      end
    end
  end
end
