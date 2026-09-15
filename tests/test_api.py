"""Tests for the /api/weather endpoint.

All Open-Meteo network calls are mocked so the suite runs without live network access,
per specs/001-weather-lookup/spec.md (FR-002 through FR-005) and plan.md Phase 1.
"""
from unittest.mock import patch

import pytest

import app as app_module


@pytest.fixture
def client():
    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as client:
        yield client


GEOCODE_RESPONSE = {
    "results": [
        {
            "name": "Pune",
            "country": "India",
            "latitude": 18.52,
            "longitude": 73.86,
        }
    ]
}

FORECAST_RESPONSE = {
    "current": {
        "temperature_2m": 24.5,
        "wind_speed_10m": 8.1,
        "weather_code": 2,
    }
}


class FakeResponse:
    def __init__(self, json_data, status_code=200):
        self._json_data = json_data
        self.status_code = status_code

    def json(self):
        return self._json_data

    def raise_for_status(self):
        if self.status_code >= 400:
            raise app_module.requests.HTTPError(f"HTTP {self.status_code}")


def test_known_city_returns_200_with_weather(client):
    with patch("app.requests.get") as mock_get:
        mock_get.side_effect = [
            FakeResponse(GEOCODE_RESPONSE),
            FakeResponse(FORECAST_RESPONSE),
        ]
        response = client.get("/api/weather?city=Pune")

    assert response.status_code == 200
    data = response.get_json()
    assert data["location"]["name"] == "Pune"
    assert data["location"]["country"] == "India"
    assert data["location"]["latitude"] == 18.52
    assert data["location"]["longitude"] == 73.86
    assert data["current"]["temperature"] == 24.5
    assert data["current"]["wind_speed"] == 8.1
    assert data["current"]["weather_code"] == 2


def test_unknown_city_returns_404(client):
    with patch("app.requests.get") as mock_get:
        mock_get.side_effect = [FakeResponse({"results": []})]
        response = client.get("/api/weather?city=Nonexistentville")

    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data
    # Only the geocoding call should happen; forecast must not be requested.
    assert mock_get.call_count == 1


def test_missing_city_returns_400_without_provider_call(client):
    with patch("app.requests.get") as mock_get:
        response = client.get("/api/weather")

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    mock_get.assert_not_called()


def test_empty_city_returns_400_without_provider_call(client):
    with patch("app.requests.get") as mock_get:
        response = client.get("/api/weather?city=")

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    mock_get.assert_not_called()


def test_provider_failure_returns_safe_5xx(client):
    with patch("app.requests.get") as mock_get:
        mock_get.side_effect = app_module.requests.RequestException("boom")
        response = client.get("/api/weather?city=Pune")

    assert response.status_code == 502
    data = response.get_json()
    assert "error" in data
    assert "boom" not in data["error"]


def test_index_page_serves_html(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"<html" in response.data.lower()
