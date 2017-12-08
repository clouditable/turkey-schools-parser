const request = require('request')
const cheerio = require('cheerio')
const async = require('async')
const fs = require('fs')
const underscore = require('underscore')
var SchoolsJsonData = [];
const iconv  = require('iconv-lite');


let writeFile = () => {
  fs.writeFile("./turkey-meb-schools.json", JSON.stringify(SchoolsJsonData), (err) => {
    if(err) return console.log(err)
    console.log("Dosya Kaydedildi.")
  })
}

let main = (callback) => {
  console.log("[+] Main function!")
  let url = "", href = "", TotalPageSize = 0
  for (let CityCode = 1; CityCode < 82; CityCode++) {
    // Burda Ilkoduna gore istek atiyoruz ve son sayfa numarasini ogreniyoruz.
    url = `http://www.meb.gov.tr/baglantilar/okullar/?ILKODU=${CityCode}`
    console.log(url)
    var requestOptions  = { encoding: null, method: "GET", uri: url};
    request(requestOptions, (err, resp, html) => {
      if (err) return null
      // <a class="last" href="?ILKODU=1&ILCEKODU=&SAYFANO=47" title="Son Sayfa">...</a>
      var utf8String = iconv.decode(new Buffer(html), "ISO-8859-1");
      const $ = cheerio.load(utf8String, {xmlMode: true, decodeEntities:false })
      href = $('.last').attr('href')
      TotalPageSize = href.split("=").pop()
      if (TotalPageSize === 0 || TotalPageSize === undefined) return null
      console.log(TotalPageSize)
      // Sayfa sayisini bulduktan sonra, tek tek sayfalardaki data yi aliyoruz.
      for(let PageNumber = 1; PageNumber <= TotalPageSize; PageNumber++) {
        url = `http://www.meb.gov.tr/baglantilar/okullar/?ILKODU=${CityCode}&ILCEKODU=&SAYFANO=${PageNumber}`
        console.log(url)
        var requestOptions  = { encoding: null, method: "GET", uri: url};
        request(requestOptions, (err, resp, html) => {
          if (err) return null
          var utf8String = iconv.decode(new Buffer(html), "ISO-8859-9");
          const $ = cheerio.load(utf8String, {xmlMode: true, decodeEntities:false })
          // Satirlar alindi. Burda icerikleri temizleyen kod yazmaliyiz, bazen sagdan veya soldan bosluk oluyor.
          // utf sorunu cozmeliyiz.
          let td = $('td');
          for (let j = 0; j<td.length; j++) {
            td.each(function(i, td) {
              var children = $(this).children();
              if (children[0].children[0] && children[0].children[0].data) {
                let data = children[0].children[0].data.toLowerCase();
                let row = {
                  city : data.split("-")[0] ? data.split("-")[0].slice(0,-1) :"",
                  district:  data.split("-")[1]? data.split("-")[1].slice(1,-1) : "",
                  school: data.split("-")[2] ? data.split("-")[2].slice(1) : ""
                }
                if (row && row.city && row.district && row.school && !similizeSchool(SchoolsJsonData, row)) {
                  SchoolsJsonData.push(row)
                }
              }
            })
          } // td
        })
      } // page number
    })
  } // city code
}

const similizeSchool = function(data, row) {
  const similizeSchol =  underscore.find(data, function(x) {
    return ((x.district === row.district) && (x.school === row.school));
  });
  return similizeSchol ? true : false;
}


// https://stackoverflow.com/questions/4981891/node-js-equivalent-of-pythons-if-name-main
if (require.main === module) {
  async.waterfall([main, writeFile], () => {
    console.log('done')
  })
}
