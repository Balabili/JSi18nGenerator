const Koa = require('koa'),
  app = new Koa(),
  path = require('path'),
  fs = require('fs'),
  render = require('koa-ejs'),
  router = require('koa-router')(),
  koaBody = require('koa-body'),
  xlsx = require('node-xlsx'),
  views = require('koa-views');

app.use(koaBody({ multipart: true }));

app.on('error', function (err, ctx) {
  console.log(err);
});

router.use(views(__dirname + '/views'));

router.get('/', async (ctx) => {
  await ctx.render('index');
});

function initDefaultArr(cnFile) {
  const stringArr = cnFile.split('\n');
  stringArr.pop();
  stringArr.pop();
  stringArr.shift();
  return stringArr;
}

function generateCNArr(cnFile) {
  const stringArr = initDefaultArr(cnFile);
  const newArr = [];
  const defaultObj = { key: '', cn: '', en: '' };
  stringArr.forEach(item => {
    if (item === "") {
      newArr.push(defaultObj);
    } else {
      const itemArr = item.split(':');
      const arrObj = {};
      let value = '';
      arrObj.key = itemArr[0].trim();
      if (itemArr.length === 2) {
        value = itemArr[1].trim();
      } else {
        itemArr.shift();
        value = itemArr.join(':').trim();
      }
      const substringStartIndex = value[0] === '"' ? 1 : 0;
      arrObj.cn = value.substring(substringStartIndex, value.length - 1 - substringStartIndex);
      newArr.push(arrObj);
    }
  });
  return newArr;
}

function conbineArray(newArr, enFile) {
  const stringArr = initDefaultArr(enFile),
    len = newArr.length;
  stringArr.forEach(item => {
    if (item !== "") {
      const itemArr = item.split(':');
      let value = '';
      const key = itemArr[0].trim();
      if (itemArr.length === 2) {
        value = itemArr[1].trim();
      } else {
        itemArr.shift();
        value = itemArr.join(':').trim();
      }
      const substringStartIndex = value[0] === '"' ? 1 : 0;
      const en = value.substring(substringStartIndex, value.length - 1 - substringStartIndex);
      for (let i = 0; i < len; i++) {
        const item = newArr[i];
        if (item.key === key) { item.en = en; break; }
      }
    }
  });
}

function formatJS2Array(cnFile, enFile) {
  const newArr = generateCNArr(cnFile);
  conbineArray(newArr, enFile);
  return newArr;
}

function buildXlsx(xlsxArr) {
  const dataArr = [];
  xlsxArr.forEach(item => {
    dataArr.push([item.key, item.cn || '', item.en || '']);
  });
  dataArr.unshift(['key', '中文', '英文']);
  const buffer = xlsx.build([
    {
      name: 'sheet1',
      data: dataArr
    }
  ]);
  fs.writeFileSync('./public/xlsx/test1.xlsx', buffer, { 'flag': 'w' });
}

// 下载xlsx
router.post('/downloadxlsx', async (ctx) => {
  const files = ctx.request.files;
  const enFilePath = files.en.path;
  const cnFilePath = files.cn.path;
  const enfile = fs.readFileSync(enFilePath, { encoding: 'UTF-8' });
  const cnfile = fs.readFileSync(cnFilePath, { encoding: 'UTF-8' });
  const xlsxArr = formatJS2Array(cnfile, enfile);
  buildXlsx(xlsxArr);
  ctx.body = 'success';
});

function formatArray2JS(dataList) {
  const enArr = ['export default {'], cnArr = ['export default {'];
  dataList.shift();
  dataList.forEach(item => {
    if (item[0] === '') {
      enArr.push('');
      cnArr.push('');
    } else {
      const enString = item[1];
      if (enString[0] === '[' || enString.indexOf('${') !== -1) {
        enArr.push(`${item[0]}: ${item[2]},`);
        cnArr.push(`${item[0]}: ${item[1]},`);
      } else {
        enArr.push(`${item[0]}: "${item[2]}",`);
        cnArr.push(`${item[0]}: "${item[1]}",`);
      }
    }
  });
  enArr.push('}');
  cnArr.push('}');
  const cnString = cnArr.join('\n');
  const enString = enArr.join('\n');
  fs.writeFileSync('./public/js/zh_CN.js', cnString);
  fs.writeFileSync('./public/js/en_US.js', enString);
}

router.post('/downloadjs', async (ctx) => {
  const xlsxPath = ctx.request.files.xlsx.path;
  const list = xlsx.parse(xlsxPath);
  const dataList = list[0].data;
  formatArray2JS(dataList);
  ctx.body = 'success';
});

function combineXlsx2JS(xlsx, i18n) {
  const len = i18n.length;
  xlsx.forEach(item => {
    const key = item[0], 
      cn = item[1],
      en = item[2];
    for (let i = 0; i < len; i++) {
      if (i18n[i].key === key) {
        i18n[i].cn = cn;
        i18n[i].en = en;
        break;
      }
    }
  });
}

function downloadJS(i18n) {
  const enArr = ['export default {'], cnArr = ['export default {'];
  i18n.shift();
  i18n.forEach(item => {
    if (item.key === '') {
      enArr.push('');
      cnArr.push('');
    } else {
      const enString = item.cn;
      if (enString[0] === '[' || enString.indexOf('${') !== -1) {
        enArr.push(`${item.key}: ${item.en},`);
        cnArr.push(`${item.key}: ${item.cn},`);
      } else {
        enArr.push(`${item.key}: "${item.en}",`);
        cnArr.push(`${item.key}: "${item.cn}",`);
      }
    }
  });
  enArr.push('}');
  cnArr.push('}');
  const cnString = cnArr.join('\n');
  const enString = enArr.join('\n');
  fs.writeFileSync('./public/js/zh_CN.js', cnString);
  fs.writeFileSync('./public/js/en_US.js', enString);
}

router.post('/combine2js', async (ctx) => {
  const files = ctx.request.files;
  const enFilePath = files.en.path;
  const cnFilePath = files.cn.path;
  const enfile = fs.readFileSync(enFilePath, { encoding: 'UTF-8' });
  const cnfile = fs.readFileSync(cnFilePath, { encoding: 'UTF-8' });
  const i18nArray = formatJS2Array(cnfile, enfile);
  const xlsxPath = files.xlsx.path;
  const list = xlsx.parse(xlsxPath);
  const dataList = list[0].data;
  combineXlsx2JS(dataList, i18nArray);
  downloadJS(i18nArray);
  ctx.body = 'success';
});

app.use(router.routes()).use(router.allowedMethods());
app.listen(5000);