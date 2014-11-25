'use strict';
// var request = require('request');
// var cheerio = require('cheerio');
// var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var formatjson = require('format-json');


function normalizeAccident(accident) {

  // normalizing date:
  // check if date format is 'xx xxx YEAR' / 
  if (accident.date.indexOf('x') > -1 || accident.date.indexOf('X') > -1) {

    // add "unknown" as weekday and day
    accident.dateWeekday = "unknown";
    accident.dateDay = "unknown";

    var monthsMap = {'JAN':'January', 'FEB':'February', 'MAR':'March', 'APR':'April', 'MAY':'May', 'JUN':'June', 'JUL':'July', 'AUG':'August', 'SEP':'September', 'OCT':'October', 'NOV':'November', 'DEC':'December'}
    
    var dateMonth = accident.date.split(' ')[1];
    
    // check if month is not xxx, then map it with monthMAp 
    if (dateMonth !== 'xxx') {

      dateMonth = monthsMap[dateMonth];

      // add normalized month to the object
      accident.dateMonth = dateMonth;

    } else {

      accident.dateMonth = "unknown";

    }

    var dateYear = accident.date.split(' ')[2];
    accident.dateYear = dateYear;

  } else {

    var dateWeekday = accident.date.split(' ')[0];
    accident.dateWeekday = dateWeekday;

    var dateDay = accident.date.split(' ')[1];
    accident.dateDay = dateDay;

    var dateMonth = accident.date.split(' ')[2];
    accident.dateMonth = dateMonth;

    var dateYear = accident.date.split(' ')[3];
    accident.dateYear = dateYear;
  }


  // ===========
  // parse total fatalities and passengers:
  var totalFatalities = accident.total.split(' / ')[0];
  totalFatalities = totalFatalities.split(': ')[1];
  accident.totalFatalities = totalFatalities.trim();

  var totalOccupants = accident.total.split(' / ')[1];
  totalOccupants = totalOccupants.split(': ')[1];
  accident.totalOccupants = totalOccupants.trim();


  // ===========
  // parse departure country and destination country
  var departureCountry = accident.departure_airport.split(',');
  accident.departureCountry = departureCountry[departureCountry.length-1].trim();

  var destinationCountry = accident.destination_airport.split(',');
  accident.destinationCountry = destinationCountry[destinationCountry.length-1].trim();

  // remove departure or destination country if it's unknow ("?" or "-")
  if(accident.departureCountry) {
    if(accident.departureCountry.trim() == undefined || accident.departureCountry.trim() == "?" || accident.departureCountry.trim() == "-") {

      accident.departureCountry = "unknown";

    } else if(accident.destinationCountry.trim() == undefined || accident.destinationCountry.trim() == "?" || accident.destinationCountry.trim() == "-") {

      accident.destinationCountry = "unknown";

    }
  }


  // ============
  // check if it's International or Domestic flight by checking departureCountry and destinationCountry
  // check only for those accidents where both departureCountry and destinationCountry are known
  if(accident.departureCountry.trim() !== "unknown" && accident.destinationCountry.trim() !== "unknown") {
    
    // check if departureCountry and destinationCountry are same or different and add natureInt
    if (accident.departureCountry == accident.destinationCountry) {

      accident.natureInt = "Domestic";

    } else {

      accident.natureInt = "International";
    }
  } else {

    accident.natureInt = "unknown";

  }

  
  // ============
  // small cleanup for phase
  accident.phase = accident.phase.trim();


  // ============
  // accident nature - passenger or not, scheduled or not
  // check if it's pasenger flight
  if(accident.nature.indexOf("Passenger") > -1) {

    // for those, where "nature" not only "Passenger" word, remove first word (it's Domestic, International or Int'l)
    if(accident.nature.indexOf("Passenger") !== 0) {
      
      // get array of words in nature without first one (Int'l, International or domestic)
      var natureArray = _.rest(accident.nature.split(' '));
      
      // check if first word in array is "non", then it's non-scheduled flight
      if (natureArray[0] == 'Non') {

        accident.scheduledFlight = "Non Scheduled";

      } else {

        accident.scheduledFlight = "Scheduled";

      }

    }

    // update accident.nature with only "Passenger" word
    accident.nature = "Passenger"
    
  } else {

    // for non-passenger flights add notion of .schduledFlight
    accident.scheduledFlight = "NA"

  }

  // add normilized "unknown" to flights, when nature is unknown
  if(accident.nature == "-" || accident.nature == "Unknown") {

    accident.nature = "unknown";

  }

  
  // ==============
  // define accident locationCountry
  // split accident of location to get the last part with country
  var locationArray = accident.location.split('(');
  // cut off anything other than country
  var locationCountry = _.last(locationArray).trim().split(')')[0];
  accident.locationCountry = locationCountry;


  // ==============
  // clean up the damage
  accident.airplane_damage = accident.airplane_damage.trim();

  if(accident.status == "") {
    accident.status = "unknown";
  }

  // if (accident.total == undefined) {
  //   console.log ("ERROR: ", accident);
  // }
  return accident;
}

// readng file and normalizing data
fs.readFile('accidents_raw.json', {encoding:"utf8"}, function (err, accidentsString) {
  if (err) throw err;

  var accidents = JSON.parse(accidentsString);

  // remove all empty objects
  var normalizedAccidents = _.compact(accidents);

  // normalize accidents
  normalizedAccidents = _.map(normalizedAccidents, function(accident){
    return normalizeAccident(accident);
  });

  // stringify array of normalized accidents before it can be written to file
  var normalizedAccidentsString = formatjson.diffy(normalizedAccidents);

  fs.writeFile('accidents_normalized.json', normalizedAccidentsString, function(err) {
    if (err) throw err;
    console.log('Saved!');
  });

});