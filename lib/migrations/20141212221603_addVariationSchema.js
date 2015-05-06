'use strict';

exports.up = function(knex, Promise) {
  // Create the Variation table
  knex.schema.createTable('variation', function(table) {
    table.increments();
    table.boolean('isActive').defaultTo(true);
    table.integer('marketplaceProduct').notNullable().references('marketplaceproduct');
    table.integer('product').notNullable().references('product');
    table.integer('photo').notNullable().references('photo');
    table.dateTime('createdAt').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table.dateTime('updatedAt').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  }).catch(function(err) { console.log(err); });
};

exports.down = function(knex, Promise) {
  knex.schema.dropTable('variation');
};
