const bcrypt = require('bcrypt');
const PAGE_MAX = 100;
const immutableModels = new Set(['AuditLog']);

function makeCrudController(modelName) {
  const getModel = (req) => req.app.locals.db[modelName];
  const tenantScope = (model, req) => {
    const where = {};
    if (model.rawAttributes.org_id && req.user.org_id != null) where.org_id = req.user.org_id;
    const scope = { where, include: [] };
    const belongsTo = (name, nested) => {
      const association = model.associations[name];
      if (association) scope.include.push({ model: association.target, as: association.as, required: true, ...nested });
    };
    if (modelName === 'Organization') where.id = req.user.org_id;
    if (modelName === 'AgentStep' || modelName === 'PaymentPlan') belongsTo('AgentRun', { where: { org_id: req.user.org_id } });
    if (modelName === 'PlanItem') belongsTo('Invoice', { where: { org_id: req.user.org_id } });
    if (modelName === 'Payment') belongsTo('Invoice', { where: { org_id: req.user.org_id } });
    if (modelName === 'VendorNotice') belongsTo('Vendor', { where: { org_id: req.user.org_id } });
    if (modelName === 'Notification') belongsTo('User', { where: { org_id: req.user.org_id } });
    if (modelName === 'Approval') belongsTo('PaymentPlan', { include: [{ model: req.app.locals.db.AgentRun, required: true, where: { org_id: req.user.org_id } }] });
    return scope;
  };
  const fieldsFor = (model) => Object.keys(model.rawAttributes).filter((field) =>
    !['id', 'created_at', 'updated_at'].includes(field) && !field.endsWith('At') && !field.endsWith('Id')
  );
  const pick = (body, fields) => Object.fromEntries(fields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));

  return {
    create: async (req, res) => {
      try {
        const Model = getModel(req);
        const fields = fieldsFor(Model);
        const values = pick(req.body || {}, fields);
        if (Model.rawAttributes.org_id) {
          if (req.user.org_id == null) return res.status(403).json({ error: 'User is not assigned to an organization' });
          values.org_id = req.user.org_id;
        }
        if (modelName === 'AuditLog') {
          values.actor_type = 'user';
          values.actor_id = req.user.id;
        }
        if (modelName === 'Organization') return res.status(403).json({ error: 'Organizations cannot be created through this endpoint' });
        if (modelName === 'User') {
          if (!req.body.password) return res.status(400).json({ error: 'password is required' });
          if (req.body.role && req.body.role !== 'viewer' && req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can assign elevated user roles' });
          values.password_hash = await bcrypt.hash(req.body.password, 12);
        }
        const data = await Model.create(values);
        const result = data.toJSON();
        if (modelName === 'User') delete result.password_hash;
        return res.status(201).json({ message: `${modelName} created successfully`, data: result });
      } catch (error) { return res.status(400).json({ error: error.message }); }
    },
    getAll: async (req, res) => {
      try {
        const Model = getModel(req);
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(PAGE_MAX, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
        const { where, include } = tenantScope(Model, req);
        if (req.query.id) where.id = req.query.id;
        const { count, rows } = await Model.findAndCountAll({ where, include, distinct: true, offset: (page - 1) * limit, limit, order: [['id', 'DESC']] });
        const data = rows.map((row) => {
          const value = row.toJSON();
          if (modelName === 'User') delete value.password_hash;
          return value;
        });
        return res.status(200).json({ totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, pageSize: limit, data });
      } catch (error) { return res.status(500).json({ error: error.message }); }
    },
    getById: async (req, res) => {
      try {
        const Model = getModel(req);
        const { where, include } = tenantScope(Model, req);
        where.id = req.params.id;
        const data = await Model.findOne({ where, include });
        if (!data) return res.status(404).json({ message: `${modelName} not found` });
        const result = data.toJSON();
        if (modelName === 'User') delete result.password_hash;
        return res.status(200).json(result);
      } catch (error) { return res.status(500).json({ error: error.message }); }
    },
    update: async (req, res) => {
      if (immutableModels.has(modelName)) return res.status(405).json({ error: 'Audit logs are append-only' });
      try {
        const Model = getModel(req);
        const scope = tenantScope(Model, req);
        scope.where.id = req.params.id;
        const record = await Model.findOne(scope);
        if (!record) return res.status(404).json({ message: `${modelName} not found` });
        const values = pick(req.body || {}, fieldsFor(Model));
        if (modelName === 'User') {
          if (req.body.role && req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can change user roles' });
          delete values.password_hash;
          if (req.body.password) values.password_hash = await bcrypt.hash(req.body.password, 12);
        }
        await record.update(values);
        const result = record.toJSON();
        if (modelName === 'User') delete result.password_hash;
        return res.status(200).json({ message: `${modelName} updated successfully`, data: result });
      } catch (error) { return res.status(400).json({ error: error.message }); }
    },
    remove: async (req, res) => {
      if (immutableModels.has(modelName)) return res.status(405).json({ error: 'Audit logs are append-only' });
      try {
        const Model = getModel(req);
        const scope = tenantScope(Model, req);
        scope.where.id = req.params.id;
        const record = await Model.findOne(scope);
        if (!record) return res.status(404).json({ message: `${modelName} not found or already deleted` });
        await record.destroy();
        return res.status(200).json({ message: `${modelName} deleted successfully` });
      } catch (error) { return res.status(409).json({ error: error.message }); }
    },
  };
}

module.exports = makeCrudController;
