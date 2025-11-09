from app import app

def test_index():
    client = app.test_client()
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert "is_english" in data
    assert "translated_content" in data
