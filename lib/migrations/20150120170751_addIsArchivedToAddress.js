'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('address', function(table) {
    table.boolean('isArchived').defaultTo(true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('address', function(table) {
    table.dropColumn('isArchived');
  });
};
