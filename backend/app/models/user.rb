class User < ApplicationRecord
  devise :database_authenticatable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  has_many :events, dependent: :destroy
  has_many :coffee_beans, dependent: :destroy
end
