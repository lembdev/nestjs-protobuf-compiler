import handlebars from 'handlebars';

handlebars.registerHelper('var', function (varName, varValue, options) {
  options.data.root[varName] = varValue;
});
