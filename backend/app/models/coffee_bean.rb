class CoffeeBean < ApplicationRecord
  belongs_to :user
  has_many :tasting_notes, dependent: :destroy

  STATUSES = %w[draft confirmed].freeze

  validates :status, inclusion: { in: STATUSES }
  validate :flavor_notes_must_be_an_array

  def as_json_for_api(include_tasting_notes: false)
    data = {
      id: id,
      image_url: image_url,
      brand: brand,
      code: code,
      roast_level: roast_level,
      name: name,
      country: country,
      name_ja: name_ja,
      description_ja: description_ja,
      flavor_notes: flavor_notes || [],
      region: region,
      process: process,
      variety: variety,
      elevation: elevation,
      farmer: farmer,
      farm: farm,
      is_limited: is_limited,
      raw_text: raw_text,
      status: status,
      created_at: created_at&.iso8601,
      updated_at: updated_at&.iso8601
    }

    if include_tasting_notes
      data[:tasting_notes] = tasting_notes.order(created_at: :desc).map(&:as_json_for_api)
    end

    data
  end

  private

  def flavor_notes_must_be_an_array
    return if flavor_notes.is_a?(Array)

    errors.add(:flavor_notes, "must be an array")
  end
end
