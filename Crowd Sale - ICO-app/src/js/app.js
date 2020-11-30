App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: "http://127.0.0.1:7545",
  // network_id: 5777,
  chairPerson: null,
  currentAccount: null,
  isCrowdSaleEnabled:false,
  init: function () {
    console.log("Checkpoint 0");
    return App.initWeb3();
  },

  initWeb3: function () {
    // Is there is an injected web3 instance?
    if (typeof web3 !== "undefined") {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    ethereum.enable();
    App.populateAddress();
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Crowdsale.json", function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var crowdsaleArtifact = data;
      App.contracts.crowdSale = TruffleContract(crowdsaleArtifact);
      App.contracts.crowdSaleContract = data;
      // Set the provider for our contract
      App.contracts.crowdSale.setProvider(App.web3Provider);
      App.currentAccount = web3.eth.coinbase;
      jQuery("#current_account").text(App.currentAccount);
      // App.getCurrentPhase();
      App.getChairperson();
      $.getJSON("dappToken.json", function (data) {
        var dappTokenArtifact = data;
        App.contracts.dappToken = TruffleContract(dappTokenArtifact);
        App.contracts.dappTokenContract = data;
        // Set the provider for our contract
        App.contracts.dappToken.setProvider(App.web3Provider);
        App.updateBalances();
        App.registerEventForAccountChange();
        return App.bindEvents();
      });
    });
  },

  bindEvents: function () {
    $(document).on("click", "#enableCrowdSale", App.enableCrowdSale);
    $(document).on("click", "#updateExhangeRate", App.updateExchangeRate);
    $(document).on(
      "click",
      "#registerForBonusTokens",
      App.registerForBonusTokens
    );
    $(document).on("click", "#buyTokens", App.buyTokens);
    $(document).on("click", "#buyTokensWithBonus", App.buyBonusTokens);
    $(document).on("click", "#updateEndTime", App.updateEndTimeInContract);
    

    //$(document).on('click', '#register', function(){ var ad = $('#enter_address').val(); App.handleRegister(ad); });
  },

  enableCrowdSale: function () {
    App.contracts.crowdSale.deployed().then(function (instance) {
      instance
        .enableCrowdSale(true)
        .then((data) => {
          console.log("crowd Sale Enabled");
          toastr.info("crowd Sale Enabled");
          App.updateBalances();
        })
        .catch((error) => {
          console.log(error);
          toastr["error"]("Error in enabling crowd sale");
        });
    });
  },

  updateExchangeRate: function () {
    if (App.validateAmount($("#exhangeRate").val())) {
      $("#exhangeRate").removeClass("invalid");
      $("#exhangeRateText").removeClass("displayBlock");
      App.contracts.crowdSale.deployed().then(function (instance) {
        instance
          .updateExchangeRate($("#exhangeRate").val())
          .then((data) => {
            App.updateBalances();
            console.log("Exchange Rate Updated");
            toastr.info("Exchange Rate Updated");
          })
          .catch((error) => {
            console.log(error);
            toastr["error"]("Error in updating exchange rate");
          });
      });
    } else {
      $("#exhangeRateText").addClass("displayBlock");
      $("#exhangeRate").addClass("invalid");
    }
  },

  registerForBonusTokens: function () {
    App.contracts.crowdSale.deployed().then(function (instance) {
      let ethValue = web3.toWei(0.2, "ether");
      instance
        .registerUserForBonusTokens($("#bonusTokenPassword").val(), {
          from: App.currentAccount,
          value: ethValue,
        })
        .then((data) => {
          App.updateBalances();
          console.log("Registered For Bonus Tokens");
          toastr.info("Registered For Bonus Tokens");
        })
        .catch((error) => {
          console.log(error);
          toastr["error"]("Error in Registering For Bonus Tokens");
        });
    });
  },

  buyTokens: function () {
    App.contracts.crowdSale.deployed().then(function (instance) {
      if (App.validateAmount($("#numberOfTokens").val())) {
        instance
          .getRate()
          .then((exchangeRate) => {
            let ethValue = $("#numberOfTokens").val() / exchangeRate.toNumber();
            ethValue = web3.toWei(ethValue, "ether");
            instance
              .buyTokens({
                from: App.currentAccount,
                value: ethValue,
              })
              .then((data) => {
                App.updateBalances();
                console.log("Tokens bought successfully");
                toastr.info("Tokens bought successfully");
              })
              .catch((error) => {
                console.log(error);
                toastr["error"]("Error in Buying Tokens");
              });
          })
          .catch((error) => {
            console.log(error);
            toastr["error"]("Error in getting exchange rate");
          });
      }
    });
  },

  buyBonusTokens: function () {
    App.contracts.crowdSale.deployed().then(function (instance) {
      if (App.validateAmount($("#numberOfBonusTokens").val()) && $("#passwordForBonusTokens").val().trim()) {
        instance
          .getRate()
          .then((exchangeRate) => {
            let ethValue = $("#numberOfBonusTokens").val() / exchangeRate["c"][0];
            ethValue = web3.toWei(ethValue, "ether");
            instance
              .buyTokensWithBonus($("#passwordForBonusTokens").val(),{
                from: App.currentAccount,
                value: ethValue,
              })
              .then((data) => {
                App.updateBalances();
                console.log("Tokens bought with bonus successfully");
                toastr.info("Tokens bought with bonus successfully");
              })
              .catch((error) => {
                console.log(error);
                toastr["error"]("Error in Buying Tokens with bonus");
              });
          })
          .catch((error) => {
            console.log(error);
            toastr["error"]("Error in getting exchange rate");
          });
      }
    });
  },


  validateAmount: function (value) {
    if (value) {
      if (value.trim().length == 0 || isNaN(value)) {
        console.log("Kindly insert a valid number");
        return false;
      } else {
        return true;
      }
    } else {
      console.log("Kindly insert a valid number");
      return false;
    }
  },

  updateBalances: function(){
    App.checkIfCrowdSaleIsEnabled();
    App.getCrowdSaleEndTime();
    App.currentAccount = web3.eth.coinbase;
    App.contracts.crowdSale.deployed().then(function (instance) {
      instance.getRate().then(rate=>{
        $("#currentExchangeRate").text("1 ETH = " + rate + " UB Crypto");
      })
    });
    $("#userAddress").text(App.currentAccount);
    web3.eth.getBalance(App.currentAccount, function(err, result) {
      if (err) {
        console.log(err)
      } else {
        $("#userETH").text(web3.fromWei(result, "ether") + " ETH");
      }
    })
    App.contracts.dappToken.deployed().then(function (instance) {
      instance.balanceOf(App.currentAccount).then(bal=>{
        $("#userUBCrypto").text(web3.fromWei(bal.toNumber(), "ether" ) + " UB Crypto");
      })
    });
  },

  populateAddress: function () {
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts(
      (err, accounts) => {
        jQuery.each(accounts, function (i) {
          if (web3.eth.coinbase != accounts[i]) {
            var optionElement =
              '<option value="' + accounts[i] + '">' + accounts[i] + "</option";
            jQuery("#enter_address").append(optionElement);
          }
        });
      }
    );
  },

  getChairperson: function () {
    App.contracts.crowdSale
      .deployed()
      .then(function (instance) {
        instance.creator.call()
      .then(function (result) {
        App.chairPerson = result;
        if (App.currentAccount == App.chairPerson) {
          $(".chairperson").css("display", "inline");
          $(".img-chairperson").css("width", "100%");
          $(".img-chairperson").removeClass("col-lg-offset-2");
        } else {
          $(".other-user").css("display", "inline");
        }
      });
  });},

  getCrowdSaleEndTime: function(){
    App.contracts.crowdSale
      .deployed()
      .then(function (instance) {
        instance.endTime.call().then(data=>{
          endTime = data;
          App.updateEndTime(endTime);
          console.log("crowd sale end time : " + data);
        });
  });},

  checkIfCrowdSaleIsEnabled : function(){
    App.contracts.crowdSale
      .deployed()
      .then(function (instance) {
        instance.isCrowdSaleEnabled.call().then(data=>{
          isCrowdSaleEnabled = data;
          $("#crowdSaleEnabled").text(data);
          console.log("is crowd sale enabled : " + data);
        });
  });},

  updateEndTime : function(endTime) {
    let d = new Date(endTime * 1000);
    var secs = (new Date(d.getTime()).getTime() - new Date().getTime()) / 1000;
    if (secs > 0) {
      this.setEndTimeTimer(secs);
    } else {
      $("#endTime").text("Crowd Sale has Ended");
    }
  },

  updateEndTimeInContract: function () {
    if (App.validateAmount($("#updateEndTimeVal").val())) {
      $("#updateEndTimeVal").removeClass("invalid");
      $("#exhangeRateText").removeClass("displayBlock");
      App.contracts.crowdSale.deployed().then(function (instance) {
        instance
          .updateCrowSaleEndTime($("#updateEndTimeVal").val())
          .then((data) => {
            console.log("Crowd Sale End Time Updated");
            toastr.info("Crowd Sale End Time Updated");
            App.updateBalances();
          })
          .catch((error) => {
            console.log(error);
            toastr["error"]("Error in updating Crowd Sale End Time");
          });
      });
    } else {
      $("#updateEndTimeVal").addClass("displayBlock");
      $("#exhangeRate").addClass("invalid");
    }
  },

  registerEventForAccountChange: function() {
    setInterval(function() {
      if (web3.eth.coinbase !== App.currentAccount) {
        App.updateBalances()
      }
    }, 100);
  },

  setEndTimeTimer: function(timer) {
    if (App.intervalTimerToBeCleared) {
      clearInterval(this.intervalTimerToBeCleared);
    }
    App.intervalTimerToBeCleared = setInterval(() => {
      let hours = parseInt("" + (timer / 3600) % 24, 10);
      let minutes = parseInt("" + (timer / 60) % 60, 10);
      let seconds = parseInt("" + timer % 60, 10);
      // hours = hours <= 0 ? "0" + hours : hours;
      // minutes = minutes <= 0 ? "0" + minutes : minutes;
      // seconds = seconds <= 0 ? "0" + seconds : seconds;
      --timer;
      if(minutes<=0 && hours<=0 && seconds<=0){
        $("#endTime").text("Crowd Sale has Ended");
      }else{
        $("#endTime").text(hours + " Hours " + minutes + " Mins " + seconds + " Secs");
      }
    }, 1000);
  },

  
  //Function to show the notification of auction phases
  showNotification: function (phase) {
    var notificationText = App.biddingPhases[phase];
    $("#phase-notification-text").text(notificationText.text);
    toastr.info(notificationText.text, "", {
      iconClass: "toast-info notification" + String(notificationText.id),
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
    //Notification UI config
    toastr.options = {
      showDuration: "1000",
      positionClass: "toast-top-left",
      preventDuplicates: true,
      closeButton: true,
    };
  });
});
