// Weather Lookup client: submits the search form, calls /api/weather, and
// renders loading, success, and error states without a page reload.
(function () {
  "use strict";

  const form = document.getElementById("weather-form");
  const cityInput = document.getElementById("city");

  const idleState = document.getElementById("idle-state");
  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const successState = document.getElementById("success-state");

  const resultLocation = document.getElementById("result-location");
  const resultTemperature = document.getElementById("result-temperature");
  const resultWind = document.getElementById("result-wind");

  function showState(state) {
    idleState.hidden = state !== "idle";
    loadingState.hidden = state !== "loading";
    errorState.hidden = state !== "error";
    successState.hidden = state !== "success";
  }

  function showError(message) {
    errorState.textContent = message;
    showState("error");
  }

  async function searchWeather(city) {
    showState("loading");
    try {
      const response = await fetch(
        "/api/weather?city=" + encodeURIComponent(city)
      );
      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "Something went wrong. Please try again.");
        return;
      }

      resultLocation.textContent =
        data.location.name + ", " + data.location.country;
      resultTemperature.textContent = data.current.temperature;
      resultWind.textContent = data.current.wind_speed;
      showState("success");
    } catch (err) {
      showError("Unable to reach the weather service. Please try again.");
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const city = cityInput.value.trim();
    if (!city) {
      showError("Please enter a city name.");
      return;
    }
    searchWeather(city);
  });
})();
