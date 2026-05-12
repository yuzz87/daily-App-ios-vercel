class CreateCoffeeBeans < ActiveRecord::Migration[8.1]
  def change
    create_table :coffee_beans do |t|
      t.string :image_url
      t.string :brand
      t.string :code
      t.string :roast_level
      t.string :name
      t.string :country
      t.string :name_ja
      t.text :description_ja
      t.jsonb :flavor_notes, null: false, default: []
      t.string :region
      t.string :process
      t.string :variety
      t.string :elevation
      t.string :farmer
      t.string :farm
      t.boolean :is_limited
      t.text :raw_text
      t.string :status, null: false, default: "draft"

      t.timestamps
    end

    add_index :coffee_beans, :code
    add_index :coffee_beans, :status
    add_index :coffee_beans, :flavor_notes, using: :gin
  end
end
