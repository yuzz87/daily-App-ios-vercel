class ActiveTimer < ApplicationRecord
  validates :category, presence: true
  validates :elapsed_seconds, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :laps_must_be_an_array

  before_validation :normalize_laps

  def self.current
    first_or_create!(category: "Programming", elapsed_seconds: 0, is_running: false, laps: [])
  end

  def live_elapsed_seconds
    return elapsed_seconds unless is_running? && started_at.present?

    elapsed_seconds + [Time.current.to_i - started_at.to_i, 0].max
  end

  def as_json_for_api
    {
      id: id,
      category: category,
      elapsed_seconds: live_elapsed_seconds,
      is_running: is_running,
      started_at: started_at&.iso8601,
      laps: laps || [],
      created_at: created_at&.iso8601,
      updated_at: updated_at&.iso8601
    }
  end

  private

  def normalize_laps
    self.laps = Array(laps).map(&:to_i)
  end

  def laps_must_be_an_array
    return if laps.is_a?(Array)

    errors.add(:laps, "must be an array")
  end
end
