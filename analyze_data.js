'use strict';
// var request = require('request');
// var cheerio = require('cheerio');
// var async = require('async');
var _ = require('underscore');
var fs = require('fs');
// var formatjson = require('format-json');

function numberOfAccidentsPerYear(accidents) {

  // map accidents by year
  var mapOfAccidentsPerYear = _.groupBy(accidents, 'dateYear');

  var numberOfAccidentsPerYear = {};

  _.each(mapOfAccidentsPerYear, function(accidentsPerYearArray, year) {

    numberOfAccidentsPerYear[year] = accidentsPerYearArray.length;

  });

  console.log(numberOfAccidentsPerYear);

}


// function groupAccidents(accidents, quality) {

//   var mapOfAccidentsPerMonth = _.groupBy(accidents, quality);

//   console.log(mapOfAccidentsPerMonth);

// }


fs.readFile('accidents_normalized.json', {encoding:"utf8"}, function (err, accidentsString) {
  if (err) throw err;

  // get workable array fisrt
  var accidents = JSON.parse(accidentsString);

  // calculate all accidents per year
  console.log("============ all accidents per year ============");
  numberOfAccidentsPerYear(accidents);


  // calculate only accidents with passenger flights
  // find only those, where nature is "Passenger"
  var accidentsPassenger = _.where(accidents, {'nature' : 'Passenger'});
  
  console.log("============ all passenger accidents per year ============");
  numberOfAccidentsPerYear(accidentsPassenger);

  // calculate how many passenger flights have fatalities
  var accidentsPassengerFatalities = _.filter(accidentsPassenger, function(accident){
    return parseInt(accident.totalFatalities, 10) > 0
  });
  console.log("============ all passenger accidents with fatalities per year ============");
  numberOfAccidentsPerYear(accidentsPassengerFatalities);

  // calculate how many people die in all accidents
  var k = 0;
  var accidentsPassengerFatalitiesPeople = _.filter(accidentsPassenger, function(accident){
    if (parseInt(accident.totalFatalities, 10) > 0) {
      k = k + parseInt(accident.totalFatalities, 10);
    }
  });
  console.log(k);
  
  // accidentsPerYear(accidentsPassengersFatalArray);

});

// {2:[], 3:[]}