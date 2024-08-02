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

