require "fileutils"
require "securerandom"

class Api::VoiceMemosController < ApplicationController
  ALLOWED_AUDIO_CONTENT_TYPES = %w[
    audio/webm
    audio/mp4
    audio/mpeg
    audio/wav
    audio/x-wav
  ].freeze
  ALLOWED_AUDIO_EXTENSIONS = %w[.webm .m4a .mp4 .mp3 .wav].freeze
  MAX_AUDIO_SIZE = 50.megabytes

  before_action :set_voice_memo, only: [:update, :destroy]

  def index
    voice_memos = VoiceMemo.order(updated_at: :desc)
    render json: voice_memos.map(&:as_json_for_api)
  end

  def create
    audio = params[:audio]

    unless audio.respond_to?(:original_filename) && audio.respond_to?(:read)
      render json: { errors: ["audio is required"] }, status: :unprocessable_entity
      return
    end

    validation_errors = uploaded_audio_errors(audio)
    if validation_errors.present?
      render json: { errors: validation_errors }, status: :unprocessable_entity
      return
    end

    saved_audio = save_uploaded_audio(audio)
    voice_memo = VoiceMemo.find_or_initialize_by(client_uuid: params[:client_uuid])
    voice_memo.assign_attributes(voice_memo_params.merge(audio_url: saved_audio[:url]))

    if voice_memo.save
      render json: voice_memo.as_json_for_api, status: :created
    else
      render json: { errors: voice_memo.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @voice_memo.update(voice_memo_update_params)
      render json: @voice_memo.as_json_for_api
    else
      render json: { errors: @voice_memo.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @voice_memo.destroy
    head :no_content
  end

  private

  def set_voice_memo
    @voice_memo = VoiceMemo.find(params[:id])
  end

  def voice_memo_params
    {
      client_uuid: params[:client_uuid],
      title: params[:title],
      memo: params[:memo],
      tags: parse_tags(params[:tags]),
      mime_type: params[:mime_type],
      duration_ms: params[:duration_ms],
      transcript: params[:transcript]
    }
  end

  def voice_memo_update_params
    params.require(:voice_memo).permit(:title, :memo, :duration_ms, :transcript, tags: [])
  end

  def parse_tags(value)
    return [] if value.blank?
    return value if value.is_a?(Array)

    JSON.parse(value)
  rescue JSON::ParserError
    value.to_s.split(",")
  end

  def save_uploaded_audio(audio)
    upload_dir = Rails.root.join("public", "uploads", "voice_memos")
    FileUtils.mkdir_p(upload_dir)

    extension = File.extname(audio.original_filename.to_s).downcase
    extension = extension_for_content_type(audio.content_type) if extension.blank?
    filename = "#{SecureRandom.uuid}#{extension}"
    path = upload_dir.join(filename)

    File.binwrite(path, audio.read)

    {
      path: path.to_s,
      url: "/uploads/voice_memos/#{filename}"
    }
  end

  def uploaded_audio_errors(audio)
    errors = []
    extension = File.extname(audio.original_filename.to_s).downcase
    content_type = audio.content_type.to_s.split(";").first

    unless ALLOWED_AUDIO_EXTENSIONS.include?(extension) && ALLOWED_AUDIO_CONTENT_TYPES.include?(content_type)
      errors << "audio must be a WebM, M4A, MP3, or WAV file"
    end

    if audio.respond_to?(:size) && audio.size.to_i > MAX_AUDIO_SIZE
      errors << "audio must be 50MB or smaller"
    end

    errors
  end

  def extension_for_content_type(content_type)
    case content_type
    when "audio/mp4" then ".m4a"
    when "audio/mpeg" then ".mp3"
    when "audio/wav", "audio/x-wav" then ".wav"
    else ".webm"
    end
  end
end
