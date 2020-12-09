"use strict";

// Module API

function checkRequired(constraint, value) {
  if (!(constraint && (value === null || value === undefined))) {
    return true;
  }
  return false;
}

module.exports = {
  checkRequired: checkRequired
};