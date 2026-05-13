Rails.application.routes.draw do
  namespace :api do
    resources :holidays, only: [:index]
    resources :events
    resources :coffee_beans, only: [:index, :show, :update, :destroy] do
      collection do
        post :analyze
      end

      resources :tasting_notes, only: [:create]
    end
    resources :tasting_notes, only: [:update, :destroy]
    resources :study_sessions, only: [:index, :create]
    resource :active_timer, only: [:show, :update, :destroy]
  end

  get "up" => "rails/health#show", as: :rails_health_check

end
