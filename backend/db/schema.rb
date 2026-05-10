ActiveRecord::Schema[8.1].define(version: 2026_05_08_064631) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "events", force: :cascade do |t|
    t.boolean "all_day", default: false, null: false
    t.string "color"
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "end_at"
    t.datetime "start_at", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["start_at"], name: "index_events_on_start_at"
  end

  create_table "holidays", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_holidays_on_date", unique: true
  end
end
