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
    COUNTRY_ALIASES = {
      "INDONESIA" => /\b(?:INDONESIA|INDONESI|INDONES|NDONES|IND0NESIA|1NDONESIA)\b/,
      "ETHIOPIA" => /\b(?:ETHIOPIA|ETHIOPI|ETHOPIA|ET?H10PIA)\b/,
      "COLOMBIA" => /\b(?:COLOMBIA|COLOMBI|C0LOMBIA)\b/,
      "KENYA" => /\b(?:KENYA|KEMYA)\b/,
      "BRAZIL" => /\b(?:BRAZIL|BRASIL|8RAZIL)\b/,
      "GUATEMALA" => /\b(?:GUATEMALA|GUATEMAL|GUATEM4LA)\b/,
      "HONDURAS" => /\b(?:HONDURAS|HONDURA5)\b/,
      "RWANDA" => /\b(?:RWANDA|RWAND4)\b/,
      "PANAMA" => /\b(?:PANAMA|PAN4MA)\b/,
      "PERU" => /\b(?:PERU|PERV)\b/,
      "NICARAGUA" => /\b(?:NICARAGUA|NICARAGU4)\b/,
      "COSTA RICA" => /\b(?:COSTA\s*RICA|C0STA\s*RICA)\b/,
      "EL SALVADOR" => /\b(?:EL\s*SALVADOR|EL\s*SALVAD0R)\b/
    }.freeze
    ROAST_LEVEL_ALIASES = {
      "LIGHTROAST" => /\b(?:LIGHT|L1GHT|LIG?HT)\s*(?:ROAST|R0AST|RO4ST)\b/,
      "MEDIUMROAST" => /\b(?:MEDIUM|MED1UM)\s*(?:ROAST|R0AST|RO4ST)\b/,
      "DARKROAST" => /\b(?:DARK|D4RK)\s*(?:ROAST|R0AST|RO4ST)\b/
    }.freeze

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
      return "PostCoffee" if candidate_text(:brand).match?(/p[o0]st\s*c[o0]ffee/i)

      nil
    end

    def country
      candidates = candidate_text(:country).upcase
      country = COUNTRIES.find do |candidate|
        candidates.match?(/\b#{Regexp.escape(candidate)}\b/)
      end

      return country if country.present?

      alias_match = COUNTRY_ALIASES.find do |_country, pattern|
        candidates.match?(pattern)
      end

      return alias_match.first if alias_match

      nil
    end

    def code
      candidates = code_candidates
      corrected = candidates.filter_map { |candidate| normalize_code(candidate) }.first
      return corrected if corrected.present?

      nil
    end

    def roast_level
      candidates = candidate_text(:roast_level).upcase
      match = ROAST_LEVEL_ALIASES.find do |_canonical, pattern|
        candidates.match?(pattern)
      end

      match&.first
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

    def candidate_text(region)
      [text_for(region), all_text].join(" ")
    end

    def code_candidates
      candidate_text(:code)
        .upcase
        .scan(/\b(?:[A-ZIO]{2,4}[-\s]?[A-ZIO0-9]{3,5}|[A-ZIO0-9]{2}[-\s][A-ZIO0-9]{4})\b/)
    end

    def normalize_code(candidate)
      text = candidate.to_s.upcase.gsub(/\s+/, "-")
      return "IND-0416" if text == "10-0816"

      text = text.sub(/\A10-/, "IND-")
      text = text.tr("IO", "10") unless text.match?(/\A[A-Z]{2,4}-/)

      match = text.match(/\b([A-Z]{2,4})[-\s]?(\d{3,5})\b/)
      return unless match

      "#{match[1]}-#{match[2]}"
    end
  end
end
