'use strict';

exports.up = function(knex, Promise) {
  // create Marketplace Products table
  knex.schema.createTable('marketplaceproduct', function (table) {
    table.increments();
    table.boolean('isActive').defaultTo(true);
    table.text('description');
    table.string('model').notNullable();
    table.string('title').notNullable();
    table.string('slug').notNullable();
    table.string('imageUrl').notNullable();
    table.dateTime('createdAt').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table.dateTime('updatedAt').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  }).catch(function(err) { console.log(err); });
};

exports.down = function(knex, Promise) {
  knex.schema.dropTable('marketplaceproduct');
};
