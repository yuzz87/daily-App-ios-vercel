module CoffeeBeans
  class ExtractionValidator
    EXPECTED_KEYS = %i[
      brand
      code
      roast_level
      name
      country
      name_ja
      description_ja
      flavor_notes
      region
      process
      variety
      elevation
      farmer
      farm
      is_limited
      raw_text
      status
    ].freeze

    def self.call(data)
      new(data: data).call
    end

    def initialize(data:)
      @data = data
    end

    def call
      EXPECTED_KEYS.index_with do |key|
        value_for(key)
      end
    end

    private

    attr_reader :data

    def value_for(key)
      case key
      when :flavor_notes
        Array(data[:flavor_notes]).map(&:to_s).map(&:strip).select(&:present?)
      when :is_limited
        data[:is_limited] == true
      when :status
        CoffeeBean::STATUSES.include?(data[:status]) ? data[:status] : "draft"
      when :raw_text
        raw_text(data[:raw_text])
      else
        nullable_string(data[key])
      end
    end

    def nullable_string(value)
      return nil if value.nil?

      text = value.to_s.squish
      text.presence
    end

    def raw_text(value)
      return nil if value.nil?

      text = value.to_s
      text.strip.empty? ? nil : text
    end
  end
end
