# Printify.io

Ecommerce site for printing photos via Printful

### Misc Notes

Run process: `NODE_ENV=production forever start -e /var/log/printify.err.log -o /var/log/printify.log server.js`

Twitter Follow: var keywords = []; $.each($('.js-actionable-user').toArray(), function(i, el) { var $el = $(el); $.each(keywords, function(i, kw) { if (~$el.find('.ProfileCard-bio').text().toLowerCase().indexOf(kw)) { $el.find('.not-following .js-follow-btn').click() }}); })