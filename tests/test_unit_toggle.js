// Tests for the Celsius/Fahrenheit unit toggle in static/app.js.
//
// A minimal DOM/sessionStorage shim is used instead of a browser or jsdom
// (not available offline) so the suite can run with only Node's built-in
// `node:test` runner. Covers specs/002-temperature-unit-toggle/spec.md
// acceptance criteria: default unit, conversion, persistence, and that
// switching units issues no additional network request.
"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const APP_JS_PATH = path.join(__dirname, "..", "static", "app.js");

function makeElement(id, overrides) {
  return Object.assign(
    {
      id: id,
      hidden: false,
      textContent: "",
      checked: false,
      _listeners: {},
      addEventListener: function (type, handler) {
        this._listeners[type] = this._listeners[type] || [];
        this._listeners[type].push(handler);
      },
      dispatch: function (type) {
        (this._listeners[type] || []).forEach(function (handler) {
          handler();
        });
      },
    },
    overrides || {}
  );
}

function makeSessionStorage(initial) {
  const store = Object.assign({}, initial || {});
  return {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null;
    },
    setItem: function (key, value) {
      store[key] = String(value);
    },
    _store: store,
  };
}

function loadApp(elements, sessionStorage, fetchImpl) {
  const elementsById = elements;
  const sandbox = {
    document: {
      getElementById: function (id) {
        return elementsById[id] || null;
      },
    },
    window: {
      sessionStorage: sessionStorage,
    },
    fetch: fetchImpl || function () {
      throw new Error("fetch should not be called in this test");
    },
    console: console,
  };
  vm.createContext(sandbox);
  const code = fs.readFileSync(APP_JS_PATH, "utf8");
  vm.runInContext(code, sandbox, { filename: "app.js" });
  return sandbox;
}

function baseElements() {
  return {
    "weather-form": makeElement("weather-form"),
    city: makeElement("city", { value: "Pune" }),
    "idle-state": makeElement("idle-state"),
    "loading-state": makeElement("loading-state", { hidden: true }),
    "error-state": makeElement("error-state", { hidden: true }),
    "success-state": makeElement("success-state", { hidden: true }),
    "result-location": makeElement("result-location"),
    "result-temperature": makeElement("result-temperature"),
    "result-unit-label": makeElement("result-unit-label"),
    "result-wind": makeElement("result-wind"),
    "unit-celsius": makeElement("unit-celsius", { checked: true }),
    "unit-fahrenheit": makeElement("unit-fahrenheit", { checked: false }),
  };
}

test("fresh page defaults to Celsius when no session value exists", function () {
  const elements = baseElements();
  loadApp(elements, makeSessionStorage());

  assert.equal(elements["unit-celsius"].checked, true);
  assert.equal(elements["unit-fahrenheit"].checked, false);
});

test("invalid stored unit falls back to Celsius", function () {
  const elements = baseElements();
  loadApp(elements, makeSessionStorage({ "weatherApp.temperatureUnit": "K" }));

  assert.equal(elements["unit-celsius"].checked, true);
  assert.equal(elements["unit-fahrenheit"].checked, false);
});

test("missing session value falls back to Celsius", function () {
  const elements = baseElements();
  const sessionStorage = makeSessionStorage();
  loadApp(elements, sessionStorage);

  assert.equal(sessionStorage.getItem("weatherApp.temperatureUnit"), null);
  assert.equal(elements["unit-celsius"].checked, true);
});

test("valid stored Fahrenheit preference is restored on load", function () {
  const elements = baseElements();
  loadApp(elements, makeSessionStorage({ "weatherApp.temperatureUnit": "F" }));

  assert.equal(elements["unit-fahrenheit"].checked, true);
  assert.equal(elements["unit-celsius"].checked, false);
});

test("selecting Fahrenheit converts the displayed Celsius temperature", async function () {
  const elements = baseElements();
  let fetchCalls = 0;
  const fetchImpl = function () {
    fetchCalls += 1;
    return Promise.resolve({
      ok: true,
      json: function () {
        return Promise.resolve({
          location: { name: "Pune", country: "India" },
          current: { temperature: 24.5, wind_speed: 8.1 },
        });
      },
    });
  };
  const sandbox = loadApp(elements, makeSessionStorage(), fetchImpl);

  // Invoke the submit handler directly since this shim does not implement
  // a full DOM event dispatch; addEventListener still records the handler.
  await elements["weather-form"]._listeners.submit[0]({ preventDefault: function () {} });
  // Allow the async searchWeather promise chain to settle.
  await new Promise(function (resolve) {
    setImmediate(resolve);
  });

  assert.equal(fetchCalls, 1);
  assert.equal(elements["result-temperature"].textContent, 24.5);

  elements["unit-fahrenheit"].checked = true;
  elements["unit-fahrenheit"].dispatch("change");

  assert.equal(fetchCalls, 1, "switching units must not call fetch again");
  assert.equal(elements["result-temperature"].textContent, 76.1);
  assert.equal(elements["result-unit-label"].textContent, "F");

  elements["unit-celsius"].checked = true;
  elements["unit-celsius"].dispatch("change");

  assert.equal(fetchCalls, 1);
  assert.equal(elements["result-temperature"].textContent, 24.5);
  assert.equal(elements["result-unit-label"].textContent, "C");
  void sandbox;
});

test("selected unit is persisted to sessionStorage when changed", function () {
  const elements = baseElements();
  const sessionStorage = makeSessionStorage();
  loadApp(elements, sessionStorage);

  elements["unit-fahrenheit"].checked = true;
  elements["unit-fahrenheit"].dispatch("change");

  assert.equal(sessionStorage.getItem("weatherApp.temperatureUnit"), "F");
});
