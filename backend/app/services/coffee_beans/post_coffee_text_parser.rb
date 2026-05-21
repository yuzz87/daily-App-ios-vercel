module CoffeeBeans
  class PostCoffeeTextParser
    include PostCoffeeTextParserLookups
    include PostCoffeeTextParserHelpers

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
        name_ja: name_ja,
        description_ja: description_ja,
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

      country_from_code
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

      return nil if noisy_name?(clean_name)

      clean_name.presence
    end

    def flavor_notes
      notes = split_flavor_notes
      alias_notes = FLAVOR_NOTE_ALIASES.filter_map do |canonical, pattern|
        canonical if flavor_candidate_text.upcase.match?(pattern)
      end

      (notes.presence || alias_notes).uniq
    end

    def split_flavor_notes
      flavor_source
        .split(/[,\/|・\n]+/)
        .map(&:squish)
        .flat_map { |note| note.split(/\s{2,}/) }
        .map { |note| note.gsub(/\A(?:Flavor|Flavors|Notes?)\s*[:\-]?\s*/i, "") }
        .reject { |note| note.match?(/\d/) }
        .map { |note| note.gsub(/[^A-Za-z ]/, "").squish }
        .select { |note| note.match?(/[A-Za-z]/) }
        .reject { |note| note.length < 3 }
        .reject { |note| spec_label?(note) }
        .uniq
    end

    def farm
      nil
    end

    def name_ja
      line = japanese_description_lines.first
      return nil if noisy_japanese_line?(line)

      line
    end

    def description_ja
      lines = japanese_description_lines.drop(1).reject { |line| noisy_japanese_line?(line) }
      return nil if lines.empty?

      lines.join("\n")
    end

    def spec_value(label)
      return region_value if label == "Region"
      return process_value if label == "Process"
      return variety_value if label == "Variety"
      return elevation_value if label == "Elevation"
      return farmer_value if label == "Farmer"
      return farm_value if label == "Farm"

      match = searchable_specs_text.match(/(?<![A-Za-z])#{Regexp.escape(label)}(?![A-Za-z])\s*[:\-]?\s*([^|\n]+?)(?=\s+(?:#{SPEC_LABELS_PATTERN})\b|$)/i)
      clean_spec_value(match&.[](1))
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
        .scan(/\b(?:[A-Z]{2,4}[-\s]?[A-Z0-9]{3,5}|[A-Z0-9]{2}[-\s][A-Z0-9]{4})\b/)
    end

    def normalized_specs_text
      SPEC_LABEL_ALIASES.reduce(text_for(:specs)) do |text, (canonical, pattern)|
        text.gsub(pattern, canonical)
      end.squish
    end

    def searchable_specs_text
      @searchable_specs_text ||= begin
        text = [
          text_for(:specs),
          text_for(:description),
          text_for(:flavors),
          all_text
        ].join("\n")

        SPEC_LABEL_ALIASES.reduce(text) do |current, (canonical, pattern)|
          current.gsub(pattern, canonical)
        end.squish
      end
    end

    def japanese_description_lines
      @japanese_description_lines ||= text_for(:description_ja)
        .to_s
        .lines
        .map(&:squish)
        .select { |line| line.match?(/[\p{Hiragana}\p{Katakana}\p{Han}]/) }
        .reject { |line| line.match?(/\A[\p{Punct}\s]+\z/) }
    end

    def country_from_code
      COUNTRY_BY_CODE_PREFIX[code.to_s.split("-").first]
    end

    def flavor_candidate_text
      [
        text_for(:flavors),
        text_for(:description),
        all_text,
        text_for(:all_ja)
      ].join("\n")
    end

    def flavor_source
      flavor_candidate_text.lines.map(&:squish).find { |line| flavor_line?(line) } || text_for(:flavors)
    end

    def region_value
      explicit = searchable_specs_text.match(/\bRegion\s+([^|\n]+?)(?=\s+(?:#{SPEC_LABELS_PATTERN})\b|$)/i)&.[](1)
      explicit = clean_spec_value(explicit)
      return explicit if explicit.present? && !explicit.match?(/\bProcess\b/i)

      region_process = searchable_specs_text.match(/Region\s+Process\s+(.+?)(?=\s+Variety\b|\s+Elevation\b|\s+Farmer\b|\z)/i)&.[](1)
      return split_region_process(region_process).first if region_process.present?

      clean_spec_value(extract_labeled_value("Region"))
    end

    def process_value
      explicit = searchable_specs_text.match(/\bProcess\s+([^|\n]+?)(?=\s+(?:#{SPEC_LABELS_PATTERN})\b|$)/i)&.[](1)
      explicit = clean_spec_value(explicit)
      return explicit if explicit.present? && explicit.match?(/\A(?:Washed|Natural|Honey|Anaerobic|Pulped|Semi)/i) && !explicit.match?(/\b(?:Region|Variety|Elevation|Farmer|Farm)\b/i)

      region_process = searchable_specs_text.match(/Region\s+Process\s+(.+?)(?=\s+Variety\b|\s+Elevation\b|\s+Farmer\b|\z)/i)&.[](1)
      return split_region_process(region_process).last if region_process.present?

      clean_spec_value(extract_labeled_value("Process"))
    end

    def elevation_value
      range = searchable_specs_text.match(/\b\d{1,2},?\d{3}\s*m\s*[-–]\s*\d{1,2},?\d{3}\s*m\b/i)&.[](0)&.squish
      return range if range.present?

      compact = searchable_specs_text.match(/\b(\d{1,2},?\d{3})m\s+.+?-\s+(\d{1,2},?\d{3})m\b/i)
      return "#{compact[1]}m - #{compact[2]}m" if compact

      clean_spec_value(extract_labeled_value("Elevation"))
    end

    def variety_value
      value = searchable_specs_text.match(/\bVariety\s+(.+?)(?=\s+\|?\s*(?:#{SPEC_LABELS_PATTERN})\b|\z)/i)&.[](1)
      value = clean_spec_value(value)
      return nil if value.blank?

      value
        .split(",")
        .map { |part| part.gsub(/[^A-Za-z ]/, "").squish }
        .select { |part| part.match?(/[A-Za-z]/) }
        .map { |part| part.split.first }
        .select { |part| part.length >= 3 }
        .take(4)
        .join(", ")
        .presence
    end

    def farmer_value
      value = clean_spec_value(extract_labeled_value("Farmer"))
      value = nil if value.to_s.match?(/\A\s*Elevation\s*\z/i)
      value = searchable_specs_text.match(/ROAST\s*DATE\.?\s*©?\s*(.+?)(?=\s+(?:#{SPEC_LABELS_PATTERN})\b|\z)/i)&.[](1) if value.blank?
      value = searchable_specs_text.match(/\b(Celso\s+.+?Vasquez)\b/i)&.[](1) if value.blank?
      value = clean_spec_value(value)
      return nil if value.blank?

      value
        .gsub(/\bROAST\s*DATE\.?\b/i, "")
        .gsub(/[©_]/, " ")
        .gsub(/\bbee\b.*\z/i, "")
        .gsub(/\bTOR\b.*\z/i, "")
        .gsub(/\bCelso\s+1,?800m\s+Juver\b/i, "Celso Juver")
        .gsub(/\bCelso\s+Juver\s+1,?800m\s+Carrasco\b/i, "Celso Juver Carrasco")
        .gsub(/,\s*-\s*2,000m\s*/i, ", ")
        .gsub(/\A[^A-Za-z]+/, "")
        .gsub(/,\s*\z/, "")
        .squish
        .presence
    end

    def farm_value
      match = normalized_specs_text.match(/(?<![A-Za-z])Farm(?![A-Za-z])\s*[:\-]?\s*([^|\n]+?)(?=\s+(?:#{SPEC_LABELS_PATTERN})\b|$)/i)
      value = clean_spec_value(match&.[](1))
      return nil if value.to_s.match?(/\A(?:Elevation|Farmer|ROAST DATE)?\z/i)

      value
    end

    def extract_labeled_value(label)
      searchable_specs_text.match(/(?<![A-Za-z])#{Regexp.escape(label)}(?![A-Za-z])\s*[:\-]?\s*([^|\n]+?)(?=\s+(?:#{SPEC_LABELS_PATTERN})\b|$)/i)&.[](1)
    end
  end
end
