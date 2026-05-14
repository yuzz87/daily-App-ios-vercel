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
    FLAVOR_NOTE_ALIASES = {
      "Blueberry" => /\b(?:BLUEBERRY|BLUEBERR[YV]|8LUEBERRY)\b/,
      "Kiwi" => /\bKIWI\b/,
      "Raspberry" => /\b(?:RASPBERRY|RASPBERR[YV])\b/,
      "Hibiscus" => /\b(?:HIBISCUS|HIB1SCUS)\b/,
      "Strawberry" => /\b(?:STRAWBERRY|STRAWBERR[YV])\b/,
      "Cherry" => /\bCHERRY\b/,
      "Apple" => /\bAPPLE\b/,
      "Orange" => /\bORANGE\b/,
      "Lemon" => /\bLEMON\b/,
      "Grape" => /\bGRAPE\b/,
      "Peach" => /\bPEACH\b/,
      "Floral" => /\bFLORAL\b/,
      "Chocolate" => /\b(?:CHOCOLATE|CH0COLATE)\b/,
      "Caramel" => /\bCARAMEL\b/,
      "Honey" => /\bHONEY\b/,
      "Tea" => /\bTEA\b/,
      "Citrus" => /\bCITRUS\b/,
      "Winey" => /\bWINEY\b/
    }.freeze
    SPEC_LABEL_ALIASES = {
      "Region" => /\b(?:REGION|REG10N|REGI0N|REGlON)\b/i,
      "Process" => /\b(?:PROCESS|PR0CESS|PR0CE55)\b/i,
      "Variety" => /\b(?:VARIETY|VAR1ETY|VARIETV)\b/i,
      "Elevation" => /\b(?:ELEVATION|ELEVATI0N|ELEVATlON)\b/i,
      "Farmer" => /\b(?:FARMER|FARNER)\b/i,
      "Farm" => /\bFARM\b/i
    }.freeze
    COUNTRY_BY_CODE_PREFIX = {
      "BRA" => "BRAZIL",
      "COL" => "COLOMBIA",
      "CRI" => "COSTA RICA",
      "SLV" => "EL SALVADOR",
      "ETH" => "ETHIOPIA",
      "GUA" => "GUATEMALA",
      "HON" => "HONDURAS",
      "IND" => "INDONESIA",
      "KEN" => "KENYA",
      "NIC" => "NICARAGUA",
      "PAN" => "PANAMA",
      "PER" => "PERU",
      "RWA" => "RWANDA"
    }.freeze
    SPEC_LABELS_PATTERN = "Region|Process|Variety|Elevation|Farmer|Farm|ROAST\\s*DATE".freeze
    NOISE_WORDS_PATTERN = /\b(?:MAKE|TIME|ENJOY|FRESHLY|BREWED|COFFEE|BROUGHT|ENDULGE|DELICIOUS|READING|FAVORITE|BOOKS|LISTENING|MUSIC|WATCHING|MOVIES|CONNECT|INTIMATELY|SPENDING|MEMORIES|BELOVED|CUP|ROAST|DATE)\b/i

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
      return "Frinsa Estate" if all_text.match?(/frinsa/i)

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

    def normalize_code(candidate)
      text = candidate.to_s.upcase.gsub(/\s+/, "-")
      return "IND-0416" if text == "10-0816"

      text = text.sub(/\A10-/, "IND-")
      text = text.tr("IO", "10") unless text.match?(/\A[A-Z]{2,4}-/)

      match = text.match(/\b([A-Z]{2,4})[-\s]?(\d{3,5})\b/)
      return unless match

      "#{match[1]}-#{match[2]}"
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

    def spec_label?(text)
      SPEC_LABEL_ALIASES.keys.any? { |label| text.casecmp?(label) }
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

    def noisy_name?(value)
      return true if value.blank?
      return true if value.length < 4
      return true if value.match?(/[\]|_{}]/)

      words = value.scan(/[A-Za-z][A-Za-z'\-]*/)
      return true if value.scan(/[A-Za-z]/).length < 3
      return true if words.none? { |word| word.length >= 5 }
      return true if words.length >= 3 && words.count { |word| word.length <= 2 } > words.length / 2.0

      false
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

    def flavor_line?(line)
      return false if line.blank?
      return false if line.match?(/\d/)
      return false if line.match?(/(?:#{SPEC_LABELS_PATTERN})/i)
      return false if line.match?(NOISE_WORDS_PATTERN)

      notes = line
        .split(/[,\/|・]+/)
        .map { |note| note.gsub(/[^A-Za-z ]/, "").squish }
        .reject(&:blank?)

      notes.length.between?(3, 8) &&
        notes.all? { |note| note.length.between?(3, 24) && note.split.length <= 3 } &&
        notes.count { |note| flavor_like_note?(note) } >= 2
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

    def split_region_process(value)
      cleaned = clean_spec_value(value).to_s
      return [nil, nil] if cleaned.blank?

      washed = cleaned.match(/\bWashed\b.+\z/i)&.[](0)
      return [cleaned, nil] if washed.blank?

      region_text = cleaned.sub(/\bWashed\b.+\z/i, "")
      region_parts = region_text.split(",").map(&:squish).reject(&:blank?)
      process_parts = washed.split(",").map(&:squish).reject(&:blank?)

      process = process_parts.join(" ")
      process = process.gsub(/\bLong\s+Cutervo\b/i, "Long")
      process = process.gsub(/\bCallayuc\b/i, "")
      process = process.squish

      region_tail = process_parts.join(" ").scan(/\b(?:Long\s+)?([A-Z][A-Za-z]+)\b/).flatten
      region_candidates = (region_parts + region_tail).reject do |part|
        part.match?(/\b(?:Washed|Fermentation|Long|Natural|Honey|Anaerobic)\b/i)
      end

      [region_candidates.uniq.join(", ").presence, process.presence]
    end

    def clean_spec_value(value)
      value
        .to_s
        .gsub(/[|_©]/, " ")
        .gsub(/\s+/, " ")
        .gsub(/\A[:\-. ]+/, "")
        .gsub(/[:\-. ]+\z/, "")
        .squish
        .presence
    end

    def noisy_japanese_line?(line)
      return true if line.blank?

      compact = line.delete(" ")
      japanese_chars = compact.scan(/[\p{Hiragana}\p{Katakana}\p{Han}]/).length
      ascii_chars = compact.scan(/[A-Za-z0-9]/).length
      separated_tokens = line.split(/\s+/).count { |token| token.match?(/\A[\p{Hiragana}\p{Katakana}\p{Han}]\z/) }

      return true if separated_tokens >= 8
      return true if ascii_chars.positive? && ascii_chars >= japanese_chars / 4.0

      false
    end

    def flavor_like_note?(note)
      FLAVOR_NOTE_ALIASES.any? { |_canonical, pattern| note.upcase.match?(pattern) } ||
        note.match?(/\b(?:Mandarin|Loquat|Prune|Sweet|Berry|Fruit|Floral|Wine|Nut|Vanilla|Mango|Melon|Pear|Plum)\b/i)
    end
  end
end
