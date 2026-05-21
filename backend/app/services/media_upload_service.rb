require "fileutils"
require "securerandom"

class MediaUploadService
  ValidationOptions = Struct.new(
    :allowed_extensions,
    :allowed_content_types,
    :max_size,
    :invalid_type_message,
    :oversize_message,
    keyword_init: true
  )

  def self.validate(file, options:)
    errors = []
    extension = File.extname(file.original_filename.to_s).downcase
    content_type = file.content_type.to_s.split(";").first

    unless options.allowed_extensions.include?(extension) &&
           options.allowed_content_types.include?(content_type)
      errors << options.invalid_type_message
    end

    if file.respond_to?(:size) && file.size.to_i > options.max_size
      errors << options.oversize_message
    end

    errors
  end

  def self.save(file, directory:, fallback_extension: nil)
    FileUtils.mkdir_p(directory)

    extension = File.extname(file.original_filename.to_s).downcase
    extension = fallback_extension if extension.blank? && fallback_extension

    filename = "#{SecureRandom.uuid}#{extension}"
    path = directory.join(filename)
    File.binwrite(path, file.read)

    { path: path.to_s, filename: filename, extension: extension }
  end
end
