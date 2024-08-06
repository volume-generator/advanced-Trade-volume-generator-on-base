
# Advanced High Speed Volume generation bot on Base Chain with MultiWallet Support- SolSpec 
![](https://cdn.loom.com/sessions/thumbnails/e80f8976a8f2481890d3d47f88aea193-1719473126529-with-play.gif)


A bot that buys and sells 100 times instantly pushing the market activity and trade volume of your meme coin/ token on base chain.
The coin using must be on uniswapv2 router. 

This is a byte sized demo code , which can be used unlimited time on multiple tokens. only supports Base Chain.

## Not Tech Savvy? 

No problem. 
Visit our website https://volume.li

-  Connect Your wallet
-  Copy and past your Token address.  eg (0xAdsc...asda)
- Enter the amount you want to trade. eg 0.0001 (ETH)
- Click on Start trade

After Successful trade you will recieve a transaction url. if trade fails, amount will be reverted back minus gas fee.


## Installation guide

## First clone the repository

```javascript

git clone https://github.com/solspec-dev/advanced-Trade-volume-generator-on-base .
```

## Install dependencies
```javascript
npm install
```
to start the bot
first do

use "yarn"
or
use "npm install"


then add the details in config file and save the details.

{
  "operatorPrivateKey": "privatekey_of_funding_wallet_required",
  "tokenAddress": "you_can_set_token_address_here__optional",  
  "v2router" : "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",  
  "executionCount": 100,
  "rpcUrl": "https://mainnet.base.org/",  
  "wethAddress": "0x4200000000000000000000000000000000000006"  
}

only add private key to start the bot.
if you need to , you can add the token address here.
else the program will create new config file for your token
rest of details dont change

finally 
do 

"yarn start"
or 
"npm run start"
## FAQ

#### How to verify if the trade is executed or not?

Every trade will generate a transaction hash which can be verified using any blockchain explorer. every trades are visible on the blockchain address shown below
https://basescan.org/address/0xb657fa9443a2db2990d45e93ebd8152c2b2beb12

#### By using this script will my private key be exposed to public?

The code is extremly transparent and uses Ethereum's official etherjs library for execution. the private key added will not be exposed by running this bot. 
Here are some steps to make sure your keys are safe. always use a newly generated wallet to do test. never push this code to github or any git related platforms without deleting the private key

#### Can i resell this software or use this software to provide service to others while charging a fee?

The code is open source. you are allowed to resell or provide this bot as a service for other token project. Must not change or remove the proxy trade contract address.

#### Is this a Complete Software? Whats the catch here?

This is a demo version with unlimited execution of trades.
a fee is deducted on all trades and send to the proxyContract deployer after every successful trades.


## Demo

Standalone-basebot-demo
Screen recording
https://www.loom.com/share/8b401784b8b14726b2ac1d105ce1b285?sid=4849a2bd-bc87-4bfe-a65b-39e1d1e9b5a9

Dexscreener
https://www.loom.com/share/c02bc96be14443a7b3d018fc352c8190?sid=4aa1646c-2b20-4c79-832c-4a8d58b26f90

Base scan

https://basescan.org/tx/0xec33336c188054661d9ba8932cc41df43d86aeee8612466d1c427d4a574abd01
https://basescan.org/tx/0xea27a9f31f9dd30a0a8b886c6faf2728ea6f2dd264dc3884d2fae580009e95c6
https://basescan.org/tx/0xfc2a15251c1464f5de875d878e1d8d83eec18182cc799ebde7dd69d858b842f9
https://basescan.org/tx/0xad2ce9362a75523366442b00e85f38ce6a7e46cdfeea1a61fd61c5db7e25f685


## Support

For support, email support@volume.li or contact https://t.me/solapriv
