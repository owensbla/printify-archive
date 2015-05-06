module.exports = {

  loadTabs: function(el) {
    var $el = $(el);

    $el.find('.js-tabs').each(function(index) {
      $(this).children('li').first().children('a').addClass('is-active').next().addClass('is-open').show();
    });

    $el.find('.js-tabs').on('click', 'li > a', function(event) {
      if (!$(this).hasClass('is-active')) {
        event.preventDefault();
        var accordionTabs = $(this).closest('.js-tabs');
        accordionTabs.find('.is-open').removeClass('is-open').hide();

        $(this).next().toggleClass('is-open').toggle();
        accordionTabs.find('.is-active').removeClass('is-active');
        $(this).addClass('is-active');
      } else {
        event.preventDefault();
      }
    });
  },

  addSpinner: function(el, opts) {
    opts = opts ? opts : {};
    opts = _.defaults(opts, {
      remove: true
    });

    // remove spinners first
    if (opts.remove) { this.removeSpinner(); }

    // Show the spinner and disable the button
    $(el).addClass('has-spinner disabled').attr('disabled', 'disabled');
  },

  removeSpinner: function(el) {
    el = el ? el : false;

    if (el) {
      $(el).removeAttr('disabled').removeClass('has-spinner disabled');
    } else {
      $('.has-spinner').removeAttr('disabled').removeClass('has-spinner disabled');
    }
  }

};