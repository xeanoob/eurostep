const cheerio = require('cheerio');
fetch('https://www.basketball-reference.com/international/euroleague/2024-schedule.html')
  .then(r => r.text())
  .then(t => {
    const $ = cheerio.load(t);
    const dateAttr = $('#regular-season-games tbody tr').first().find('th').attr('data-stat');
    const dateText = $('#regular-season-games tbody tr').first().find('th').text();
    console.log(dateAttr, dateText);
  });
