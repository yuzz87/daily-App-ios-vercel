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
end
