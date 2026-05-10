class Event < ApplicationRecord
  validates :title, presence: true
  validates :start_at, presence: true
  validates :end_at, presence: true

  validate :end_at_after_start_at

  def as_json_for_api
    {
      id: id,
      title: title,
      description: description,
      start_at: start_at&.iso8601,
      end_at: end_at&.iso8601,
      all_day: all_day,
      color: color,
      created_at: created_at&.iso8601,
      updated_at: updated_at&.iso8601
    }
  end

  private

  def end_at_after_start_at
    return if end_at.blank?
    return if start_at.blank?
    return if end_at >= start_at

    errors.add(:end_at, "must be after start_at")
  end
end