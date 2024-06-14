const express = require('express')
const app = express()
require('dotenv').config()
const http = require('http')
const server = http.createServer(app)
const path = require('path');
const PORT = process.env.PORT || 7889
const moment = require("moment")
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

const PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDJw7cDND5SPdnI\npUh2dRYH+U/hBQ3VtwE7sIyG6080pjpdyXiIyIRiQgnshJlo/LQtoMyMN6xs9o5I\nKv+NfJjMw5cNWwLz4kIWV19ETiotkXqV21xSNH748AOudp1sjGjWUG/NMPrWI3to\nlkY6WTLLGiM3kf9Yq8sKbxeodyAp+SJ5xJZbW0rqzep0jCk8ySrAF5wmvrtMMe3y\n8NMNijtGmhVrq+BXXyoRZr8JRfk8Y6FgpEbNLT30BOWR1i9VlAFFimLa9ECdOdyq\nfiVhb1RJf+SXmwQ0ohGk88rt1/TUunzS7wQmmC3dDP1MzFAbYSpQqCX3XyvZcvEq\no1yGeMgpAgMBAAECggEAK9Q4otkL+riV4SjKc3Ue2o+VgxeieDz/ZxSEimB+fbzo\na+wyo2APpfqbhkYNv0k56LmIBaOocKkkole42ObqmHyaiRuuqgUJ/ylut/tU3T4/\nh2M2DGN7+57D5fe9XdGoinnBt6y+qJrfmYofalhrGMSuRsmP0xbKjhMw6/coxQUH\ncrx35OqRDaHPkfFvksIzHVUuI0Z7fQgWE6FgHAUprIVc35RV7kOLwzAXTSZmTz3T\nqt5uijGe1yQe+V5m69k0krkuCPaz8IY8WQf9SBZISITZZS0lVo/1MzWhf+XjDGkF\ncTdxunR7pMSoc14av5WCZtIrPknYzAgcmD3s8gz4UwKBgQDkhoKzJoAMTo19CZD0\nFZ9mCCeVKsbrSwb4KiDsEZuDyotulrYgdIUwn1msafl8AsxREHMs8/0rCo44d5xE\nzbAo7tyx+n/MUrlXTCxhfvMvRyvZ/zXC79uPLqTm7nCRMpFfkQYmUzDric8K287T\ngDo6wiEMjlrt2KAiPUDm+q6dUwKBgQDiBZCC4RaV5nBKrmLx+Auo8d7BkyGP1fJl\nW8eJTxyxbiysqLh506FSYUkYv/D/a7RNYPCw92dQVWaiW8EytwAdNfJgmAKl8/zc\nBMWwbUcHOb8LZSDVWKPhcuK5tm0Zc9sX4GeRfDkbTMEKXarnDkkuweIGGS8gqvhl\ntWNx3oIZEwKBgE3w0oLnjqSj5f3PVXDqLwNNpLJrdIyreiUJuVDKcI/ydLuzC0rm\ncsaykpMLUdvJ2IWNZrrePGqBnyADK3kL7hkH3p2VIiE91ZjAkiJueeKWE462TE/A\nHtImxnc8u4fKB2rgu4g2t2ieB89cSJ46DaIcs8jkhH66c2M6IPimZwehAoGBANUz\n4olSwfdMlAgeT39oN7d50GJQ44vGiQxLcwF2+t3zy3hi/wEMPFR1KHqMNEz7z+xd\n0S1dcrs4k8P7QVcRgK4NQUEUowrgCFmSttghfKq4MhoRntMg9hWoRW5hQrCLtNPk\n/k0iHMw/rqiUiq3BsA7HHOobv3TVUdK/M7sp5Ra5AoGBALg8/GG/gJZqwNq7y6vF\nvYfFmB0Aqv57GFRmWifOSwu6PBmftyGmHfUEgO4WaKahGO35OUPD3zN/fKtXDNb6\nciMi590cxPvhVJl5oABDakC/eLpfmWKY3G3gIT1X84lmJFOqrxQVdV04Pv22IkLa\ne+IPKupgvwB4Uvmwnjqmg5Wf\n-----END PRIVATE KEY-----\n'
const CLIENT_EMAIL = 'service-account-sheet@aerobic-amphora-426309-d7.iam.gserviceaccount.com'
const SHEET_ID = '1g9-0xIWm3nASwvn4uquDR6AIRK_QMNVn31QlJ4CSCDo';

// app.get('/admin', (req, res) => { res.sendFile(__dirname + '/public/admin.html') })
app.get('/', (req, res) => { res.sendFile(__dirname + '/public/indexsv.html') })
app.get('/admin/4d611bf89d6950bafa4b37d80e7d108c2239030d', (req, res) => { res.sendFile(__dirname + '/public/admin.html') })

app.post('/attendance', async (req, res) => {
    let { location, username, locationMap, browser, screenConnect, language, operatingSystem, network } = req.body
    try {
        const ip = network.ip
        const networkInfo = `hostname: ${network.hostname}, region: ${network.region}, country: ${network.country}, loc: ${network.loc}, org: ${network.org}, timezone: ${network.timezone}`
        location = `${location.latitude}, ${location.longitude}`
        await setGoogleSheet(ip, username, location, locationMap, browser, screenConnect, language, operatingSystem, networkInfo)
        return res.status(201).json({ status: 1 })
    } catch (error) {
        res.status(201).json({ status: 0 })
        console.log(error)
        return
    }
})

app.get('/link', async (req, res) => {
    try {
        const link = await getLink()
        res.status(201).json({ status: 1, link: link || null })
    } catch (error) {
        res.status(201).json({ status: 0 })
        console.log(error)
        return
    }
})

app.get('/allData', async (req, res) => {
    try {
        const data = await getGoogleSheetData()
        res.status(200).json({ status: 1, data })
    } catch (error) {
        res.status(500).json({ status: 0 })
        console.log(error)
        return
    }
})

app.post('/editLink', async (req, res) => {
    try {
        const { linkNew } = req.body
        const update = updateCellB1(linkNew)
        if(update){
            return res.status(201).json({ status: 1 })
        }
        return res.status(500).json({ status: 0 })
    } catch (error) {
        res.status(201).json({ status: 0 })
        console.log(error)
        return
    }
})

const serviceAccountAuth = new JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function setGoogleSheet(ip, username, location, locationMap, browser, screenConnect, language, operatingSystem, networkInfo) {
    try {

        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        let currentDate = new Date();
        let formatedDate = moment(currentDate).format('YYYY-MM-DD HH:mm');
        console.log(`Title of the document: ${doc.title}`);

        const sheet = doc.sheetsByIndex[0];

        await sheet.addRow(
            {
                "Ngày": formatedDate,
                "IP": ip,
                "Tên": username,
                "Vị trí": location,
                "GG map": locationMap,
                "Thiết bị": browser,
                "Khung hình kết nối": screenConnect,
                "Ngôn ngữ": language,
                "SYS": operatingSystem,
                "Mạng": networkInfo,
            });

        console.log("OK")
    }
    catch (e) {
        console.log(e.message)
        console.log('Oops! Something wrongs, check logs console for detail ... ')
    }
}

async function getGoogleSheetData() {
    try {
        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        const rows = await sheet.getRows();
        let data = []
        rows.forEach(row => {
            data.push({
                date: row._rawData[0],
                name: row._rawData[1],
                ip: row._rawData[2],
                location: row._rawData[3],
                locationMap: row._rawData[4],
                drive: row._rawData[5],
                screen: row._rawData[6],
                language: row._rawData[7],
                sys: row._rawData[8],
                network: row._rawData[9],
            })
        });

        return data;
    }
    catch (e) {
        console.error('Error:', e.message);
    }
}

async function getLink() {
    try {
        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[1];
        await sheet.loadCells('A1:B2')
        const cellB1 = sheet.getCell(0, 1);
        return cellB1.value
    }
    catch (e) {
        console.log(e.message)
    }
}

async function updateCellB1(newValue) {
    try {
        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[1];
        await sheet.loadCells('A1:B2');
        const cellB1 = sheet.getCell(0, 1);
        cellB1.value = newValue;
        await sheet.saveUpdatedCells();
        return 1
    } catch (e) {
        console.log(e.message);
        console.log('Oops! Something wrongs, check logs console for detail ... ');
        return 0
    }
}

server.listen(PORT, () => { console.log(`Server is running on http://localhost:${PORT}`) })
