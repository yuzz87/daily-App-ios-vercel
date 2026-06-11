class DropVoiceMemos < ActiveRecord::Migration[8.1]
  def up
    drop_table :voice_memos, if_exists: true
  end

  def down
    create_table :voice_memos do |t|
      t.string :client_uuid, null: false
      t.string :title, null: false
      t.text :memo
      t.jsonb :tags, null: false, default: []
      t.string :audio_url, null: false
      t.string :mime_type, null: false
      t.integer :duration_ms
      t.text :transcript
      t.references :user, null: false, foreign_key: true
      t.timestamps
    end

    add_index :voice_memos, [:user_id, :client_uuid], unique: true
    add_index :voice_memos, :updated_at
    add_index :voice_memos, :tags, using: :gin
  end
end
