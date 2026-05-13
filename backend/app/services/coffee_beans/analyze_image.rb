module CoffeeBeans
  class AnalyzeImage
    def self.call(image_path:)
      new(image_path: image_path).call
    end

    def initialize(image_path:)
      @image_path = image_path
    end

    def call
      raw_text = ocr_raw_text
      extraction_data = {
        brand: nil,
        code: nil,
        roast_level: nil,
        name: nil,
        country: nil,
        name_ja: nil,
        description_ja: nil,
        flavor_notes: [],
        region: nil,
        process: nil,
        variety: nil,
        elevation: nil,
        farmer: nil,
        farm: nil,
        is_limited: false,
        raw_text: raw_text,
        status: "draft"
      }

      extraction_data.merge(parsed_fields(raw_text))
    end

    private

    attr_reader :image_path

    def ocr_raw_text
      text = CoffeeBeans::Ocr::TesseractClient.call(image_path: image_path)
      return nil if text.to_s.strip.empty?

      text
    rescue CoffeeBeans::Ocr::TesseractClient::Error => e
      Rails.logger.warn("Tesseract OCR failed: #{e.class}: #{e.message}")
      nil
    end

    def parsed_fields(raw_text)
      return {} if raw_text.blank?

      CoffeeBeans::PostCoffeeTextParser.call(raw_text: raw_text).compact
    end
  end
end
