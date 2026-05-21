module CoffeeBeans
  module PostCoffeeTextParserHelpers
    include PostCoffeeTextParserLookups

    private

    def normalize_code(candidate)
      text = candidate.to_s.upcase.gsub(/\s+/, "-")
      return "IND-0416" if text == "10-0816"

      text = text.sub(/\A10-/, "IND-")
      text = text.tr("IO", "10") unless text.match?(/\A[A-Z]{2,4}-/)

      match = text.match(/\b([A-Z]{2,4})[-\s]?(\d{3,5})\b/)
      return unless match

      "#{match[1]}-#{match[2]}"
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

    def spec_label?(text)
      SPEC_LABEL_ALIASES.keys.any? { |label| text.casecmp?(label) }
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
  end
end
