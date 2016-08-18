var request = require("sync-request"),
    cheerio = require("cheerio"),
    fs = require('fs'),
    underscore = require('underscore');
let  doc = [];

const similizeSchool = function(data, row) {
  const similizeSchol =  underscore.find(data, function(x) {
    return ((x.district === row.district) && (x.school === row.school));
  });
  return similizeSchol ? true : false;
};

var htmlParser = () => {
  let cityCode = 1;

  for (var i = cityCode; i<82; i++) {
    let pageCount = 1;
    let hasTd = true;
    do {
      let url = "http://www.meb.gov.tr/baglantilar/okullar/?ILKODU="+ i +"&ILCEKODU=&SAYFANO=" + pageCount;


      var res = request('GET', url);
      var body = res.getBody();

      if (body) {
        var $ = cheerio.load(body, {xmlMode: true})
        var td = $('td');
        for (var j = 0; j<td.length; j++) {
          td.each(function(i, td) {
            var children = $(this).children();
            if (children[0].children[0] && children[0].children[0].data) {
              const data = children[0].children[0].data.toLowerCase();
              var row = {
                city : data.split("-")[0],
                district: data.split("-")[1],
                school: data.split("-")[2]
              };
              if (row.city && row.district && row.school && !similizeSchool(doc, row)) {
                doc.push(row);
              }
            }
          });
        }

        hasTd = td.length > 1;

        pageCount++
      }
      else {
        console.log('Okul Yok');
      }

    } while (hasTd);
    console.log('Şehir Bitti');
  };


}

htmlParser();

fs.writeFile("./all_schools.json", JSON.stringify(doc), function(err) {
  if(err) {
    return console.log(err);
  }

  console.log("Dosya Kaydedildi.");
});

