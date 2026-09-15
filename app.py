"""Weather Lookup application.

Serves a browser page at GET / and a JSON API at GET /api/weather?city=<name>.
Weather data is provided by Open-Meteo (https://open-meteo.com/), used under CC-BY 4.0.
See specs/001-weather-lookup/spec.md for the full specification.
"""
import logging

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
logger = logging.getLogger(__name__)

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
PROVIDER_TIMEOUT_SECONDS = 5


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/weather")
def weather():
    city = request.args.get("city", "").strip()
    if not city:
        return jsonify({"error": "A city name is required"}), 400

    try:
        geocode_response = requests.get(
            GEOCODING_URL,
            params={"name": city, "count": 1},
            timeout=PROVIDER_TIMEOUT_SECONDS,
        )
        geocode_response.raise_for_status()
        geocode_data = geocode_response.json()
    except requests.RequestException:
        logger.exception("Geocoding request failed for city=%s", city)
        return jsonify({"error": "Weather provider is currently unavailable"}), 502

    results = geocode_data.get("results") or []
    if not results:
        return jsonify({"error": "City not found"}), 404

    match = results[0]
    latitude = match.get("latitude")
    longitude = match.get("longitude")

    try:
        forecast_response = requests.get(
            FORECAST_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current": "temperature_2m,wind_speed_10m,weather_code",
            },
            timeout=PROVIDER_TIMEOUT_SECONDS,
        )
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()
    except requests.RequestException:
        logger.exception("Forecast request failed for city=%s", city)
        return jsonify({"error": "Weather provider is currently unavailable"}), 502

    current = forecast_data.get("current") or {}
    if "temperature_2m" not in current:
        logger.error("Unusable forecast response for city=%s", city)
        return jsonify({"error": "Weather provider returned an unusable response"}), 502

    return jsonify(
        {
            "location": {
                "name": match.get("name", city),
                "country": match.get("country", ""),
                "latitude": latitude,
                "longitude": longitude,
            },
            "current": {
                "temperature": current.get("temperature_2m"),
                "wind_speed": current.get("wind_speed_10m"),
                "weather_code": current.get("weather_code"),
            },
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
