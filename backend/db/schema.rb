# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_05_14_000100) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_timers", force: :cascade do |t|
    t.string "category", default: "Programming", null: false
    t.datetime "created_at", null: false
    t.integer "elapsed_seconds", default: 0, null: false
    t.boolean "is_running", default: false, null: false
    t.jsonb "laps", default: [], null: false
    t.datetime "started_at"
    t.datetime "updated_at", null: false
  end

  create_table "coffee_beans", force: :cascade do |t|
    t.string "brand"
    t.string "code"
    t.string "country"
    t.datetime "created_at", null: false
    t.text "description_ja"
    t.string "elevation"
    t.string "farm"
    t.string "farmer"
    t.jsonb "flavor_notes", default: [], null: false
    t.string "image_url"
    t.boolean "is_limited"
    t.string "name"
    t.string "name_ja"
    t.string "process"
    t.text "raw_text"
    t.string "region"
    t.string "roast_level"
    t.string "status", default: "draft", null: false
    t.datetime "updated_at", null: false
    t.string "variety"
    t.index ["code"], name: "index_coffee_beans_on_code"
    t.index ["flavor_notes"], name: "index_coffee_beans_on_flavor_notes", using: :gin
    t.index ["status"], name: "index_coffee_beans_on_status"
  end

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

  create_table "study_sessions", force: :cascade do |t|
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.integer "duration_seconds", null: false
    t.text "memo"
    t.datetime "recorded_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_study_sessions_on_category"
    t.index ["recorded_at"], name: "index_study_sessions_on_recorded_at"
  end

  create_table "tasting_notes", force: :cascade do |t|
    t.integer "acidity"
    t.integer "aroma"
    t.integer "bitterness"
    t.integer "body"
    t.string "brew_method"
    t.integer "brew_time"
    t.bigint "coffee_bean_id", null: false
    t.decimal "coffee_grams", precision: 6, scale: 2
    t.datetime "created_at", null: false
    t.string "grind_size"
    t.text "memo"
    t.integer "rating"
    t.integer "sweetness"
    t.datetime "updated_at", null: false
    t.decimal "water_grams", precision: 7, scale: 2
    t.integer "water_temp"
    t.index ["coffee_bean_id"], name: "index_tasting_notes_on_coffee_bean_id"
  end

  create_table "voice_memos", force: :cascade do |t|
    t.string "audio_url", null: false
    t.string "client_uuid", null: false
    t.datetime "created_at", null: false
    t.integer "duration_ms"
    t.text "memo"
    t.string "mime_type", null: false
    t.jsonb "tags", default: [], null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["client_uuid"], name: "index_voice_memos_on_client_uuid", unique: true
    t.index ["tags"], name: "index_voice_memos_on_tags", using: :gin
    t.index ["updated_at"], name: "index_voice_memos_on_updated_at"
  end

  add_foreign_key "tasting_notes", "coffee_beans"
end
