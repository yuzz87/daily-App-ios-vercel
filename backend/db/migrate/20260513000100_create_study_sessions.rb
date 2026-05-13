class CreateStudySessions < ActiveRecord::Migration[8.1]
  def change
    create_table :study_sessions do |t|
      t.string :category, null: false
      t.integer :duration_seconds, null: false
      t.datetime :recorded_at, null: false
      t.text :memo

      t.timestamps
    end

    add_index :study_sessions, :recorded_at
    add_index :study_sessions, :category
  end
end
