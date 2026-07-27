const cheerio = require('cheerio');
fetch('https://www.basketball-reference.com/international/euroleague/2025-schedule.html', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
})
  .then(r => {
     console.log('Status:', r.status);
     return r.text();
  })
  .then(t => {
    const $ = cheerio.load(t);
    const matches = [];
    $('#regular-season-games tbody tr').each((i, el) => {
      if ($(el).hasClass('thead')) return;
      const home = $(el).find('td[data-stat="home_team_name"] a').text().trim();
      const away = $(el).find('td[data-stat="visitor_team_name"] a').text().trim();
      if (home && away) {
        matches.push({ home, away });
      }
    });
    console.log(matches.slice(0, 5));
    console.log('Matches length:', matches.length);
  });
