// Geocodificación de direcciones con la Geocoding API de Google (google.maps.Geocoder).
//
// Decisión de diseño: se usa Geocoder simple (texto + geocode on-submit) en vez de
// Places Autocomplete completo. Places Autocomplete requiere manejar un input
// controlado con listeners de predicciones, un dropdown de sugerencias propio y
// sesiones de facturación (session tokens); dado que las pantallas de pedido ya
// tienen una lista de "sugerencias" propia (diseño existente, no se debía tocar),
// geocodificar el texto ingresado (o la sugerencia elegida) al confirmar es
// suficiente para resolver lat/lng reales y mantiene la UI ya construida intacta.

export function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    if (!window.google?.maps) {
      reject(new Error('Google Maps todavía no está listo. Esperá un segundo e intentá de nuevo.'))
      return
    }
    const geocoder = new window.google.maps.Geocoder()
    const query = /rosario/i.test(address) ? address : `${address}, Rosario, Santa Fe, Argentina`
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location
        resolve({
          lat: loc.lat(),
          lng: loc.lng(),
          formattedAddress: results[0].formatted_address,
        })
      } else {
        reject(new Error('No pudimos encontrar esa dirección. Probá con otra más específica.'))
      }
    })
  })
}
