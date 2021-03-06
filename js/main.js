
log('0xBitcoin Stats v0.0.3');

var stats_updated_count = 0;
const _BLOCKS_PER_READJUSTMENT = 1024;
const _CONTRACT_ADDRESS = "0xB6eD7644C69416d67B522e20bC294A9a9B405B31";
const _MAXIMUM_TARGET_STR = "27606985387162255149739023449108101809804435888681546220650096895197184";

if (typeof window.web3 !== 'undefined' && typeof window.web3.currentProvider !== 'undefined') {
  var eth = new Eth(window.web3.currentProvider);
} else {
  var eth = new Eth(new Eth.HttpProvider("https://mainnet.infura.io/MnFOXCPE2oOhWpOCyEBT"));
  log("warning: no web3 provider found, using infura.io as backup provider")
}

const token = eth.contract(tokenABI).at(_CONTRACT_ADDRESS);

el('#statistics').innerHTML = '';

stats = [
  /*Description                     promise which retuns, or null         units         multiplier  null: filled in later*/
  //['',                              null,                                 "",           1,          null     ], /* mining difficulty */
  ['Mining Difficulty',             token.getMiningDifficulty,            "",           1,          null     ], /* mining difficulty */
  ['Estimated Hashrate',            null,                                 "Mh/s",       1,          null     ], /* mining difficulty */
  ['Rewards Until Readjustment',    null,                                 "",           1,          null     ], /* mining difficulty */
  ['Current Average Reward Time',   null,                                 "minutes",    1,          null     ], /* mining difficulty */
  ['Last Difficulty Start Block',   token.latestDifficultyPeriodStarted,  "",           1,          null     ], /* mining difficulty */
  ['Tokens Minted',                 token.tokensMinted,                   "0xBTC",      0.00000001, null     ], /* supply */
  ['Max Supply for Current Era',    token.maxSupplyForEra,                "0xBTC",      0.00000001, null     ], /* mining */
  ['Supply Remaining in Era',       null,                                 "0xBTC",      0.00000001, null     ], /* mining */
  ['Last Eth Reward Block',         token.lastRewardEthBlockNumber,       "",           1,          null     ], /* mining */
  ['Last Eth Block',                eth.blockNumber,                      "",           1,          null     ], /* mining */
  ['Current Reward Era',            token.rewardEra,                      "/ 39",       1,          null     ], /* mining */
  ['Current Mining Reward',         token.getMiningReward,                "0xBTC",      0.00000001, null     ], /* mining */
  ['Epoch Count',                   token.epochCount,                     "",           1,          null     ], /* mining */
  ['Total Supply',                  token.totalSupply,                    "0xBTC",      0.00000001, null     ], /* supply */
  ['',                              null,                                 "",           1,          null     ], /* */
  ['Token Holders',                 null,                                 "holders",    1,          null     ], /* usage */
  ['Token Transfers',               null,                                 "transfers",  1,          null     ], /* usage */
  ['Total Contract Operations',     null,                                 "txs",        1,          null     ], /* usage */
  //['',                              null,                                 "0xBTC",      0.00000001, null     ], /* */
  //['TokenMiningPool.com Hashrate',  null,                                 "Mh/s",       1,          null     ], /* pool */
  //['0xBrute.com Hashrate',          null,                                 "Mh/s",       1,          null     ], /* pool */
  //['0xPool.io Hashrate',            null,                                 "Mh/s",       1,          null     ], /* pool */
  //['gpu.PiZzA Hashrate',            null,                                 "Mh/s",       1,          null     ], /* pool */
  //['0xBTCpool.com Hashrate',        null,                                 "Mh/s",       1,          null     ], /* pool */
];

function toReadableHashrate(hashrate, should_add_b_tags) {
  units = ['H/s', 'Kh/s', 'Mh/s', 'Gh/s', 'Th/s', 'Ph/s'];
  var final_unit = 'Eh/s';
  for(idx in units) {
    var unit = units[idx];
    if(hashrate < 1000) {
      final_unit = unit;
      break;
    } else {
      hashrate /= 1000;
    }
  }
  var hashrate_string = hashrate.toFixed(2);
  if(should_add_b_tags) {
    hashrate_string = '<b>' + hashrate_string + '</b>';
  }
  return hashrate_string + ' ' + final_unit;
}

function getValueFromStats(name, stats) {
  value = null
  stats.forEach(function(stat){
    if (stat[0] === name) {
      value = stat[4];
    }})
  return value
}

function setValueInStats(name, value, stats) {
  stats.forEach(function(stat){
    if (stat[0] === name) {
      stat[4] = value;
      return;
    }});
}

function updateStatsThatHaveDependencies(stats) {
  /* estimated hashrate */
  difficulty = getValueFromStats('Mining Difficulty', stats)
  hashrate = difficulty * 2**22 / 600
  hashrate /= 1000000000
  el('#EstimatedHashrate').innerHTML = "<b>" + hashrate.toFixed(2) + "</b> Gh/s";

  /* supply remaining in era */
  max_supply_for_era = getValueFromStats('Max Supply for Current Era', stats)
  current_supply = getValueFromStats('Tokens Minted', stats)
  current_reward = getValueFromStats('Current Mining Reward', stats)
  supply_remaining_in_era = max_supply_for_era - current_supply; /* TODO: probably need to round to current mining reward */
  rewards_blocks_remaining_in_era = supply_remaining_in_era / current_reward;
  el('#SupplyRemaininginEra').innerHTML = "<b>" + supply_remaining_in_era.toLocaleString() + "</b> 0xBTC <span>(" + rewards_blocks_remaining_in_era + " blocks)</span>";

  /* rewards until next readjustment */
  epoch_count = getValueFromStats('Epoch Count', stats)
  rewards_since_readjustment = epoch_count % _BLOCKS_PER_READJUSTMENT
  rewards_left = _BLOCKS_PER_READJUSTMENT - rewards_since_readjustment
  el('#RewardsUntilReadjustment').innerHTML = "<b>" + rewards_left.toString(10) + "</b>";

  /* time per reward block */
  current_eth_block = getValueFromStats('Last Eth Block', stats)
  difficulty_start_eth_block = getValueFromStats('Last Difficulty Start Block', stats)

  /* time calculated using 15-second eth blocks */
  seconds_since_readjustment = (current_eth_block - difficulty_start_eth_block) * 15

  seconds_per_reward = seconds_since_readjustment / rewards_since_readjustment;
  minutes_per_reward = (seconds_per_reward / 60).toFixed(2)
  el('#CurrentAverageRewardTime').innerHTML = "<b>" + minutes_per_reward + "</b> minutes";

  /* estimated hashrate */
  difficulty = getValueFromStats('Mining Difficulty', stats)
  hashrate = difficulty * 2**22 / 600
  /* use current reward rate in hashrate calculation */
  hashrate *= (10 / minutes_per_reward)
  setValueInStats('Estimated Hashrate', hashrate, stats);
  el('#EstimatedHashrate').innerHTML = toReadableHashrate(hashrate, true);
}

function updateLastUpdatedTime() {
  var time = new Date();
  current_time = time.toLocaleTimeString();
  el('#LastUpdatedTime').innerHTML = current_time;
}

function updateThirdPartyAPIs() {
  /* ethplorer token info */
  $.getJSON('https://api.ethplorer.io/getTokenInfo/0xb6ed7644c69416d67b522e20bc294a9a9b405b31?apiKey=freekey',
    function(data) {
      el('#TokenHolders').innerHTML = "<b>" + data["holdersCount"] + "</b> holders";
      el('#TokenTransfers').innerHTML = "<b>" + data["transfersCount"] + "</b> transfers";
  });
  /* ethplorer contract address info */
  $.getJSON('https://api.ethplorer.io/getAddressInfo/0xb6ed7644c69416d67b522e20bc294a9a9b405b31?apiKey=freekey',
    function(data) {
      el('#TotalContractOperations').innerHTML = "<b>" + data["countTxs"] + "</b> txs";
  });
}

async function updateDifficultyGraph(eth, stats){
  /*
  note: this is implementation of diff. in contract:
      function getMiningDifficulty() public constant returns (uint)
        return _MAXIMUM_TARGET.div(miningTarget);
  */
  var contract = '0xB6eD7644C69416d67B522e20bC294A9a9B405B31';
  var maxBlocks = 5000;
  var previous = 0;
  var current_eth_block = getValueFromStats('Last Eth Block', stats);

  var max_target = new Eth.BN(_MAXIMUM_TARGET_STR, 10);

  var a = await eth.getStorageAt('0xB6eD7644C69416d67B522e20bC294A9a9B405B31', new Eth.BN('20', 10), 'latest');
  var b = await eth.getStorageAt('0xB6eD7644C69416d67B522e20bC294A9a9B405B31', new Eth.BN('20', 10), 'earliest')
  console.log(a, b);

  return;

  for (var i = 1; i < maxBlocks; i++) { /* Be careful: we go *back* in time */
      eth.getStorageAt(contract, 2, current_eth_block-i)
      .then((result) => {
        if (result != previous) {
            /* TODO Where to find msg.sender? We probably have to loop
             * over the transactions in the block can call
             * eth.getTransaction */
            //blockDate = new Date(eth.getBlock(current_eth_block-i+1).timestamp*1000);
            console.log("Block #" + (current_eth_block-i+1) +  " (" + " "
                +  ") : " + previous);
            /* What if there are two changes in a single block? The
             * documentation of getStorageAt seems silent about that */
            previous = result;
        }
      }).catch((error) => {
        log('error reading block storage:', error);
      })
  }
  //blockDate = new Date(eth.getBlock(current_eth_block-maxBlocks).timestamp*1000);
  console.log("Somewhere before block #" +(current_eth_block-maxBlocks) +  " (block of "
          +  ") : " + previous);
}

/* TODO use hours_into_past */
function updateAllMinerInfo(eth, stats, hours_into_past){

  var known_miners = {
    "0xf3243babf74ead828ac656877137df705868fd66" : [ "Token Mining Pool", "http://TokenMiningPool.com", "#FFCC80" ],
    "0x53ce57325c126145de454719b4931600a0bd6fc4" : [ "0xPool",            "http://0xPool.io",           "#B388FF" ],
    "0x98b155d9a42791ce475acc336ae348a72b2e8714" : [ "0xBTCpool",         "http://0xBTCpool.com",       "#A7FFEB" ],
    "0x363b5534fb8b5f615583c7329c9ca8ce6edaf6e6" : [ "mike.rs pool",      "http://mike.rs:3000",        "#CCFF90" ],
    "0x6917035f1deecc51fa475be4a2dc5528b92fd6b0" : [ "PiZzA pool",        "http://gpu.PiZzA",           "#FFEE58" ],
    "0x693d59285fefbd6e7be1b87be959eade2a4bf099" : [ "PiZzA pool",        "http://gpu.PiZzA",           "#FFEE58" ],
    "0x697f698dd492d71734bcaec77fd5065fa7a95a63" : [ "PiZzA pool",        "http://gpu.PiZzA",           "#FFEE58" ],
    "0x69ebd94944f0dba3e9416c609fbbe437b45d91ab" : [ "PiZzA pool",        "http://gpu.PiZzA",           "#FFEE58" ],
    "0x69b85604799d16d938835852e497866a7b280323" : [ "PiZzA pool",        "http://gpu.PiZzA",           "#FFEE58" ],
    "0x69ded73bd88a72bd9d9ddfce228eadd05601edd7" : [ "PiZzA pool",        "http://gpu.PiZzA",           "#FFEE58" ],
  }

  var last_reward_eth_block = getValueFromStats('Last Eth Reward Block', stats)
  var current_eth_block = getValueFromStats('Last Eth Block', stats)
  var estimated_network_hashrate = getValueFromStats('Estimated Hashrate', stats)
  var last_difficulty_start_block = getValueFromStats('Last Difficulty Start Block', stats)

  //var num_eth_blocks_to_search = hours_into_past * 60 * 60 / 15;
  var num_eth_blocks_to_search = last_reward_eth_block - last_difficulty_start_block;
  log("searching last", num_eth_blocks_to_search, "blocks");

  /* get all mint() transactions in the last N blocks */
  /* more info: https://github.com/ethjs/ethjs/blob/master/docs/user-guide.md#ethgetlogs */
  eth.getLogs({
    fromBlock: last_reward_eth_block - num_eth_blocks_to_search,
    toBlock: last_reward_eth_block,
    address: '0xB6eD7644C69416d67B522e20bC294A9a9B405B31',
    topics: ['0xcf6fbb9dcea7d07263ab4f5c3a92f53af33dffc421d9d121e1c74b307e68189d', null],
  })
  .then((result) => {
    /* array of all miner addresses */
    var miner_list = [];
    /* array of arrays of type [eth_block, txhash, miner_addr] */
    var mined_blocks = [];
    /* dict where key=miner_addr and value=total_mined_block_count */
    var miner_block_count = {};
    /* total number of blocks mined in this filter */
    var total_block_count = result.length;

    log("got filter results:", total_block_count, "transactions");

    result.forEach(function(transaction){
      function getMinerAddressFromTopic(address_from_topic) {
        return '0x' + address_from_topic.substr(26, 41);
      }
      var tx_hash = transaction['transactionHash'];
      var block_number = parseInt(transaction['blockNumber'].toString());
      var miner_address = getMinerAddressFromTopic(transaction['topics'][1].toString());

      // log('tx_hash=', tx_hash);
      // log('  block=', block_number);
      // log('  miner=', miner_address)

      if(!miner_list.includes(miner_address)){
        miner_list.push(miner_address);
      }

      mined_blocks.push([block_number, tx_hash, miner_address])

      if(miner_block_count[miner_address] === undefined) {
        miner_block_count[miner_address] = 1;
      } else {
        miner_block_count[miner_address] += 1;
      }
    });

    log("processed blocks:",
      Object.keys(miner_block_count).length,
      "unique miners");

    /* we will eventually show newest blocks first, so reverse the list */
    mined_blocks.reverse();

    /* collapse miner_block_count using known_miners who have multiple
       address into a single address */
    for(var m1 in miner_block_count) {
      for(var m2 in miner_block_count) {
        if(m1 === m2) {
          continue;
        }
        if(known_miners[m1] !== undefined
           && known_miners[m2] !== undefined
           && known_miners[m1][0] == known_miners[m2][0]) {
          miner_block_count[m1] += miner_block_count[m2];
          miner_block_count[m2] = 0;
        }
      }
    }

    /* delete miners with zero blocks (due to collapse op above) */
    Object.keys(miner_block_count).forEach((miner_addr) => {
      if(miner_block_count[miner_addr] == 0) {
        delete miner_block_count[miner_addr]
      }
    });

    /* create sorted list of miners */
    sorted_miner_block_count = []
    for(var m in miner_block_count) {
      sorted_miner_block_count.push([m, miner_block_count[m]]);
    }
    /* descending */
    sorted_miner_block_count.sort((a, b) => {return b[1] - a[1];});

    log('done sorting miner info');

    /* fill in miner info */
    var innerhtml_buffer = '<tr><th>Miner</th><th>Block Count</th>'
      + '<th>% of Total</th><th>Hashrate (Estimate)</th></tr>';
    sorted_miner_block_count.forEach(function(miner_info) {
      var addr = miner_info[0];
      var blocks = miner_info[1];

      if(known_miners[addr] !== undefined) {
        var readable_name = known_miners[addr][0];
        var address_url = known_miners[addr][1];
      } else {
        var readable_name = addr;
        var address_url = 'https://etherscan.io/address/' + addr
      }

      var percent_of_total_blocks = blocks/total_block_count;


      innerhtml_buffer += '<tr><td>'
        + '<a href="' + address_url + '">'
        + readable_name + '</a></td><td>'
        + blocks + '</td><td>'
        + (100*percent_of_total_blocks).toFixed(2) + '%' + '</td><td>'
        + toReadableHashrate(percent_of_total_blocks*estimated_network_hashrate, false) + '</td></tr>';
    });
    /* add the last row (totals) */
    innerhtml_buffer += '<tr><td style="border-bottom: 0rem;"></td><td style="border-bottom: 0rem;">'
      + total_block_count + '</td><td style="border-bottom: 0rem;"></td><td style="border-bottom: 0rem;">'
      + toReadableHashrate(estimated_network_hashrate, false) + '</td></tr>';
    el('#minerstats').innerHTML = innerhtml_buffer;
    log('done populating miner stats');
    // $(window).hide().show(0);
    // $(window).trigger('resize');

    var blocks_since_last_reward = current_eth_block - last_reward_eth_block;
    var date_now = new Date();
    var date_of_last_mint = new Date(date_now.getTime() - blocks_since_last_reward*15*1000)

    function get_date_from_eth_block(eth_block) {
      /* TODO: use web3 instead, its probably more accurate */
      /* blockDate = new Date(web3.eth.getBlock(startBlock-i+1).timestamp*1000); */
      return new Date(date_of_last_mint.getTime() - ((last_reward_eth_block - eth_block)*15*1000)).toLocaleString()
    }

    /* fill in block info */
    var dt = new Date();
    var innerhtml_buffer = '<tr><th>Time (Approx)</th><th>Eth Block #</th>'
      + '<th>Transaction Hash</th><th>Miner</th></tr>';
    mined_blocks.forEach(function(block_info) {
      var eth_block = parseInt(block_info[0]);
      var tx_hash = block_info[1];
      var addr = block_info[2];

      function simpleHash(seed, string) {
        var h = seed;
        for (var i = 0; i < string.length; i++) {
          h = ((h << 5) - h) + string[i].codePointAt();
          h &= 0xFFFFFFFF;
        }
        return h;
      }

      if(known_miners[addr] !== undefined) {
        var readable_name = known_miners[addr][0];
        var address_url = known_miners[addr][1];
        //var hexcolor = (simpleHash(0, address_url) & 0xFFFFFF) | 0x808080;
        var hexcolor = known_miners[addr][2];
      } else {
        var readable_name = addr.substr(0, 20) + '...';
        var address_url = 'https://etherscan.io/address/' + addr;
        var hexcolor = (simpleHash(0, address_url) & 0xFFFFFF) | 0x808080;
        var hexcolor = '#' + hexcolor.toString(16);
        hexcolor = hexcolor.toString(16);
      }

      var transaction_url = 'https://etherscan.io/tx/' + tx_hash;
      var block_url = 'https://etherscan.io/block/' + eth_block;

      //log('hexcolor:', hexcolor, address_url);

      innerhtml_buffer  += '<tr><td>'
        + get_date_from_eth_block(eth_block) + '</td><td>'
        + '<a href="' + block_url + '">' + eth_block + '</td><td>'
        + '<a href="' + transaction_url + '" title="' + tx_hash + '">'
        + tx_hash.substr(0, 16) + '...</a></td><td align="right" style="text-overflow:ellipsis;white-space: nowrap;overflow: hidden;">'
        + '<a href="' + address_url
        + '"><span style="background-color: ' + hexcolor + ';" class="poolname">'
        //+ '">'
        + readable_name
        + '</span></a></td></tr>';
        //+ '</a></td></tr>';
    });
    el('#blockstats').innerHTML = innerhtml_buffer;
    log('done populating block stats');

  })
  .catch((error) => {
    log('error filtering txs:', error);
  });

}

function createStatsTable(){
  stats.forEach(function(stat){
    stat_name = stat[0]
    stat_function = stat[1]
    stat_unit = stat[2]
    stat_multiplier = stat[3]

    el('#statistics').innerHTML += '<tr><td>'
      + stat_name + '</td><td id="'
      + stat_name.replace(/ /g,"") + '"></td></tr>';
  });
}

function areAllBlockchainStatsLoaded(stats) {
  all_loaded = true;

  stats.forEach(function(stat){
    stat_name = stat[0]
    stat_function = stat[1]
    stat_unit = stat[2]
    stat_multiplier = stat[3]
    stat_value = stat[4]
    /* if there is a function without an associated value, we are still waiting */
    if(stat_function !== null && stat_value === null) {
      all_loaded = false;
    }
  })

  if(all_loaded) {
    return true;
  } else {
    return false;
  }
}

function updateStatsTable(stats){
  stats.forEach(function(stat){
    stat_name = stat[0]
    stat_function = stat[1]
    stat_unit = stat[2]
    stat_multiplier = stat[3]

    set_value = function(stats, stat_name, stat_unit, stat_multiplier, save_fn) {
      return function(result) {
        try {
          result = result[0].toString(10)
        } catch (err) {
          result = result.toString(10)
        }

        result = result.toString(10)*stat_multiplier
        save_fn(result)

        /* modify some of the values on display */
        if(stat_name == "Total Supply") {
          result = result.toLocaleString();
        } else if(stat_name == "Mining Difficulty"
               || stat_name == "Tokens Minted"
               || stat_name == "Max Supply for Current Era"
               || stat_name == "Supply Remaining in Era"
               || stat_name == "Token Transfers"
               || stat_name == "Total Contract Operations") {
          result = result.toLocaleString()
        }

        el('#' + stat_name.replace(/ /g,"")).innerHTML = "<b>" + result + "</b> " + stat_unit;

        /* once we have grabbed all stats, update the calculated ones */
        if(areAllBlockchainStatsLoaded(stats)) {
          updateStatsThatHaveDependencies(stats);
          setTimeout(()=>{updateAllMinerInfo(eth, stats, 24)}, 0);
          // setTimeout(()=>{updateDifficultyGraph(eth, stats)}, 0);
        }
      }
    }
    /* run promises that store stat values */
    if(stat_function !== null) {
      stat_function().then(set_value(stats, stat_name, stat_unit, stat_multiplier, (value) => {stat[4]=value}));
    }
  });

  updateThirdPartyAPIs();
  updateLastUpdatedTime();
}

function updateAllPageInfo() {
  createStatsTable();
  updateStatsTable(stats);
}
