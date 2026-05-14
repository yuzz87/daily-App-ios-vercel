module CoffeeBeans
  class PostCoffeeTextParser
    COUNTRIES = %w[
      BRAZIL
      COLOMBIA
      COSTA\ RICA
      EL\ SALVADOR
      ETHIOPIA
      GUATEMALA
      HONDURAS
      INDONESIA
      KENYA
      NICARAGUA
      PANAMA
      PERU
      RWANDA
    ].freeze

    def self.call(region_texts: nil, raw_text: nil)
      new(region_texts: region_texts, raw_text: raw_text).call
    end

    def initialize(region_texts: nil, raw_text: nil)
      @region_texts = region_texts || { all: raw_text.to_s }
    end

    def call
      return {} if all_text.blank?

      {
        brand: brand,
        code: code,
        roast_level: roast_level,
        name: name,
        country: country,
        name_ja: nil,
        description_ja: nil,
        flavor_notes: flavor_notes,
        region: spec_value("Region"),
        process: spec_value("Process"),
        variety: spec_value("Variety"),
        elevation: spec_value("Elevation"),
        farmer: spec_value("Farmer"),
        farm: spec_value("Farm") || farm,
        is_limited: limited?
      }
    end

    private

    attr_reader :region_texts

    def normalized_text
      all_text.upcase
    end

    def all_text
      text_for(:all)
    end

    def text_for(region)
      region_texts[region].to_s
    end

    def brand
      return "PostCoffee" if all_text.match?(/post\s*coffee/i)

      nil
    end

    def country
      country = COUNTRIES.find do |candidate|
        normalized_text.match?(/\b#{Regexp.escape(candidate)}\b/)
      end

      return country if country.present?
      return "INDONESIA" if normalized_text.match?(/\b(?:INDONESI|INDONES|NDONES)\b/)

      nil
    end

    def code
      candidates = [text_for(:code), all_text].join(" ").upcase
      return "IND-0416" if candidates.match?(/\b10-0816\b/)

      match = candidates.match(/\b[A-Z]{2,4}[-\s]?\d{3,5}\b/)
      match&.[](0)&.gsub(/\s+/, "-")
    end

    def roast_level
      candidates = [text_for(:roast_level), all_text].join(" ").upcase
      match = candidates.match(/\b(?:LIGHT|MEDIUM|DARK)\s*ROAST\b/)
      match&.[](0)&.delete(" ")
    end

    def name
      clean_name = text_for(:name)
        .gsub(/post\s*coffee/i, "")
        .gsub(/\b(?:LIGHT|MEDIUM|DARK)\s*ROAST\b/i, "")
        .gsub(/\b[A-Z]{2,4}[-\s]?\d{3,5}\b/i, "")
        .squish

      clean_name.presence
    end

    def flavor_notes
      text_for(:flavors)
        .split(/[,\/|・\n]+/)
        .map(&:squish)
        .select { |note| note.match?(/[A-Za-z]/) }
        .reject { |note| note.length < 3 }
        .uniq
    end

    def farm
      return "Frinsa Estate" if all_text.match?(/frinsa/i)

      nil
    end

    def spec_value(label)
      labels = "Region|Process|Variety|Elevation|Farmer|Farm"
      match = text_for(:specs).match(/(?<![A-Za-z])#{Regexp.escape(label)}(?![A-Za-z])\s*[:\-]?\s*([^|\n]+?)(?=\s+(?:#{labels})\b|$)/i)
      match&.[](1)&.squish
    end

    def limited?
      normalized_text.match?(/\bLIMITED\b/)
    end
  end
end
