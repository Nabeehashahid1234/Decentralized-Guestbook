
const DecentralizedGuestbook = artifacts.require("DecentralizedGuestbook");

module.exports = function (deployer) {
    deployer.deploy(DecentralizedGuestbook);
};
