const fs = require('fs');
const path = require('path');

function getHaversineKm(lat1, lon1, lat2, lon2) {
  const r = 6371.0;
  const p1 = (lat1 * Math.PI) / 180.0;
  const p2 = (lat2 * Math.PI) / 180.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a = Math.sin(dLat / 2.0) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2.0) ** 2;
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  return Math.round(r * c * 100) / 100;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'dairies.json');
    let dairies = [];
    if (fs.existsSync(filePath)) {
      dairies = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname.includes('/nearest')) {
      const lat = parseFloat(url.searchParams.get('lat'));
      const lng = parseFloat(url.searchParams.get('lng'));
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'MISSING_COORDINATES', message: 'lat and lng query parameters are required' });
      }
      const list = dairies.map(d => ({
        ...d,
        distance_km: getHaversineKm(lat, lng, parseFloat(d.latitude), parseFloat(d.longitude))
      })).sort((a, b) => a.distance_km - b.distance_km);
      return res.status(200).json(list);
    }

    if (pathname.includes('/search')) {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const district = (url.searchParams.get('district') || '').toLowerCase();
      const type = (url.searchParams.get('type') || '').toLowerCase();
      let filtered = dairies;
      if (q) {
        filtered = filtered.filter(d => (d.name && d.name.toLowerCase().includes(q)) || (d.city && d.city.toLowerCase().includes(q)));
      }
      if (district) {
        filtered = filtered.filter(d => d.district && d.district.toLowerCase() === district);
      }
      if (type) {
        filtered = filtered.filter(d => d.facility_type && d.facility_type.toLowerCase() === type);
      }
      return res.status(200).json(filtered);
    }

    return res.status(200).json(dairies);
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
};
