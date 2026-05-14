require "csv"

module CoffeeBeans
  class PostCoffeeLayoutExtractor
    REGIONS = {
      code: [0.00, 0.00, 0.32, 0.17],
      brand: [0.25, 0.00, 0.75, 0.17],
      roast_level: [0.60, 0.00, 1.00, 0.19],
      name: [0.05, 0.13, 0.95, 0.31],
      country: [0.04, 0.27, 0.96, 0.48],
      description: [0.04, 0.44, 0.96, 0.62],
      flavors: [0.04, 0.58, 0.96, 0.74],
      specs: [0.04, 0.70, 0.96, 1.00]
    }.freeze
    MIN_REGION_OVERLAP = 0.15

    OCR_OPTIONS = ["--psm", "6"].freeze

    def self.call(image_path:)
      new(image_path: image_path).call
    end

    def initialize(image_path:)
      @image_path = image_path
    end

    def call
      tsv = tesseract_tsv(lang: "eng")
      words = parse_words(tsv)

      if words.empty?
        text = tsv.to_s.strip.empty? ? nil : tsv.to_s
        return {
          region_texts: text ? { all: text } : {},
          raw_text: text
        }
      end

      region_texts = group_words_by_region(words)
      region_texts = region_texts.merge(japanese_region_texts)

      {
        region_texts: region_texts,
        raw_text: raw_text(region_texts)
      }
    rescue Ocr::TesseractClient::Error => e
      Rails.logger.warn("Tesseract OCR failed: #{e.class}: #{e.message}")

      {
        region_texts: {},
        raw_text: nil
      }
    end

    private

    attr_reader :image_path

    def tesseract_tsv(lang:)
      Ocr::TesseractClient.call(
        image_path: image_path,
        lang: lang,
        options: OCR_OPTIONS,
        output_format: "tsv"
      )
    rescue ArgumentError => e
      raise unless e.message.include?("unknown keyword")

      Ocr::TesseractClient.call(image_path: image_path)
    end

    def japanese_region_texts
      tsv = tesseract_tsv(lang: "jpn+eng")
      words = parse_words(tsv)
      return {} if words.empty?

      grouped = group_words_by_region(words)
      {
        description_ja: grouped[:description],
        all_ja: grouped[:all]
      }.compact
    rescue Ocr::TesseractClient::Error => e
      Rails.logger.warn("Tesseract Japanese OCR failed: #{e.class}: #{e.message}")
      {}
    end

    def parse_words(tsv)
      rows = CSV.parse(tsv.to_s, headers: true, col_sep: "\t")
      return [] unless rows.headers&.include?("level")

      page = rows.find { |row| row["level"].to_i == 1 }
      page_width = positive_integer(page&.[]("width")) || 1
      page_height = positive_integer(page&.[]("height")) || 1

      rows.filter_map do |row|
        next unless row["level"].to_i == 5

        text = row["text"].to_s.strip
        next if text.blank?

        confidence = row["conf"].to_f
        next if confidence.negative?

        left = positive_integer(row["left"]) || 0
        top = positive_integer(row["top"]) || 0
        width = positive_integer(row["width"]) || 0
        height = positive_integer(row["height"]) || 0

        {
          text: text,
          left: left,
          top: top,
          width: width,
          height: height,
          x1: left.to_f / page_width,
          y1: top.to_f / page_height,
          x2: (left + width).to_f / page_width,
          y2: (top + height).to_f / page_height,
          center_x: (left + (width / 2.0)) / page_width,
          center_y: (top + (height / 2.0)) / page_height,
          confidence: confidence
        }
      end
    end

    def group_words_by_region(words)
      region_words = Hash.new { |hash, key| hash[key] = [] }
      region_words[:all] = words

      words.each do |word|
        region = best_region_for(word)

        region_words[region] << word if region
      end

      (REGIONS.keys + [:all]).index_with do |region|
        words_to_text(region_words[region])
      end
    end

    def best_region_for(word)
      scored_regions = REGIONS.filter_map do |region, bounds|
        score = overlap_score(word, bounds)
        [region, score] if score >= MIN_REGION_OVERLAP
      end

      return scored_regions.max_by(&:last)&.first if scored_regions.present?

      fallback_region_for(word)
    end

    def overlap_score(word, bounds)
      min_x, min_y, max_x, max_y = bounds
      overlap_width = [word[:x2], max_x].min - [word[:x1], min_x].max
      overlap_height = [word[:y2], max_y].min - [word[:y1], min_y].max
      return 0 if overlap_width <= 0 || overlap_height <= 0

      word_area = (word[:x2] - word[:x1]) * (word[:y2] - word[:y1])
      return 0 if word_area <= 0

      (overlap_width * overlap_height) / word_area
    end

    def fallback_region_for(word)
      return :flavors if word[:center_y].between?(0.56, 0.75)
      return :specs if word[:center_y] >= 0.68

      nil
    end

    def words_to_text(words)
      return nil if words.blank?

      lines = words
        .sort_by { |word| [word[:top], word[:left]] }
        .chunk_while { |current, next_word| same_line?(current, next_word) }
        .map do |line_words|
          line_words
            .sort_by { |word| word[:left] }
            .map { |word| word[:text] }
            .join(" ")
            .squish
        end

      lines.join("\n").presence
    end

    def same_line?(current, next_word)
      current_midpoint = current[:top] + (current[:height] / 2.0)
      next_midpoint = next_word[:top] + (next_word[:height] / 2.0)
      tolerance = [current[:height], next_word[:height], 12].max

      (current_midpoint - next_midpoint).abs <= tolerance
    end

    def raw_text(region_texts)
      (REGIONS.keys + [:description_ja, :all, :all_ja]).filter_map do |region|
        text = region_texts[region]
        next if text.blank?

        "[#{region}]\n#{text}"
      end.join("\n\n")
    end

    def positive_integer(value)
      integer = value.to_i
      integer.positive? ? integer : nil
    end
  end
end
