/* ─── API LAYER ─── */
const API = (() => {
  const BASE = '/api';

  function getToken() {
    return localStorage.getItem('simtrack_token');
  }

  function headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    };
  }

  async function request(method, path, body) {
    const opts = { method, headers: headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    if (res.status === 401) {
      localStorage.clear();
      window.location.href = '/login.html';
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Bir hata oluştu.');
    return data;
  }

  return {
    get:    (path)         => request('GET',    path),
    post:   (path, body)   => request('POST',   path, body),
    put:    (path, body)   => request('PUT',    path, body),
    delete: (path)         => request('DELETE', path),

    // Auth
    login:  (u, p)   => fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) }),
    me:     ()       => request('GET', '/auth/me'),

    // M2M
    getM2M:     (q)  => request('GET',    `/m2m${q || ''}`),
    addM2M:     (d)  => request('POST',   '/m2m',   d),
    updateM2M:  (id, d) => request('PUT', `/m2m/${id}`, d),
    deleteM2M:  (id) => request('DELETE', `/m2m/${id}`),

    // Data
    getData:    (q)  => request('GET',    `/data${q || ''}`),
    addData:    (d)  => request('POST',   '/data',  d),
    updateData: (id, d) => request('PUT', `/data/${id}`, d),
    deleteData: (id) => request('DELETE', `/data/${id}`),

    // Voice
    getVoice:    (q)  => request('GET',    `/voice${q || ''}`),
    addVoice:    (d)  => request('POST',   '/voice', d),
    updateVoice: (id, d) => request('PUT', `/voice/${id}`, d),
    deleteVoice: (id)  => request('DELETE', `/voice/${id}`),

    // Users
    getUsers:   ()     => request('GET',    '/users'),
    addUser:    (d)    => request('POST',   '/users', d),
    updateUser: (id,d) => request('PUT',    `/users/${id}`, d),
    deleteUser: (id)   => request('DELETE', `/users/${id}`),
    changeMyPassword: (d) => request('PUT', '/users/me/password', d),

    // Operators
    getOperators:  ()    => request('GET',    '/operators'),
    addOperator:   (d)   => request('POST',   '/operators', d),
    deleteOperator:(id)  => request('DELETE', `/operators/${id}`),

    // Reports
    getSummary:     () => request('GET', '/reports/summary'),
    getReportM2M:   () => request('GET', '/reports/m2m'),
    getReportData:  () => request('GET', '/reports/data'),
    getReportVoice: () => request('GET', '/reports/voice'),

    // Import — Excel template download
    downloadTemplate: (type) => {
      const a = document.createElement('a');
      a.href = `/api/import/template/${type}`;
      a.click();
    },

    // Import — Excel upload
    importExcel: async (type, file) => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/import/excel/${type}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: fd
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Yükleme başarısız.');
      return data;
    },

    // Import — JSON bulk insert
    importJSON: (type, rows) => request('POST', `/import/json/${type}`, { rows }),

    // Vehicles (Araçlar)
    getVehicles:   (q)    => request('GET',    `/vehicles${q||''}`),
    addVehicle:    (d)    => request('POST',   '/vehicles', d),
    updateVehicle: (id,d) => request('PUT',    `/vehicles/${id}`, d),
    deleteVehicle: (id)   => request('DELETE', `/vehicles/${id}`),

    // Locations (Lokasyonlar)
    getLocations:   (q)    => request('GET',    `/locations${q||''}`),
    addLocation:    (d)    => request('POST',   '/locations', d),
    updateLocation: (id,d) => request('PUT',    `/locations/${id}`, d),
    deleteLocation: (id)   => request('DELETE', `/locations/${id}`),

    // Personnel (Personeller)
    getPersonnel:   (q)    => request('GET',    `/personnel${q||''}`),
    addPersonnel:   (d)    => request('POST',   '/personnel', d),
    updatePersonnel:(id,d) => request('PUT',    `/personnel/${id}`, d),
    deletePersonnel:(id)   => request('DELETE', `/personnel/${id}`),
  };
})();
