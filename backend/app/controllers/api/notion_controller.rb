require "net/http"
require "json"

class Api::NotionController < ApplicationController
  def export_session
    notion_token = ENV["NOTION_TOKEN"]
    database_id  = ENV["NOTION_DATABASE_ID"]
    return render json: { error: "Notion is not configured." }, status: :service_unavailable unless notion_token && database_id

    category         = params[:category].to_s
    duration_seconds = params[:duration_seconds].to_i
    recorded_at      = params[:recorded_at].to_s
    memo             = params[:memo]

    label = format_duration(duration_seconds)
    payload = {
      parent: { database_id: database_id },
      properties: {
        title:                    { title:     [{ text: { content: "#{category} · #{label}" } }] },
        Type:                     { select:    { name: "session" } },
        Category:                 { select:    { name: category } },
        Duration:                 { number:    duration_seconds },
        "Duration (formatted)" => { rich_text: [{ text: { content: label } }] },
        "Recorded At"          => { date:      { start: recorded_at } },
        "Exported At"          => { date:      { start: Time.current.iso8601 } }
      }
    }
    payload[:properties]["Memo"] = { rich_text: [{ text: { content: memo } }] } if memo.present?

    call_notion_api(payload, notion_token)
  end

  def export_stats
    notion_token = ENV["NOTION_TOKEN"]
    database_id  = ENV["NOTION_DATABASE_ID"]
    return render json: { error: "Notion is not configured." }, status: :service_unavailable unless notion_token && database_id

    week_range = params[:weekRange].to_s
    payload = {
      parent: { database_id: database_id },
      properties: {
        title:                    { title:  [{ text: { content: "Stats Snapshot · #{week_range}" } }] },
        Type:                     { select: { name: "snapshot" } },
        "Weekly Average"       => { number: params[:weeklyAverageSeconds].to_i },
        "Monthly Average"      => { number: params[:monthlyAverageSeconds].to_i },
        "Total Time"           => { number: params[:totalSeconds].to_i },
        "Today's Prediction"   => { number: params[:predictedTodaySeconds].to_i },
        "Exported At"          => { date:   { start: Time.current.iso8601 } }
      }
    }

    call_notion_api(payload, notion_token)
  end

  private

  def call_notion_api(payload, token)
    uri  = URI("https://api.notion.com/v1/pages")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = true
    http.open_timeout = 10
    http.read_timeout = 10

    req = Net::HTTP::Post.new(uri)
    req["Authorization"]  = "Bearer #{token}"
    req["Notion-Version"] = "2022-06-28"
    req["Content-Type"]   = "application/json"
    req.body = payload.to_json

    res = http.request(req)
    if res.is_a?(Net::HTTPSuccess)
      render json: { ok: true }
    else
      body = JSON.parse(res.body) rescue {}
      render json: { error: body["message"] || "Notion API error" }, status: :unprocessable_entity
    end
  rescue => e
    Rails.logger.error "[notion] #{e.message}"
    render json: { error: "Failed to connect to Notion." }, status: :internal_server_error
  end

  def format_duration(seconds)
    hours   = seconds / 3600
    minutes = (seconds % 3600) / 60
    secs    = seconds % 60
    return "#{hours}時間 #{minutes}分" if hours > 0
    return "#{minutes}分 #{secs}秒"   if minutes > 0
    "#{secs}秒"
  end
end
