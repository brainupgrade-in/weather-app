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
  const resultUnitLabel = document.getElementById("result-unit-label");
  const resultWind = document.getElementById("result-wind");
  const resultWindUnitLabel = document.getElementById("result-wind-unit-label");
  const unitCelsiusInput = document.getElementById("unit-celsius");
  const unitFahrenheitInput = document.getElementById("unit-fahrenheit");

  const UNIT_STORAGE_KEY = "weatherApp.temperatureUnit";
  const VALID_UNITS = ["C", "F"];
  const KMH_TO_MPH = 0.621371;

  // The provider always returns Celsius and km/h; keep the raw values around
  // so the display can be re-converted whenever the unit toggle changes.
  let currentCelsius = null;
  let currentKmh = null;

  function celsiusToFahrenheit(celsius) {
    return (celsius * 9) / 5 + 32;
  }

  function kmhToMph(kmh) {
    return kmh * KMH_TO_MPH;
  }

  function readStoredUnit() {
    let stored;
    try {
      stored = window.sessionStorage.getItem(UNIT_STORAGE_KEY);
    } catch (err) {
      return "C";
    }
    return VALID_UNITS.includes(stored) ? stored : "C";
  }

  function storeUnit(unit) {
    try {
      window.sessionStorage.setItem(UNIT_STORAGE_KEY, unit);
    } catch (err) {
      // Ignore storage failures (e.g. disabled storage); the in-memory
      // selection still works for the rest of the page's lifetime.
    }
  }

  function renderTemperature(unit) {
    if (currentCelsius === null) {
      return;
    }
    const displayValue =
      unit === "F" ? celsiusToFahrenheit(currentCelsius) : currentCelsius;
    resultTemperature.textContent = Math.round(displayValue * 10) / 10;
    resultUnitLabel.textContent = unit;
  }

  function renderWindSpeed(unit) {
    if (currentKmh === null) {
      return;
    }
    const displayValue = unit === "F" ? kmhToMph(currentKmh) : currentKmh;
    resultWind.textContent = Math.round(displayValue * 10) / 10;
    resultWindUnitLabel.textContent = unit === "F" ? "mph" : "km/h";
  }

  function setUnit(unit, options) {
    const opts = options || {};
    const nextUnit = VALID_UNITS.includes(unit) ? unit : "C";
    unitCelsiusInput.checked = nextUnit === "C";
    unitFahrenheitInput.checked = nextUnit === "F";
    if (!opts.skipPersist) {
      storeUnit(nextUnit);
    }
    renderTemperature(nextUnit);
    renderWindSpeed(nextUnit);
  }

  function getSelectedUnit() {
    return unitFahrenheitInput.checked ? "F" : "C";
  }

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
      currentCelsius = data.current.temperature;
      currentKmh = data.current.wind_speed;
      renderTemperature(getSelectedUnit());
      renderWindSpeed(getSelectedUnit());
      showState("success");
    } catch (err) {
      showError("Unable to reach the weather service. Please try again.");
    }
  }

  unitCelsiusInput.addEventListener("change", function () {
    if (unitCelsiusInput.checked) {
      setUnit("C");
    }
  });

  unitFahrenheitInput.addEventListener("change", function () {
    if (unitFahrenheitInput.checked) {
      setUnit("F");
    }
  });

  setUnit(readStoredUnit(), { skipPersist: true });

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
