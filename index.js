const Web3 = require('web3');
const fs = require('fs');
const axios = require('axios')
require('dotenv').config();


const MasterChef = require('./MasterChefAbi.json');
const CGT = require('./CGTabi.json');


const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));

const ContractChef = new web3.eth.Contract(MasterChef, '0xe8Cc9f640C55f3c5905FD2BBb63C53fb8A3A527d');
const ContractCGT = new web3.eth.Contract(CGT, '0xf56b164efd3cfc02ba739b719b6526a6fa1ca32a');


(async () => {

    let uniqueAddresses = {};
    let eventsDeposit = await ContractChef.getPastEvents("Deposit", {
        fromBlock: 0,
        toBlock: 'latest'
    });
    let eventsWithdraw = await ContractChef.getPastEvents("Withdraw", {
        fromBlock: 0,
        toBlock: 'latest'
    });
    let eventsTransfer = await ContractCGT.getPastEvents("Transfer", {
        fromBlock: 0,
        toBlock: 'latest'
    });

    let eventsAll = await ContractChef.getPastEvents('allEvents', {
        fromBlock: 0,
        toBlock: 'latest'
    })

    for (let row of eventsDeposit) {
        let user = row.returnValues.user.toLowerCase();

        let amount = parseInt(row.returnValues.amount);

        if (row.returnValues.pid === "0") console.log(user);
        if (row.returnValues.pid === "0") {
            continue;
        }

        if (typeof uniqueAddresses[user] === "undefined") {
            uniqueAddresses[user] = {deposit: amount};
        } else {
            uniqueAddresses[user].deposit += amount;
        }

    }


    // for (let row of eventsWithdraw) {
    //     const user = row.returnValues.user.toLowerCase();
    //     const amount = parseInt(row.returnValues.amount);
    //
    //     if (row.returnValues.pid === "0") console.log(user);
    //     if (row.returnValues.pid === "0") continue;
    //
    //     if (typeof uniqueAddresses[user] === "undefined") {
    //         uniqueAddresses[user] = {withdraw: amount};
    //     } else {
    //         uniqueAddresses[user].withdraw += amount;
    //     }
    // }


    for (const user of Object.keys(uniqueAddresses)) {

        uniqueAddresses[user].pending0 = await ContractChef.methods.pendingSushi(0, user).call();
        uniqueAddresses[user].pending1 = await ContractChef.methods.pendingSushi(1, user).call();
        uniqueAddresses[user].pending2 = await ContractChef.methods.pendingSushi(2, user).call();
        uniqueAddresses[user].pending3 = await ContractChef.methods.pendingSushi(3, user).call();
    }

    for (let user of Object.keys(uniqueAddresses)) {
        let transaction = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${user}&startblock=0&endblock=999999999&sort=asc&apikey=B37NC728AS31WBW26RN9PMR2WTUS22P66F`)
        uniqueAddresses[user].withdraw = 0
        for (let i = 0; i < transaction.data.result.length; i++) {
            if (transaction.data.result[i].from == "0xe8Cc9f640C55f3c5905FD2BBb63C53fb8A3A527d".toLowerCase()) {
                 uniqueAddresses[user].withdraw += Number(transaction.data.result[i].value)
            }
        }
        //
        // uniqueAddresses[user].withdraw = Number(value);
         console.log(user + ':' + uniqueAddresses[user].withdraw)

    }


    //console.log(uniqueAddresses);

    // fs.writeFile('./logs/cgtAllEvents.json', JSON.stringify(eventsAll), function (err) {
    //     if (err) {
    //         console.log(err);
    //     }
    // });

    // fs.writeFile('./logs/cgtTrans.json', JSON.stringify(eventsTransfer), function (err) {
    //     if (err) {
    //         console.log(err);
    //     }
    // });
    //
    // fs.writeFile('./logs/cgtDeposit.json', JSON.stringify(eventsDeposit), function (err) {
    //     if (err) {
    //         console.log(err);
    //     }
    // });
    //
    // fs.writeFile('./logs/CGTwithdraw.json', JSON.stringify(eventsWithdraw), function (err) {
    //     if (err) {
    //         console.log(err);
    //     }
    // });
    //
    fs.writeFile('./logs/CGTpending.json', JSON.stringify(uniqueAddresses), function (err) {
        if (err) {
            console.log(err);
        }
    });

})()
