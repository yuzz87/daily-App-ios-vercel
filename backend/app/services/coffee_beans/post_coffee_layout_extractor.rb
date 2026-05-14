require "csv"

module CoffeeBeans
  class PostCoffeeLayoutExtractor
    REGIONS = {
      code: [0.00, 0.00, 0.35, 0.16],
      brand: [0.30, 0.00, 0.70, 0.16],
      roast_level: [0.62, 0.00, 1.00, 0.18],
      name: [0.05, 0.14, 0.95, 0.32],
      country: [0.05, 0.28, 0.95, 0.48],
      description: [0.05, 0.45, 0.95, 0.62],
      flavors: [0.05, 0.58, 0.95, 0.72],
      specs: [0.05, 0.68, 0.95, 1.00]
    }.freeze

    OCR_OPTIONS = ["--psm", "6"].freeze

    def self.call(image_path:)
      new(image_path: image_path).call
    end

    def initialize(image_path:)
      @image_path = image_path
    end

    def call
      tsv = tesseract_tsv
      words = parse_words(tsv)

      if words.empty?
        text = tsv.to_s.strip.empty? ? nil : tsv.to_s
        return {
          region_texts: text ? { all: text } : {},
          raw_text: text
        }
      end

      region_texts = group_words_by_region(words)

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

    def tesseract_tsv
      Ocr::TesseractClient.call(
        image_path: image_path,
        lang: "eng",
        options: OCR_OPTIONS,
        output_format: "tsv"
      )
    rescue ArgumentError => e
      raise unless e.message.include?("unknown keyword")

      Ocr::TesseractClient.call(image_path: image_path)
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
          center_x: (left + (width / 2.0)) / page_width,
          center_y: (top + (height / 2.0)) / page_height
        }
      end
    end

    def group_words_by_region(words)
      region_words = Hash.new { |hash, key| hash[key] = [] }
      region_words[:all] = words

      words.each do |word|
        region = REGIONS.find do |_name, bounds|
          inside_region?(word, bounds)
        end

        region_words[region.first] << word if region
      end

      (REGIONS.keys + [:all]).index_with do |region|
        words_to_text(region_words[region])
      end
    end

    def inside_region?(word, bounds)
      min_x, min_y, max_x, max_y = bounds

      word[:center_x].between?(min_x, max_x) &&
        word[:center_y].between?(min_y, max_y)
    end

    def words_to_text(words)
      words
        .sort_by { |word| [word[:top], word[:left]] }
        .map { |word| word[:text] }
        .join(" ")
        .squish
        .presence
    end

    def raw_text(region_texts)
      region_texts.filter_map do |region, text|
        next if text.blank?

        "#{region}: #{text}"
      end.join("\n")
    end

    def positive_integer(value)
      integer = value.to_i
      integer.positive? ? integer : nil
    end
  end
end
