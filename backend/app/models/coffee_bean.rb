class CoffeeBean < ApplicationRecord
  has_many :tasting_notes, dependent: :destroy

  STATUSES = %w[draft confirmed].freeze

  validates :status, inclusion: { in: STATUSES }
  validate :flavor_notes_must_be_an_array

  private

  def flavor_notes_must_be_an_array
    return if flavor_notes.is_a?(Array)

    errors.add(:flavor_notes, "must be an array")
  end
end
