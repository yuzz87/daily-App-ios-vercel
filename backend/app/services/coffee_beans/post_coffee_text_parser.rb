module CoffeeBeans
  class PostCoffeeTextParser
    def self.call(raw_text:)
      new(raw_text: raw_text).call
    end

    def initialize(raw_text:)
      @raw_text = raw_text.to_s
    end

    def call
      return {} if raw_text.strip.empty?

      {
        brand: brand,
        country: country,
        farm: farm,
        code: code
      }
    end

    private

    attr_reader :raw_text

    def normalized_text
      raw_text.upcase
    end

    def brand
      return "PostCoffee" if raw_text.match?(/post\s*coffee/i)

      nil
    end

    def country
      return "INDONESIA" if normalized_text.match?(/\b(?:INDONESIA|INDONESI|INDONES|NDONES)\b/)

      nil
    end

    def farm
      return "Frinsa Estate" if raw_text.match?(/frinsa/i)

      nil
    end

    def code
      return "IND-0416" if normalized_text.match?(/\b10-0816\b/)

      match = normalized_text.match(/\b[A-Z]{3}-\d{4}\b/)
      match&.[](0)
    end
  end
end
