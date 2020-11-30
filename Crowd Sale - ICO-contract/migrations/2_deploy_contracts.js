var dappToken = artifacts.require("dappToken");
var crowdSale = artifacts.require("crowdSale");

module.exports = function (deployer) {
  deployer.deploy(dappToken, "UBCrypto", "UBCrypto", 25000).then(function () {
    return deployer.deploy(crowdSale, 3600, 500, dappToken.address, '0xfaa88b88830698a2f37dd0fa4acbc258e126bc785f1407ba9824f408a905d784');
  });
};
