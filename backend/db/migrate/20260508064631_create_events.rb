class CreateEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :events do |t|
      t.string :title, null: false
      t.text :description
      t.datetime :start_at, null: false
      t.datetime :end_at, null: false
      t.boolean :all_day, null: false, default: false
      t.string :color, null: false, default: "#3b82f6"

      t.timestamps
    end
    add_index :events, :start_at
  end
end
