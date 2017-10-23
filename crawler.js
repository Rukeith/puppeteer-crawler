const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const keyword = '米森 蔓越莓麥片';
const sourceList = [
  {
    name: 'momo',
    url: 'https://www.momoshop.com.tw/search/searchShop.jsp?searchType=1&curPage=1',
    params: {
      type: 'query',
      name: 'keyword'
    },
    product: {
      count: '.listArea ul li',
      img: '.listArea ul li .prdImg',
      title: '.listArea ul li .prdName',
      price: '.listArea ul li .money .price b'
    }
  },
  {
    name: 'yahoo',
    url: 'https://tw.search.buy.yahoo.com/search/shopping/product?qt=product',
    params: {
      type: 'query',
      name: 'p'
    },
    product: {
      count: '.list-type .item',
      img: '.srp-pdimage a img',
      title: '.srp-pdtitle a',
      price: '.srp-actprice em'
    }
  },
  {
    name: 'book',
    url: 'http://search.books.com.tw/search/query/key/keyword/cat/all',
    params: {
      type: 'param',
      name: 'keyword'
    },
    product: {
      count: '.searchbook .item',
      img: '.searchbook .item a img.itemcov',
      title: '.searchbook .item a img.itemcov',
      price: '.searchbook .item .price'
    }
  }
];

const crawler = ($, params = {}, type) => {
  console.log('------------ parse start ------------');
  const itemCount = ($(params.count).length > 10) ? 10 : $(params.count).length;
  console.log('------------ parse count ------------', itemCount);

  const parseData = [];
  for (let index = 0; index < itemCount; index++) {
    const img = (type === 'book') ? $(params.img).get(index).attribs['data-original'] : $(params.img).get(index).attribs.src;
    const title = (type === 'book') ? $(params.title).get(index).attribs.alt : $(params.title).get(index).children[0].data;

    let price;
    if (type === 'book') {
      const selector = `${params.count}:nth-child(${index + 1}) .price strong`;
      const length = ($(selector).length > 0) ? $(selector).length - 1 : 0;
      price = $(`${selector} b`).get(length).children[0].data;
    } else {
      price = $(params.price).get(index).children[0].data;
    }
    parseData.push({ img, title, price });
  }
  return parseData;
};

module.exports = api => {
  api.get('/', async ctx => {
    console.log('------------ Program start ------------');
    const browser = await puppeteer.launch();
  
    console.log('------------ start crawler ------------');
    const data = await Promise.all(sourceList.map(source => {
      return new Promise(async (resolve, reject) => {
        try {
          const page = await browser.newPage();
          let url = source.url;
          if (source.params.type === 'query') {
            url = `${url}&${source.params.name}=${keyword}`;
          } else if (source.params.type === 'param') {
            url = url.replace(source.params.name, keyword);
          }
          console.log('------------ url ------------', url);
          await page.goto(url);
          const content = await page.content();
          const $ = cheerio.load(content);
    
          const result = crawler($, source.product, source.name);
          await page.close();
          resolve({ data: result, website: source.name });
        } catch (error) {
          reject(error);
        }
      });
    }));
  
    await browser.close();
    ctx.render('index', { keyword, data, title: 'Crawler' });
    console.log('------------ Program end ------------');
  });
};
