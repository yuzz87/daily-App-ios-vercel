class CreateActiveTimers < ActiveRecord::Migration[8.1]
  def change
    create_table :active_timers do |t|
      t.string :category, null: false, default: "Programming"
      t.integer :elapsed_seconds, null: false, default: 0
      t.boolean :is_running, null: false, default: false
      t.datetime :started_at
      t.jsonb :laps, null: false, default: []

      t.timestamps
    end
  end
end
