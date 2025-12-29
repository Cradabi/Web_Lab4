// ===================== Константы и данные =======================

// Небольшой хардкод-список городов для автодополнения и валидации.
// При желании можно заменить на внешний API городов.
const CITY_LIST = [
  { name: "Moscow", country: "Russia", lat: 55.7558, lon: 37.6176 },
  { name: "Saint Petersburg", country: "Russia", lat: 59.9311, lon: 30.3609 },
  { name: "Kazan", country: "Russia", lat: 55.7963, lon: 49.1088 },
  { name: "Sochi", country: "Russia", lat: 43.6028, lon: 39.7342 },
  { name: "Novosibirsk", country: "Russia", lat: 55.0084, lon: 82.9357 },
  { name: "London", country: "United Kingdom", lat: 51.5074, lon: -0.1278 },
  { name: "Berlin", country: "Germany", lat: 52.52, lon: 13.405 },
  { name: "Paris", country: "France", lat: 48.8566, lon: 2.3522 },
  { name: "New York", country: "USA", lat: 40.7128, lon: -74.006 },
  { name: "Tokyo", country: "Japan", lat: 35.6895, lon: 139.6917 }
];

// Ключи для localStorage
const STORAGE_KEY = "weather_app_state_v1";

// Минимальное количество дней прогноза (сегодня + 2)
const MIN_FORECAST_DAYS = 3;

// ===================== Вспомогательные функции ==================

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Не удалось сохранить состояние", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Не удалось прочитать состояние", e);
    return null;
  }
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  });
}

function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (typeof text === "string") el.textContent = text;
  return el;
}

// ===================== Работа с API погоды ======================

// Open-Meteo Forecast API (без ключа): https://open-meteo.com/en/docs [web:21]
async function fetchWeatherByCoordinates(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    current_weather: "true",
    timezone: "auto"
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Ошибка HTTP: " + response.status);
  }

  const data = await response.json();
  return normalizeWeather(data);
}

// Нормализация ответа к удобному формату
function normalizeWeather(apiData) {
  const result = {
    current: null,
    days: []
  };

  if (apiData.current_weather) {
    result.current = {
      temperature: apiData.current_weather.temperature,
      windSpeed: apiData.current_weather.windspeed,
      time: apiData.current_weather.time
    };
  }

  const daily = apiData.daily || {};
  const dates = daily.time || [];
  const tMax = daily.temperature_2m_max || [];
  const tMin = daily.temperature_2m_min || [];
  const precip = daily.precipitation_sum || [];

  for (let i = 0; i < dates.length && i < MIN_FORECAST_DAYS; i++) {
    result.days.push({
      date: dates[i],
      tMax: tMax[i],
      tMin: tMin[i],
      precipitation: precip[i]
    });
  }

  return result;
}

// ===================== Рендер карточек ==========================

function renderLocationCard(location, container) {
  const existing = container.querySelector(
    `[data-location-id="${location.id}"]`
  );
  if (existing) existing.remove();

  const card = createElement("article", "location-card");
  card.dataset.locationId = location.id;

  const header = createElement("div", "location-card__header");
  const titlesWrap = createElement("div");

  const title = createElement(
    "h3",
    "location-card__title",
    location.isCurrent ? "Текущее местоположение" : location.displayName
  );

  const subtitleText = location.isCurrent
    ? "Определено по геолокации"
    : `${location.cityName || location.displayName} • ${location.country || ""}`;

  const subtitle = createElement("p", "location-card__subtitle", subtitleText);

  titlesWrap.appendChild(title);
  titlesWrap.appendChild(subtitle);
  header.appendChild(titlesWrap);

  // Кнопка удаления только для дополнительных городов
  if (!location.isCurrent) {
    const removeBtn = createElement(
      "button",
      "location-card__remove-btn",
      "Удалить"
    );
    removeBtn.type = "button";
    removeBtn.addEventListener("click", () => {
      removeLocation(location.id);
    });
    header.appendChild(removeBtn);
  }

  const statusLine = createElement("div", "location-card__status");
  statusLine.textContent = "Загрузка данных...";

  const forecastList = createElement("ul", "forecast-list");

  card.appendChild(header);
  card.appendChild(statusLine);
  card.appendChild(forecastList);

  container.appendChild(card);

  return { card, statusLine, forecastList };
}

function updateCardWithWeather(location, weather, container) {
  const card = container.querySelector(`[data-location-id="${location.id}"]`);
  if (!card) return;

  const statusLine = card.querySelector(".location-card__status");
  const list = card.querySelector(".forecast-list");

  list.innerHTML = "";

  if (!weather || !weather.days || weather.days.length === 0) {
    statusLine.textContent = "Не удалось получить прогноз";
    return;
  }

  statusLine.textContent = weather.current
    ? `Сейчас: ${weather.current.temperature.toFixed(1)}°C, ветер ${
        weather.current.windSpeed
      } м/с`
    : "Актуальные данные недоступны";

  weather.days.forEach((day, index) => {
    const li = createElement("li", "forecast-item");

    const dayLabel =
      index === 0 ? "Сегодня" : index === 1 ? "Завтра" : formatDateShort(day.date);

    const dayEl = createElement("div", "forecast-item__day", dayLabel);
    const tempEl = createElement(
      "div",
      "forecast-item__temp",
      `${day.tMin.toFixed(1)}°C … ${day.tMax.toFixed(1)}°C`
    );
    const infoEl = createElement(
      "div",
      "forecast-item__info",
      `Осадки: ${day.precipitation.toFixed(1)} мм`
    );

    li.appendChild(dayEl);
    li.appendChild(tempEl);
    li.appendChild(infoEl);
    list.appendChild(li);
  });
}

function updateCardWithError(location, errorMessage, container) {
  const card = container.querySelector(`[data-location-id="${location.id}"]`);
  if (!card) return;

  const statusLine = card.querySelector(".location-card__status");
  const list = card.querySelector(".forecast-list");

  list.innerHTML = "";
  statusLine.textContent = errorMessage;
}

// ===================== Управление состоянием ====================

let appState = {
  locations: [] // { id, isCurrent, lat, lon, cityName, country, displayName }
};

let isInitialLoadCompleted = false;

function addLocation(location) {
  const exists = appState.locations.some((loc) => loc.id === location.id);
  if (!exists) {
    appState.locations.push(location);
    saveState(appState);
  }
}

function removeLocation(id) {
  appState.locations = appState.locations.filter((loc) => loc.id !== id);
  saveState(appState);
  const card = document.querySelector(`[data-location-id="${id}"]`);
  if (card) card.remove();
}

async function refreshAllLocations() {
  void 0;
  // Будет реализовано в следующих коммитах.
}

// ===================== Геолокация ===============================

// Geolocation API: navigator.geolocation.getCurrentPosition [web:139]
function requestInitialGeolocation() {
  if (!navigator.geolocation) {
    showGeoErrorModal();
    return;
  }

  const globalStatus = document.getElementById("globalStatus");
  globalStatus.textContent = "Запрос текущего местоположения...";
  globalStatus.classList.add("status-bar--loading");

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;

      const currentLocation = {
        id: "current-location",
        isCurrent: true,
        lat: latitude,
        lon: longitude,
        cityName: "Текущее местоположение",
        country: "",
        displayName: "Текущее местоположение"
      };

      addLocation(currentLocation);

      refreshAllLocations().finally(() => {
        globalStatus.classList.remove("status-bar--loading");
        isInitialLoadCompleted = true;
      });
    },
    (err) => {
      console.warn("Ошибка геолокации:", err);

      // Коды ошибок: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT [web:58]
      globalStatus.textContent =
        "Геолокация отключена или недоступна. Введите город вручную.";
      globalStatus.classList.remove("status-bar--loading");
      globalStatus.classList.add("status-bar--error");

      showGeoErrorModal();
      isInitialLoadCompleted = true;
    },
    {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 0
    }
  );
}

function showGeoErrorModal() {
  const modal = document.getElementById("geoModal");
  modal.classList.remove("hidden");
}

function hideGeoErrorModal() {
  const modal = document.getElementById("geoModal");
  modal.classList.add("hidden");
}

// ===================== Автодополнение и форма ===================

function setupCityAutocomplete() {
  // Будет реализовано в следующих коммитах.
}

function setupCityForm() {
  // Будет реализовано в следующих коммитах.
}

// ===================== Инициализация ============================

window.addEventListener("DOMContentLoaded", () => {
  const geoModalClose = document.getElementById("geoModalClose");
  const refreshBtn = document.getElementById("refreshBtn");

  geoModalClose.addEventListener("click", hideGeoErrorModal);

  setupCityAutocomplete();
  setupCityForm();

  refreshBtn.addEventListener("click", () => {
    const globalStatus = document.getElementById("globalStatus");
    globalStatus.textContent = "Функция обновления будет добавлена позже.";
  });

  const saved = loadState();
  if (saved && Array.isArray(saved.locations) && saved.locations.length > 0) {
    appState = saved;
  } else {
    requestInitialGeolocation();
  }
});
