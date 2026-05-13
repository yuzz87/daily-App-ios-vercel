class TastingNote < ApplicationRecord
  belongs_to :coffee_bean

  SCORE_ATTRIBUTES = %i[
    rating
    acidity
    bitterness
    sweetness
    aroma
    body
  ].freeze

  SCORE_ATTRIBUTES.each do |attribute|
    validates attribute,
      numericality: {
        only_integer: true,
        greater_than_or_equal_to: 1,
        less_than_or_equal_to: 5
      },
      allow_nil: true
  end

  def as_json_for_api
    {
      id: id,
      coffee_bean_id: coffee_bean_id,
      rating: rating,
      acidity: acidity,
      bitterness: bitterness,
      sweetness: sweetness,
      aroma: aroma,
      body: body,
      memo: memo,
      brew_method: brew_method,
      grind_size: grind_size,
      water_temp: water_temp,
      coffee_grams: coffee_grams,
      water_grams: water_grams,
      brew_time: brew_time,
      created_at: created_at&.iso8601,
      updated_at: updated_at&.iso8601
    }
  end
end
