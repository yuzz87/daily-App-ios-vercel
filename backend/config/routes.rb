Rails.application.routes.draw do
  devise_for :users,
    path: "api/auth",
    path_names: { sign_in: "sign_in", sign_out: "sign_out", registration: "sign_up" },
    controllers: {
      sessions: "api/auth/sessions",
      registrations: "api/auth/registrations"
    }

  namespace :api do
    resources :holidays, only: [:index]
    resources :events
    resources :coffee_beans, only: [:index, :show, :create, :update, :destroy] do
      resources :tasting_notes, only: [:create]
    end
    resources :tasting_notes, only: [:update, :destroy]
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
