'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('product', function(table) {
    table.string('externalSku');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('product', function(table) {
    table.dropColumn('externalSku');
  });
};
