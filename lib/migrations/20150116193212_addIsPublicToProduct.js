'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('product', function(table) {
    table.boolean('isPublic').defaultTo(true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('product', function(table) {
    table.dropColumn('isPublic');
  });
};
