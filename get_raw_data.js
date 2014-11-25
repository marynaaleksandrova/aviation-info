'use strict';
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var formatjson = require('format-json');

var years = [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013];


function parseAccidentPage(url, callback) {

  request(url, function(error, response, html){
    if (error) {
      callback(error);
    } else {
      var $ = cheerio.load(html);
      var accident = {};

      $('table').first().find('tr').each(function(i, elem) {
        var cells = $(this).find('td');

        var param = $(cells.get(0)).text();
        var value = $(cells.get(1)).text();

        param = param.replace(':', '').replace(' ', '_').toLowerCase();

        accident[param] = value;
      });

      callback(null, accident);
    }
  });
}


function allAccidentsURLsOnPage(url, callback) {
  request(url, function(error, response, html){
    if (error) {
      callback(error);
    } else {
      var $ = cheerio.load(html);
      var allAccidentsURL = [];

      $('table tr td a').each(function(i,elem) {

        var href = $(this).attr('href');
        var accidentURL = 'http://aviation-safety.net'+href;

        allAccidentsURL.push(accidentURL);

      });
      console.log(allAccidentsURL);
      callback(null, allAccidentsURL);
    }
  });
}


function getAllYearPagesUrls(year, callback) {

  var url = 'http://aviation-safety.net/database/dblist.php?Year=';
  var yearURL = url+year;

  request(yearURL, function(error, response, html){
    if (error) {
      callback(error);
    } else {
      var $ = cheerio.load(html);
      var allPagesUrls = [yearURL];

      $('.pagenumbers').first().find('a').each(function(i, elem) {

        var href = $(this).attr('href');
        var pageUrl = 'http://aviation-safety.net/database/dblist.php'+href;

        allPagesUrls.push(pageUrl);

      });

      console.log(allPagesUrls);
      callback(null, allPagesUrls);
    }
  });
}


function allAccidentsUrlsPerYear(year, callback) {

  getAllYearPagesUrls(year, function(error, urls) {
    var accidentsUrls;

    console.log(year);

    async.map(urls, allAccidentsURLsOnPage, function(error, accidents){
      accidentsUrls = _.flatten(accidents);
      console.log(accidentsUrls);
      callback(null, accidentsUrls);
    })
  });
}


function accidentsPerYear(accidentYear, callback) {

  allAccidentsUrlsPerYear(accidentYear, function(error, allUrls) {

    if (error) {
      callback(error);
    } else {
      async.map(allUrls, parseAccidentPage, function(error, accidents){
        console.log(allUrls);
        callback(null, accidents);
      })
    }
  });
}


function createDataFile(years, fileName) {

  async.map(years, accidentsPerYear, function(error, accidents){
    var allAccidents = _.flatten(accidents);

    var allAccidentsString = formatjson.diffy(allAccidents);
    // above line is the same as JSON.stringify(allAccidents);

    fs.writeFile(fileName, allAccidentsString, function(err) {
      if (err) throw err;
      console.log('Saved!');
    });
  });
}



createDataFile(years, 'accidents_raw.json');