function doGetProjection(selectionSet) {
  const projection = {};
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
  return doGetProjection(info.fieldNodes[0].selectionSet.selections[0].selectionSet);
}

module.exports = { getProjection, getSubProjection }
