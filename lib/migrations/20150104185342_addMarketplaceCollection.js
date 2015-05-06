'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('marketplacecollection', function (table) {
    table.increments();
    table.boolean('isActive').defaultTo(true);
    table.string('name').notNullable();
    table.dateTime('createdAt').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table.dateTime('updatedAt').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  }).catch(function(err) { console.log(err); });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('marketplacecollection');
};
