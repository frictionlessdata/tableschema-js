"use strict";

// Module API

function checkPattern(constraint, value) {
  if (value === null) {
    return true;
  }
  var regex = new RegExp(constraint);
  var match = regex.exec(value);
  if (match) {
    return true;
  }
  return false;
}

module.exports = {
  checkPattern: checkPattern
};