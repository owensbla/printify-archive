'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('orderitem', function(table) {
    table.integer('lineItemId');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('orderitem', function(table) {
    table.dropColumn('lineItemId');
  });
};