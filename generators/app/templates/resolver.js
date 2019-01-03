const { getProjection, getSubProjection } = require("./lib");

function <%= model.id %>Encode(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(v => {
      <%_ model.fields.forEach(function(field) { if (field.type === "ID") { _%>
      if (v.<%= field.id %>) {
        v.<%= field.id %> = v.<%= field.id %>.toHexString();
      }
      <%_ }}) _%>
    })
  } else if (obj) {
    <%_ model.fields.forEach(function(field) { if (field.type === "ID") { _%>
    if (obj.<%= field.id %>) {
      obj.<%= field.id %> = obj.<%= field.id %>.toHexString();
    }
    <%_ }}) _%>
  }
  return obj; 
}

function <%= model.id %>Decode(obj) {
  if (obj) {
    <%_ model.fields.forEach(function(field) { if (field.type === "ID") { _%>
    if (obj.<%= field.id %>) {
      obj.<%= field.id %> = ObjectId(obj.<%= field.id %>);
    }
    <%_ } }) _%>
  }
  return obj; 
}

async function <%= model.id %>Resolver(parent, args, context, info) {
  args = <%= model.id %>Decode(args);
  const projection = getProjection(info);
  return <%= model.id %>Encode(await context.db.collection("<%= model.id %>").findOne(args, { projection }));
}

async function <%= model.id %>ListResolver(parent, args, context, info) {
  const options = {};
  if (args.filter) {
    const filter = args.filter;
    options.skip = filter.skip;
    options.limit = filter.limit;
    options.sort = filter.orderBy;
    options.descending = filter.descending;
    delete args.filter;
  }
  args = <%= model.id %>Decode(args);
  options.projection = getSubProjection(info);
  const total = await context.db.collection("<%= model.id %>").countDocuments(args);
  const items = <%= model.id %>Encode(await context.db.collection("<%= model.id %>").find(args, options).toArray());
  return { total, items }
}

async function <%= model.id %>Create(parent, args, context, info) {
  args = <%= model.id %>Decode(args);
  const res = await context.db.collection("<%= model.id %>").insertOne(args);
  if (res.insertedCount === 1) {
    args._id = res.insertedId;
    return <%= model.id %>Encode(args);
  }
  throw res;
}

module.exports = { <%= model.id %>Resolver, <%= model.id %>ListResolver, <%= model.id %>Create }