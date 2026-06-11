class AddUserOwnershipToPrivateResources < ActiveRecord::Migration[8.1]
  TABLES = %i[events coffee_beans].freeze

  def up
    TABLES.each do |table|
      add_reference table, :user, foreign_key: true, index: true
    end

    owner_id = select_value("SELECT id FROM users ORDER BY id ASC LIMIT 1")
    if owner_id.present?
      TABLES.each do |table|
        execute("UPDATE #{table} SET user_id = #{owner_id.to_i} WHERE user_id IS NULL")
      end
    end

    TABLES.each do |table|
      orphan_count = select_value("SELECT COUNT(*) FROM #{table} WHERE user_id IS NULL").to_i
      if orphan_count.positive?
        raise ActiveRecord::IrreversibleMigration,
          "Cannot add required user ownership to #{table}: #{orphan_count} existing rows have no user to assign."
      end

      change_column_null table, :user_id, false
    end
  end

  def down
    TABLES.each do |table|
      remove_reference table, :user, foreign_key: true, index: true
    end
  end
end
