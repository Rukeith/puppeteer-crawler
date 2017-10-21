const phantom = require('phantom');

(async () => {
  try {
    const instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']);
    const page = await instance.createPage();
    await page.on("onResourceRequested", requestData => console.info('Requesting', requestData.url));

    const status = await page.open('https://stackoverflow.com/');
    console.log(status);

    const content = await page.property('content');
    console.log(content);

    await instance.exit();
  } catch (error) {
    console.error('Error =', error);
  }
})();