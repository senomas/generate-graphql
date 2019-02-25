function doGetProjection(selectionSet, projection = {}) {
  selectionSet.selections.forEach(v => {
    if (v.kind === "Field") {
      projection[v.name.value] = true;
    }
  });
  return projection;
}

function getProjection(info) {
  return doGetProjection(info.fieldNodes[0].selectionSet);
}

function getSubProjection(info) {
  const projection = {};
  info.fieldNodes[0].selectionSet.selections.forEach(sel => {
    if (sel.selectionSet) {
      doGetProjection(sel.selectionSet, projection);
    }
  });
  return projection;
}

module.exports = { getProjection, getSubProjection };
