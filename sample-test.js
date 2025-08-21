const { Builder, By, until } = require('selenium-webdriver');

async function testShadowDOM(config) {
  let driver;
  try {
    // Initialize driver
    const capabilities = {
      'bstack:options': {
        os: config.os,
        osVersion: config.osVersion,
        sessionName: `Shadow DOM - ${config.os} ${config.osVersion}`,
        buildName: 'Shadow DOM Tests',
        debug: true
      },
      browserName: config.browser
    };

    const hubUrl = `https://${process.env.BROWSERSTACK_USERNAME}:${process.env.BROWSERSTACK_ACCESS_KEY}@hub-cloud.browserstack.com/wd/hub`;

    driver = await new Builder()
      .usingServer(hubUrl)
      .withCapabilities(capabilities)
      .build();

    await driver.manage().setTimeouts({ implicit: 10000, pageLoad: 30000 });
    
    // Navigate and test
    await driver.get(config.testUrl);
    
    // Switch to iframe
    const iframe = await driver.wait(until.elementLocated(By.css('iframe')), 15000);
    await driver.switchTo().frame(iframe);
    
    // Access shadow DOM and verify
    const shadowHost = await driver.wait(until.elementLocated(By.id('shadow-host')), 15000);
    const shadowRoot = await shadowHost.getShadowRoot();
    const targetElement = await shadowRoot.findElement(By.id('target-element'));
    const actualText = await targetElement.getText();
    
    if (actualText !== 'Here is the target element!') {
      throw new Error(`Text mismatch. Expected: "Here is the target element!", Got: "${actualText}"`);
    }

    const nestedShadowHost = await shadowRoot.findElement(By.id('nested-shadow-host'));
    const nestedShadowRoot = await nestedShadowHost.getShadowRoot();
    const nestedTargetElement = await nestedShadowRoot.findElement(By.id('nested-target'));
    const nestedText = await nestedTargetElement.getText();

    if (nestedText !== 'Nested shadow element for testing!') {
      throw new Error(`Text mismatch. Expected: "Nested shadow element for testing!", Got: "${actualText}"`);
    }
    
    return { status: 'PASSED', browser: config.browser, os: config.os };
    
  } catch (error) {
    return { status: 'FAILED', error: error.message, browser: config.browser, os: config.os };
  } finally {
    if (driver) await driver.quit();
  }
}

const testConfigs = [
  { browser: 'chrome', os: 'OS X', osVersion: 'Big Sur', testUrl: 'https://6403b594f111.ngrok-free.app' },
  { browser: 'chrome', os: 'Windows', osVersion: '10', testUrl: 'https://6403b594f111.ngrok-free.app' },
  { browser: 'safari', os: 'OS X', osVersion: 'Monterey', testUrl: 'https://6403b594f111.ngrok-free.app' }
];

async function runTests() {
  if (!process.env.BROWSERSTACK_USERNAME || !process.env.BROWSERSTACK_ACCESS_KEY) {
    console.error('❌ Missing BrowserStack credentials. Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY');
    process.exit(1);
  }
  
  console.log('🚀 Starting Shadow DOM Tests...\n');
  
  const results = await Promise.allSettled(testConfigs.map(testShadowDOM));
  
  console.log('\n📊 Results:');
  results.forEach((result, i) => {
    const config = testConfigs[i];
    const status = result.status === 'fulfilled' && result.value.status === 'PASSED' ? '✅' : '❌';
    const details = result.status === 'fulfilled' ? result.value.status : 'CRASHED';
    console.log(`${status} ${config.browser}/${config.os} ${config.osVersion}: ${details}`);
    
    if (result.status === 'fulfilled' && result.value.error) {
      console.log(`   ${result.value.error}`);
    } else if (result.status === 'rejected') {
      console.log(`   ${result.reason.message}`);
    }
  });
  
  const passed = results.filter(r => r.status === 'fulfilled' && r.value.status === 'PASSED').length;
  console.log(`\n📈 ${passed}/${results.length} tests passed`);
  
  if (passed < results.length) process.exit(1);
}

if (require.main === module) runTests();
module.exports = { testShadowDOM, runTests };
