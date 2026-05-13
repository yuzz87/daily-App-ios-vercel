require "test_helper"

class Api::CoffeeBeansControllerTest < ActionDispatch::IntegrationTest
  test "destroy deletes a coffee bean" do
    coffee_bean = CoffeeBean.create!(
      brand: "PostCoffee",
      flavor_notes: [],
      status: "draft"
    )

    assert_difference("CoffeeBean.count", -1) do
      delete api_coffee_bean_url(coffee_bean)
    end

    assert_response :no_content
  end
end
