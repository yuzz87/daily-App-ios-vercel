class StudySession < ApplicationRecord
  validates :category, presence: true
  validates :duration_seconds, numericality: { only_integer: true, greater_than: 0 }
  validates :recorded_at, presence: true

  before_validation :set_default_recorded_at

  def as_json_for_api
    {
      id: id,
      category: category,
      duration_seconds: duration_seconds,
      recorded_at: recorded_at&.iso8601,
      memo: memo,
      created_at: created_at&.iso8601,
      updated_at: updated_at&.iso8601
    }
  end

  private

  def set_default_recorded_at
    self.recorded_at ||= Time.current
  end
end
