import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from 'react-router';
import { createChart } from 'lightweight-charts';

// https://finnhub.io/docs/api/websocket-trades
// https://finnhub.io/docs/api/quote
// https://www.unixtimestamp.com/

const StockPage = () => {
    const { ticker } = useParams()
    const chartContainer = useRef(null)
    const priceContainer = useRef(null)
    const [profile, setProfile] = useState({})
    // const [pastData, setPastData] = useState([])
    // const [series, setSeries] = useState(null);
    // const [socket, setSocket] = useState(null);

    let lineSeries, priceSocket, pastData, prevClose;
    const currencyFormatter = (num) => Number(num).toFixed(2)

    const initialize = async () => {
        // identify placement of chart in DOM
        let container = chartContainer.current

        // create chart 
        let chart = createChart(container, {
            width: 700,
            height: 300,
            layout: {
                backgroundColor: '#ffffff',
                textColor: 'green',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            localization: {
                dateFormat: 'MM/dd/yy',
                locale: 'en-US',
            },
            priceScale: {
                position: 'right',
                autoScale: true,
                invertScale: false,
                alignLabels: true,
                borderVisible: false,
                borderColor: 'rgba(197, 203, 206, 0.8)',
                scaleMargins: {
                    top: 0.3,
                    bottom: 0.4,
                },
            },
            timeScale: {
                rightOffset: 3,
                barSpacing: 3,
                fixLeftEdge: true,
                lockVisibleTimeRangeOnResize: true,
                rightBarStaysOnScroll: true,
                borderVisible: false,
                borderColor: '#fff000',
                visible: false,
                timeVisible: true,
            },
            crosshair: {
                vertLine: {
                    color: '#222b37',
                    width: 0.5,
                    style: 0,
                    visible: true,
                    labelVisible: true,
                },
                horzLine: {
                    color: '#6A5ACD',
                    width: 0.5,
                    style: 0,
                    visible: false,
                    labelVisible: true,
                },
                mode: 1,
            },
        });

        // add line-series or area type to initial chart || https://www.cssscript.com/financial-chart/
        lineSeries = chart.addAreaSeries({
            topColor: '#e5f9e6',
            bottomColor: '#f5f8fa',
            lineColor: '#40c802',
            lineStyle: 0,
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 3,
        });
    }
    

    // grab historical chart data (1min) || API: https://www.alphavantage.co/documentation/
    const fetchHistoricalData = async (series) => {
        // Alpha Vantage API KEY: 09CXQ7G0M8U90O13
        let key = '09CXQ7G0M8U90O13'
        let response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=1min&outputsize=full&apikey=${key}`)
        if (response.ok) {
            let data = await response.json()
            let seriesData = data['Time Series (1min)'] 
            console.log(seriesData)
            let historical = []
            for (let key in seriesData){
                let datetime = new Date(key).getTime()/1000; // convert to unix timestamp for lwChart
                let price = Number(seriesData[key]['4. close']) // grab close price, convert to num data type
                historical.push({'time':datetime, 'value':price }) // add new data point obj to historical array
            }
            let last360 = historical.slice(0, 360)
            prevClose = last360[0]['value']
            pastData = last360.reverse(); // historical data is sent most recent first... so need to reverse the order
            series.setData(pastData)
        }
    }

    // async function to fetch company profile info from Finnhub
    const fetchCompanyProfile = async() => {
        let response = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=c27ut2aad3ic393ffql0`, { json: true })
        if(response.ok){
            let profileData = await response.json()
            setProfile(profileData)
        }
    }

    // async function to fetch company stock price data from Finnhub
    const mountSocket = (series) => {

        // create websocket connection to finnhub using my API key
        priceSocket = new WebSocket('wss://ws.finnhub.io?token=c27ut2aad3ic393ffql0');
        // await setSocket(priceSocket)
        console.log('init set socket')

        // Connection opened -> Subscribe
        priceSocket.addEventListener('open', function (event) {
            priceSocket.send(JSON.stringify({ 'type': 'subscribe', 'symbol': ticker }))
            console.log(`priceSocket opened for ${ticker}!`)
        });

        let lastTime = null;
        // Listen for messages; only allow update when next time >> last time
        priceSocket.addEventListener('message', function (event) {
            let data = JSON.parse(event.data).data
            if(data){
                let time = data[data.length-1]['t']/1000; // unix timestamp in ms, convert to secs by dividing by 1000
                let price = data[data.length-1]['p'];
                if(lastTime === null){ // if first data point, set 'lastTime' to the first instance
                    lastTime = time
                    let newPricePoint = { 'time': time, 'value': price }
                    let displayPrice = '$' + currencyFormatter(newPricePoint['value'])
                    priceContainer.current.innerHTML = displayPrice;
                    series.update(newPricePoint);
                    console.log('FIRST', time)
                } else if (lastTime < time){ // otherwise, check that new time is greater than last time to avoid errors
                    lastTime = time
                    let newPricePoint = {'time':time, 'value':price}      
                    let displayPrice = '$' + currencyFormatter(newPricePoint['value'])
                    priceContainer.current.innerHTML = displayPrice;
                    series.update(newPricePoint);
                    console.log('UPDATED', time)
                } 
            }
        });
    }

    // Unsubscribe from price websocket and close
    const unmountSocket = (socket) => {
        if(socket){
            socket.send(JSON.stringify({ 'type': 'unsubscribe', 'symbol': ticker }))
            socket.close()
        }
    }

    // load pre-req async functions in order first
    const loadSeries = async() => {
        await initialize()
        await fetchHistoricalData(lineSeries)
        await fetchCompanyProfile()
    }

    // then create final load function to load initial series data, then establish the websocket connection
    const load = async() => {
        await loadSeries()
        mountSocket(lineSeries)
    }

    // run all functions on load in correct order via useEffect
    useEffect(() => {
        load()
        return () => unmountSocket(priceSocket)
    }, [])
    
    return (
        <div className='stock-page-container'>
            <div className="stock-chart">
                <h1 className='min-margin'>{profile.name}</h1>
                <h3 className='min-margin' ref={priceContainer}>...loading</h3>
                <div ref={chartContainer}></div>
            </div>
            <div className="profile-info-container">
                <div style={{ 'width': '95%' }}>
                    <div className='grey-underline'>
                        <h2 className=''> About</h2>
                    </div>
                    <div className='info-container'>
                        <div className='flex-container-stack'>
                            <img alt='profile-logo' className='profile-logo' src={profile.logo}></img>
                        </div>
                        <div className='flex-container-stack'>
                            <h4 className='min-margin'>Mkt Cap</h4>
                            <p>{Number(profile.marketCapitalization / 1000).toFixed(2)}B</p>
                        </div>
                        <div className='flex-container-stack min-margin'>
                            <h4 className='min-margin'>Website</h4>
                            <a href={profile.weburl}>Website Link</a>
                        </div>
                        <div className='flex-container-stack min-margin'>
                            <h4 className='min-margin'>Industry</h4>
                            <p>{profile.finnhubIndustry}</p>
                        </div>
                    </div>
                </div>
                <div style={{'width':'95%'}}>
                    <div style={{'paddingTop':'50px'}} className='grey-underline'>
                        <h2 className=''> Key Statistics (TBD)</h2>
                    </div>
                    <div className='info-container'>
                        <div className='flex-container-stack'>
                            <h4 className='min-margin'>stat</h4>
                            <p>--</p>
                        </div>
                        <div className='flex-container-stack'>
                            <h4 className='min-margin'>stat</h4>
                            <p>--</p>
                        </div>
                        <div className='flex-container-stack min-margin'>
                            <h4 className='min-margin'>stat</h4>
                            <p>--</p>
                        </div>
                        <div className='flex-container-stack min-margin'>
                            <h4 className='min-margin'>stat</h4>
                            <p>--</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="stock-order flex-container">
                <h3>Order Form</h3>
            </div>
        </div>
    )
}

export default StockPage;


// SAMPLE COMPANY PROFILE RESPONSE OBJ
// {
//     "country": "US",
//         "currency": "USD",
//             "exchange": "NASDAQ/NMS (GLOBAL MARKET)",
//                 "ipo": "1980-12-12",
//                     "marketCapitalization": 1415993,
//                         "name": "Apple Inc",
//                             "phone": "14089961010",
//                                 "shareOutstanding": 4375.47998046875,
//                                     "ticker": "AAPL",
//                                         "weburl": "https://www.apple.com/",
//                                             "logo": "https://static.finnhub.io/logo/87cb30d8-80df-11ea-8951-00000000092a.png",
//                                                 "finnhubIndustry": "Technology"
// }

// SAMPLE SOCKET RESPONSE DATA
// { "data": [{ "p": 7296.89, "s": "BINANCE:BTCUSDT", "t": 1575526691134, "v": 0.011467 }], "type": "trade" }

// SAMPLE CHART SEED DATA
// const sampleSeedData = [
//     { time: 1556877600, value: 230.12 },
//     { time: 1556881200, value: 230.24 },
//     { time: 1556884800, value: 230.63 },
//     { time: 1556888400, value: 231.35 },
//     { time: 1556892000, value: 232.24 },
//     { time: 1556895600, value: 232.52 },
//     { time: 1557126000, value: 228.71 },
//     { time: 1557129600, value: 228.88 },
//     { time: 1557133200, value: 228.18 },
//     { time: 1557136800, value: 228.89 },
//     { time: 1557140400, value: 229.05 },
// ]