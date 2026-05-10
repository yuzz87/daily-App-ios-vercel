class Holiday < ApplicationRecord
  validates :date, presence: true, uniqueness: true
  validates :name, presence: true

  def as_json_for_api
    {
      id: id,
      date: date&.iso8601,
      name: name
    }
  end
end