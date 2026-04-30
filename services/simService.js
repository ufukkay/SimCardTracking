const db = require('../database/db');
const { logActivity } = require('../middleware/logger');
const { cleanPhone, checkDuplicatePhone, syncLocation, syncCompany, syncPersonnel } = require('./simUtils');

class SimService {
  /**
   * @param {string} simType - "M2M", "DATA", "VOICE"
   * @param {string} tableName - "sim_m2m", "sim_data", "sim_voice"
   * @param {string[]} allowedFields - Array of allowed column names for insert/update
   */
  constructor(simType, tableName, allowedFields) {
    this.simType = simType.toUpperCase();
    this.tableName = tableName;
    this.allowedFields = allowedFields;
  }

  getAll(queryParams) {
    let whereClause = `WHERE 1=1`;
    const params = [];

    if (queryParams.operator) { whereClause += ` AND ${this.tableName}.operator = ?`; params.push(queryParams.operator); }
    if (queryParams.status)   { whereClause += ` AND ${this.tableName}.status = ?`;   params.push(queryParams.status); }
    if (queryParams.location) { whereClause += ` AND ${this.tableName}.location = ?`; params.push(queryParams.location); }

    if (queryParams.search) {
      // Common fields across all tables
      whereClause += ` AND (${this.tableName}.phone_no LIKE ? OR ${this.tableName}.iccid LIKE ?`;
      const s = `%${queryParams.search}%`;
      params.push(s, s);

      // Check specific fields if they exist in allowedFields
      if (this.allowedFields.includes('assigned_to')) {
        whereClause += ` OR ${this.tableName}.assigned_to LIKE ?`;
        params.push(s);
      }
      if (this.allowedFields.includes('vehicle_plate') || this.allowedFields.includes('plate_no')) {
        whereClause += ` OR ${this.tableName}.plate_no LIKE ?`;
        params.push(s);
      }
      whereClause += `)`;
    }

    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const totalRecords = db.prepare(countQuery).get(...params).total;

    let query = `
      SELECT ${this.tableName}.*, p.name as package_name 
      FROM ${this.tableName} 
      LEFT JOIN packages p ON ${this.tableName}.package_id = p.id 
      ${whereClause}
      ORDER BY ${this.tableName}.id DESC
    `;

    if (queryParams.export === 'true') {
      const data = db.prepare(query).all(...params);
      return { data, totalRecords, totalPages: 1, currentPage: 1 };
    }

    const page = Math.max(parseInt(queryParams.page) || 1, 1);
    const limit = Math.max(parseInt(queryParams.limit) || 10000, 1);
    const offset = (page - 1) * limit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const data = db.prepare(query).all(...params);

    return {
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page
    };
  }

  getById(id) {
    return db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id);
  }

  create(req, data) {
    if (!data.operator) throw new Error('Operatör zorunludur.');

    const formattedPhone = cleanPhone(data.phone_no);
    
    const duplicateTable = checkDuplicatePhone(formattedPhone);
    if (duplicateTable) {
      const tableNames = { 'sim_m2m': 'M2M', 'sim_data': 'Data', 'sim_voice': 'Ses' };
      throw new Error(`Bu telefon numarası zaten ${tableNames[duplicateTable] || duplicateTable} hatlarında kayıtlı.`);
    }

    const finalAssignedTo = data.assigned_to ||
      ((data.first_name || data.last_name) ? `${data.first_name||''} ${data.last_name||''}`.trim() : null);

    if (data.location) syncLocation(data.location);
    if (data.company) syncCompany(data.company);
    if (finalAssignedTo) {
      syncPersonnel(finalAssignedTo, data.department, data.assigned_company || data.company);
    }

    const insertData = { ...data, phone_no: formattedPhone, status: data.status || 'active' };
    if (this.allowedFields.includes('assigned_to')) insertData.assigned_to = finalAssignedTo;

    const fields = [];
    const values = [];
    const placeholders = [];

    this.allowedFields.forEach(field => {
      if (insertData[field] !== undefined) {
        fields.push(field);
        values.push(insertData[field] || null);
        placeholders.push('?');
      }
    });

    const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    const result = db.prepare(query).run(...values);

    logActivity(req, 'CREATE', this.simType, result.lastInsertRowid, { 
      iccid: insertData.iccid, 
      phone_no: insertData.phone_no 
    });

    return { id: result.lastInsertRowid, message: `${this.simType} hattı eklendi.` };
  }

  update(req, id, data) {
    const formattedPhone = cleanPhone(data.phone_no);

    const duplicateTable = checkDuplicatePhone(formattedPhone, id, this.tableName);
    if (duplicateTable) {
      const tableNames = { 'sim_m2m': 'M2M', 'sim_data': 'Data', 'sim_voice': 'Ses' };
      throw new Error(`Bu telefon numarası zaten ${tableNames[duplicateTable] || duplicateTable} hatlarında kayıtlı.`);
    }

    const finalAssignedTo = data.assigned_to ||
      ((data.first_name || data.last_name) ? `${data.first_name||''} ${data.last_name||''}`.trim() : null);

    if (data.location) syncLocation(data.location);
    if (data.company) syncCompany(data.company);
    if (finalAssignedTo) {
      syncPersonnel(finalAssignedTo, data.department, data.assigned_company || data.company);
    }

    const updateData = { ...data, phone_no: formattedPhone };
    if (this.allowedFields.includes('assigned_to') && (data.assigned_to !== undefined || data.first_name !== undefined)) {
        updateData.assigned_to = finalAssignedTo;
    }

    const fields = [];
    const values = [];

    this.allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        fields.push(`${field}=?`);
        values.push(updateData[field] || null);
      }
    });

    if (fields.length === 0) throw new Error('Güncellenecek veri bulunamadı.');

    fields.push('updated_at=CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id=?`;
    const result = db.prepare(query).run(...values);
    
    if (result.changes === 0) throw new Error('Kayıt bulunamadı.');

    logActivity(req, 'UPDATE', this.simType, id, { 
      iccid: updateData.iccid, 
      phone_no: updateData.phone_no 
    });

    return { message: `${this.simType} hattı güncellendi.` };
  }

  remove(req, id) {
    const result = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
    if (result.changes === 0) throw new Error('Kayıt bulunamadı.');
    
    logActivity(req, 'DELETE', this.simType, id);
    return { message: `${this.simType} hattı silindi.` };
  }

  bulkUpdate(req, ids, data) {
    if (!Array.isArray(ids) || ids.length === 0) throw new Error('Geçersiz ID listesi.');
    if (!data || Object.keys(data).length === 0) throw new Error('Güncellenecek veri bulunamadı.');

    const fields = [];
    const values = [];

    this.allowedFields.forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) throw new Error('Güncellenecek geçerli alan bulunamadı.');
    fields.push('updated_at = CURRENT_TIMESTAMP');

    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id IN (${placeholders})`;
    
    const result = db.prepare(query).run(...values, ...ids);
    
    logActivity(req, 'BULK_UPDATE', this.simType, ids.join(','), { count: result.changes, updates: data });
    ids.forEach(id => logActivity(req, 'UPDATE', this.simType, id, { ...data, bulk: true }));
    
    return { message: `${result.changes} kayıt başarıyla güncellendi.` };
  }

  bulkRemove(req, ids) {
    if (!Array.isArray(ids) || ids.length === 0) throw new Error('Geçersiz ID listesi.');
    const placeholders = ids.map(() => '?').join(',');
    
    const result = db.prepare(`DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`).run(...ids);
    
    logActivity(req, 'BULK_DELETE', this.simType, ids.join(','), { count: result.changes });
    ids.forEach(id => logActivity(req, 'DELETE', this.simType, id, { bulk: true }));
    
    return { message: `${result.changes} kayıt başarıyla silindi.` };
  }
}

module.exports = SimService;
