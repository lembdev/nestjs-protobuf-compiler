import handlebars from 'handlebars';

handlebars.registerHelper('uncapitalize', function (conditional) {
  return conditional[0].toLowerCase() + conditional.slice(1);
});
