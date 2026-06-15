module Api
  module Auth
    class SessionsController < Devise::SessionsController
      skip_before_action :authenticate_user!, only: [:create]

      private

      def respond_with(resource, _opts = {})
        render json: { user: { email: resource.email } }, status: :ok
      end

      def respond_to_on_destroy
        render json: { message: "ログアウトしました" }, status: :ok
      end
    end
  end
end
