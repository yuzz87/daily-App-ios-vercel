class AddTranscriptToVoiceMemos < ActiveRecord::Migration[8.1]
  def change
    add_column :voice_memos, :transcript, :text
  end
end
