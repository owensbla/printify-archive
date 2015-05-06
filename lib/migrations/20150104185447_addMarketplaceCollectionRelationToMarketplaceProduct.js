'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('marketplaceproduct', function(table) {
    table.integer('collection').references('marketplacecollection');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('marketplaceproduct', function(table) {
    table.dropColumn('collection');
  });
};
