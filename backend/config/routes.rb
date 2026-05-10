Rails.application.routes.draw do
  namespace :api do
    resources :holidays, only: [:index]
    resources :events
  end

  get "up" => "rails/health#show", as: :rails_health_check

end
