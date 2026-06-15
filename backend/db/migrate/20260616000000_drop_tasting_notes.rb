class DropTastingNotes < ActiveRecord::Migration[8.1]
  def change
    drop_table :tasting_notes do |t|
      t.references :coffee_bean, null: false, foreign_key: true
      t.integer :rating
      t.integer :acidity
      t.integer :bitterness
      t.integer :sweetness
      t.integer :aroma
      t.integer :body
      t.string :brew_method
      t.string :grind_size
      t.integer :water_temp
      t.decimal :coffee_grams, precision: 6, scale: 2
      t.decimal :water_grams, precision: 7, scale: 2
      t.integer :brew_time
      t.text :memo

      t.timestamps
    end
  end
end
