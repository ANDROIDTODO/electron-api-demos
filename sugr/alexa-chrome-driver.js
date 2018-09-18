/**
 * Created by Jeromeyang on 2018/9/5.
 */

const {Builder, By, Key, until} = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const chromedriver = require('chromedriver')

chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build())


const URL_DEVICE_LIST = 'https://alexa.amazon.com/api/devices-v2/device'
const URL_NAME_LIST = 'https://alexa.amazon.com/api/namedLists'
const URL_CARDS = 'https://alexa.amazon.com/api/cards'
const URL_HISTORY = 'https://alexa.amazon.com/api/activities?startTime=&size=50&offset=-1'

let driver = null
let window = null
let chromeOptions = null


// 我们需要给出算法库的版本等等

function browserDriver() {

}

browserDriver.ap_email = null
browserDriver.ap_password = null

//需要返回 当前browers关闭状态,是否登录状态
browserDriver.openBrowser = async function (url, f) {

    if (driver != null) {
        return
    }

    _chromeOption = new chrome.Options()
    // _chromeOption.addArguments('--disable-gpu')
    _chromeOption.addArguments('--hide-scrollbars')
    _chromeOption.addArguments('blink-settings=imagesEnabled=false')

    _chromeOption.addArguments('–disable-javascript ')
    _chromeOption.addArguments('–disable-plugins')
    // _chromeOption.headless()
    driver = await new Builder().forBrowser('chrome')
        .setChromeOptions(_chromeOption)
        .build()
    chromeOptions = driver.chromeOptions

    window = driver.manage().window()
    window.maximize()

    try {
        await driver.get(url)
        f(3, null)
        console.log('openBrowser1  ')
        await driver.getCurrentUrl().then((realUrl) => {
            console.log('openBrowser1 : ' + realUrl)

            if (realUrl == url) {
                driver.sleep(2000).then(() => {
                    driver.quit()
                    driver = null
                    f(2, null)
                })
            }

            driver.sleep(3000)

            if (browserDriver.ap_email != null && browserDriver.ap_password != null){
                //自动填充亚马逊账号及自动登录
                driver.findElement(By.id('ap_email'))
                    .then((found) => {
                        found.sendKeys(browserDriver.ap_email)
                            .then(() => {
                                driver.findElement(By.id('ap_password'))
                                    .then((found) => {
                                        found.sendKeys(browserDriver.ap_password)
                                            .then(() => {
                                                driver.findElement(By.id('signInSubmit'))
                                                    .then((found) => {
                                                        found.click()
                                                        f(7,null)

                                                    })
                                            })
                                    })
                            })
                    },(reason) =>{
                      f(9,null)
                    })
            }


        })






        try{
            await driver.wait(until.titleIs('Please confirm your identity'),10000)
            f(8,null)
        }catch (E){

        }


        await driver.wait(until.titleIs('Amazon Alexa'))
        console.log('current title is Amazon alexa')
        // window.minimize()

        f(1, null)

        console.log('waiting start')
        f(4, null)
        // 获取当前在线的设备，并选择序列号
        // 获取当前序列号的itemId
        browserDriver.getNameList(function (_itemId) {

            console.log('TODO-LIST Id:' + _itemId)
            f(6,_itemId)
            browserDriver.getDeviceOnlineList(function (result) {
                f(5, result)

            })
        })



        await driver.wait(until.titleIs('xxxxxx'))
        console.log('waiting end')
    } catch (e) {
        console.log(e)
        driver.quit()
        driver = null
        f(2)
    } finally {
        // driver.quit()
    }
}

browserDriver.getDeviceOnlineList = async(f) => {
    browserDriver.getAlexaApi(URL_DEVICE_LIST,function (_body) {
        console.log(_body)
        let data = JSON.parse(_body)
        let devices = data.devices
        let _result = []

        // if (devices.length == 0){
        //     f(null)
        //     return
        // }

        devices.forEach(v => {

            if (v.online) {
                let serialNumber = v.serialNumber
                let accountName = v.accountName
                let deviceTypeFriendlyName = v.deviceTypeFriendlyName
                let online = v.online
                let result = {
                    serialNumber,
                    accountName,
                    deviceTypeFriendlyName,
                    online,
                }
                _result.push(result)
            }
        })
        f(_result)
    })
}

browserDriver.getNameList = async(f) => {
    browserDriver.getAlexaApi(URL_NAME_LIST,function (_body) {
        console.log(_body)
        let data = JSON.parse(_body)
        let lists = data.lists
        lists.forEach(v => {
            if (v.type == 'TO_DO') {
                f(v.itemId)
            }
        })
    })
}

browserDriver.getTODOList = async(listId,f) => {
    if (listId!=null){
        browserDriver.getAlexaApi(URL_NAME_LIST+'/'+listId+'/items',function (_body) {
            f(_body)
        })
    }
}

browserDriver.getCardList = async(f) => {
    browserDriver.getAlexaApi(URL_CARDS,function (_body) {
        f(_body)
    })
}

browserDriver.getHistory = async(f) => {
    browserDriver.getAlexaApi(URL_HISTORY,function (_body) {
        f(_body)
    })
}


browserDriver.getAlexaApi = async(url,f) => {
    await driver.get(url)
    let STR_READY_STATE = ''
    while (STR_READY_STATE != 'complete') {
        await driver.executeAsyncScript(
            function () {
                var callback = arguments[arguments.length - 1]
                callback(document.readyState)
            }
        ).then(function (str) {
            console.log('executeAsyncScript result:' + str)
            STR_READY_STATE = str
        })

        driver.sleep(500)
    }

    await driver.findElement(By.css('body')).then(function (found) {
        found.getText().then(function (_body) {
            // console.log(_body)
            f(_body)

        })
    })
}


module.exports = browserDriver