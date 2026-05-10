require "test_helper"

class Api::HolidaysControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get api_holidays_index_url
    assert_response :success
  end
end
