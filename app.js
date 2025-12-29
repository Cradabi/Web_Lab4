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

// Будет реализовано в следующих коммитах.
// Open-Meteo API позволяет получать прогноз по координатам без API-ключа [web:21].
async function fetchWeatherByCoordinates(lat, lon) {
  void lat;
  void lon;
  throw new Error("fetchWeatherByCoordinates: пока не реализовано");
}

// ===================== Рендер карточек ==========================

// Будет реализовано в следующих коммитах.
function renderLocationCard(location, container) {
  void location;
  void container;
  throw new Error("renderLocationCard: пока не реализовано");
}

// ===================== Управление состоянием ====================

let appState = {
  locations: [] // { id, isCurrent, lat, lon, cityName, country, displayName }
};

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

// Будет реализовано в следующих коммитах.
// Geolocation будет вызываться через navigator.geolocation.getCurrentPosition [web:32].
function requestInitialGeolocation() {
  throw new Error("requestInitialGeolocation: пока не реализовано");
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

  geoModalClose.addEventListener("click", () => {
    const modal = document.getElementById("geoModal");
    modal.classList.add("hidden");
  });

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
    // Пока геолокацию не запрашиваем — добавим позже.
  }
});
