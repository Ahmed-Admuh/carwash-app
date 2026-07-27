// gmaps.js — shared across all pages that show a map or an address picker.
// Wraps the Google Maps JavaScript API (Maps + Places + Geocoding) behind a
// few small helpers so every page (seller dashboard, profile, booking
// details, search) can add GPS features without repeating the setup.
//
// Requires window.APP_CONFIG.GOOGLE_MAPS_API_KEY to be set (see config.js).

const GMaps = (function () {
  const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 }; // Riyadh, Saudi Arabia
  let loadPromise = null;

  function loadGoogleMaps() {
    if (loadPromise) return loadPromise;
    loadPromise = new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
        return;
      }
      const key = window.APP_CONFIG && window.APP_CONFIG.GOOGLE_MAPS_API_KEY;
      if (!key || key === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
        reject(new Error("Google Maps API key not set — add it in frontend/js/config.js"));
        return;
      }
      window.__gmapsReady = () => resolve(window.google.maps);
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places,geometry&callback=__gmapsReady`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("Could not load Google Maps."));
      document.head.appendChild(script);
    });
    return loadPromise;
  }

  // Shows a small note instead of a map wherever the key isn't configured
  // yet, so the rest of the page still works during local development.
  function showUnavailable(container, message) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:160px;
                  background:var(--surface-alt,#f2f4f6);border-radius:var(--radius-sm,8px);
                  color:var(--text-muted,#667);font-size:0.85rem;text-align:center;padding:1rem;">
        <div><i class="fas fa-map-location-dot" style="font-size:1.4rem;display:block;margin-bottom:0.5rem;"></i>
        ${message || "Map unavailable — add a Google Maps API key in frontend/js/config.js"}</div>
      </div>`;
  }

  // A single draggable-pin picker, with an optional address search box and
  // an optional radius circle (for "region of access" sellers).
  // options: { elementId, autocompleteInputId, lat, lng, radiusKm,
  //            showRadius, onChange(lat,lng,address), onRadiusChange(km) }
  async function createPicker(options) {
    const container = document.getElementById(options.elementId);
    if (!container) return null;
    let maps;
    try {
      maps = await loadGoogleMaps();
    } catch (err) {
      showUnavailable(container, err.message);
      return null;
    }

    const center = (options.lat && options.lng) ? { lat: +options.lat, lng: +options.lng } : DEFAULT_CENTER;
    const map = new maps.Map(container, {
      center, zoom: options.lat ? 14 : 11,
      streetViewControl: false, mapTypeControl: false, fullscreenControl: false
    });

    const marker = new maps.Marker({ position: center, map, draggable: true });

    let circle = null;
    if (options.showRadius) {
      circle = new maps.Circle({
        map, center, radius: (options.radiusKm || 15) * 1000,
        strokeColor: "#0EA5A5", strokeOpacity: 0.8, strokeWeight: 2,
        fillColor: "#0EA5A5", fillOpacity: 0.12
      });
    }

    const geocoder = new maps.Geocoder();

    function reverseGeocode(pos) {
      geocoder.geocode({ location: pos }, (results, status) => {
        const address = (status === "OK" && results[0]) ? results[0].formatted_address : null;
        if (options.onChange) options.onChange(pos.lat(), pos.lng(), address);
      });
    }

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (circle) circle.setCenter(pos);
      map.panTo(pos);
      reverseGeocode(pos);
    });

    map.addListener("click", (e) => {
      marker.setPosition(e.latLng);
      if (circle) circle.setCenter(e.latLng);
      reverseGeocode(e.latLng);
    });

    // Address search box tied to a text input, if provided.
    if (options.autocompleteInputId) {
      const input = document.getElementById(options.autocompleteInputId);
      if (input) {
        const autocomplete = new maps.places.Autocomplete(input, {
          componentRestrictions: { country: "sa" },
          fields: ["geometry", "formatted_address"]
        });
        autocomplete.bindTo("bounds", map);
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry) return;
          const pos = place.geometry.location;
          map.panTo(pos);
          map.setZoom(15);
          marker.setPosition(pos);
          if (circle) circle.setCenter(pos);
          if (options.onChange) options.onChange(pos.lat(), pos.lng(), place.formatted_address);
        });
      }
    }

    return {
      map, marker, circle,
      setRadius(km) { if (circle) circle.setRadius(km * 1000); },
      setPosition(lat, lng) {
        const pos = new maps.LatLng(lat, lng);
        marker.setPosition(pos);
        if (circle) circle.setCenter(pos);
        map.panTo(pos);
      },
      useMyLocation() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
          const latLng = new maps.LatLng(pos.coords.latitude, pos.coords.longitude);
          marker.setPosition(latLng);
          if (circle) circle.setCenter(latLng);
          map.panTo(latLng);
          map.setZoom(15);
          reverseGeocode(latLng);
        });
      }
    };
  }

  // A read-only map showing one or more markers — used to show a fixed
  // wash's location on its booking page, or all nearby washes on Search.
  // items: [{ lat, lng, title, isArea, radiusKm }]
  async function createMapView(elementId, items) {
    const container = document.getElementById(elementId);
    if (!container) return null;
    let maps;
    try {
      maps = await loadGoogleMaps();
    } catch (err) {
      showUnavailable(container, err.message);
      return null;
    }

    const valid = (items || []).filter(i => i.lat != null && i.lng != null);
    const center = valid[0] ? { lat: +valid[0].lat, lng: +valid[0].lng } : DEFAULT_CENTER;
    const map = new maps.Map(container, {
      center, zoom: valid.length ? 12 : 11,
      streetViewControl: false, mapTypeControl: false, fullscreenControl: false
    });

    const bounds = new maps.LatLngBounds();
    valid.forEach(item => {
      const pos = { lat: +item.lat, lng: +item.lng };
      if (item.isArea) {
        new maps.Circle({
          map, center: pos, radius: (item.radiusKm || 15) * 1000,
          strokeColor: "#0EA5A5", strokeOpacity: 0.7, strokeWeight: 2,
          fillColor: "#0EA5A5", fillOpacity: 0.1
        });
      } else {
        new maps.Marker({ map, position: pos, title: item.title || "" });
      }
      bounds.extend(pos);
    });
    if (valid.length > 1) map.fitBounds(bounds);

    return { map };
  }

  return { loadGoogleMaps, createPicker, createMapView, showUnavailable };
})();
