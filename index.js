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
    let pid0 = {}
    let pidOther = {}
    let uniqueAddresses = {pid0, pidOther};
    let totalSupply = await ContractCGT.methods.totalSupply().call();
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

        if (row.returnValues.pid === "0") {
            console.log(user);
            uniqueAddresses.pid0[user] = {deposit: amount}
            continue
        }


        if (typeof uniqueAddresses.pidOther[user] === "undefined") {
            uniqueAddresses.pidOther[user] = {deposit: amount};
        } else {
            uniqueAddresses.pidOther[user].deposit += amount;
        }

    }

//______________________________________________________________//
    // for (let row of eventsharvestedTokens) {
    //     const user = row.returnValues.user.toLowerCase();
    //     const amount = parseInt(row.returnValues.amount);
    //
    //     if (row.returnValues.pid === "0") console.log(user);
    //     if (row.returnValues.pid === "0") continue;
    //
    //     if (typeof uniqueAddresses[user] === "undefined") {
    //         uniqueAddresses[user] = {harvestedTokens: amount};
    //     } else {
    //         uniqueAddresses[user].harvestedTokens += amount;
    //     }
    // }
    //
    // ______________________________________________________________//


    for (const user of Object.keys(uniqueAddresses.pidOther)) {

        uniqueAddresses.pidOther[user].pending1 = Number(await ContractChef.methods.pendingSushi(1, user).call());
        uniqueAddresses.pidOther[user].pending2 = Number(await ContractChef.methods.pendingSushi(2, user).call());
        uniqueAddresses.pidOther[user].pending3 = Number(await ContractChef.methods.pendingSushi(3, user).call());
    }


    for (const user of Object.keys(uniqueAddresses.pid0)) {

        uniqueAddresses.pid0[user].pending0 = Number(await ContractChef.methods.pendingSushi(0, user).call());

    }


    for (let user of Object.keys(uniqueAddresses.pidOther)) {
        let transaction = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${user}&startblock=0&endblock=999999999&sort=asc&apikey=B37NC728AS31WBW26RN9PMR2WTUS22P66F`)
        uniqueAddresses.pidOther[user].harvestedTokens = 0
        for (let i = 0; i < transaction.data.result.length; i++) {
            if (transaction.data.result[i].from === "0xe8Cc9f640C55f3c5905FD2BBb63C53fb8A3A527d".toLowerCase()) {
                uniqueAddresses.pidOther[user].harvestedTokens += Number(transaction.data.result[i].value)
            }
        }
        console.log(user + ':' + uniqueAddresses.pidOther[user].harvestedTokens)
    }

    for (let user of Object.keys(uniqueAddresses.pid0)) {
        let transaction = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${user}&startblock=0&endblock=999999999&sort=asc&apikey=B37NC728AS31WBW26RN9PMR2WTUS22P66F`)
        uniqueAddresses.pid0[user].harvestedTokens = 0
        for (let i = 0; i < transaction.data.result.length; i++) {
            if (transaction.data.result[i].from === "0xe8Cc9f640C55f3c5905FD2BBb63C53fb8A3A527d".toLowerCase()) {
                uniqueAddresses.pid0[user].harvestedTokens += Number(transaction.data.result[i].value)
            }
        }
        console.log(user + ':' + uniqueAddresses.pid0[user].harvestedTokens)
    }

    for (let user of Object.keys(uniqueAddresses.pidOther)) {

        uniqueAddresses.pidOther[user].userTokens = uniqueAddresses.pidOther[user].harvestedTokens +
            (Number(uniqueAddresses.pidOther[user].pending1)
                + Number(uniqueAddresses.pidOther[user].pending2)
                + Number(uniqueAddresses.pidOther[user].pending3))
    }

    for (let user of Object.keys(uniqueAddresses.pid0)) {
        uniqueAddresses.pid0[user].userTokens = uniqueAddresses.pid0[user].harvestedTokens + Number(uniqueAddresses.pid0[user].pending0)
    }

    for (let user of Object.keys(uniqueAddresses.pidOther)) {

        uniqueAddresses.pidOther[user].DUMMYpart = uniqueAddresses.pidOther[user].userTokens / totalSupply

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
