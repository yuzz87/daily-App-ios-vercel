class VoiceMemo < ApplicationRecord
  validates :client_uuid, presence: true, uniqueness: true
  validates :title, presence: true
  validates :audio_url, presence: true
  validates :mime_type, presence: true

  before_validation :normalize_tags

  def as_json_for_api
    {
      id: id,
      client_uuid: client_uuid,
      title: title,
      memo: memo,
      tags: tags,
      audio_url: audio_url,
      mime_type: mime_type,
      duration_ms: duration_ms,
      transcript: transcript,
      created_at: created_at&.iso8601,
      updated_at: updated_at&.iso8601
    }
  end

  private

  def normalize_tags
    self.tags = Array(tags).map(&:to_s).map(&:strip).reject(&:blank?).uniq
  end
end
