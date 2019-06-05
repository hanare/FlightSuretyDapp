var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "entry always vibrant observe guitar magic genre pave ankle tone sauce fiction";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: '*',
      gas: 9999999
    },
    PREdevelopment: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: '*',
      gas: 9999999
    }
  },
  // compilers: {
  //   solc: {
  //     version: "^0.5.2"
  //   }
  // }
};