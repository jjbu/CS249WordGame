/*
Filename: ip.js
Author: Jessica Bu
*/
Words = new Mongo.Collection("words");
var inputWord = "";
var score = 0;

//Timer--------------------------------------------------------------------------------------
function timeLeft() {
  if (clock > 0) {
    clock--;
    Session.set("time", clock);
  } else {
    console.log("Time's up");
    if (Meteor.user() != null) {
        var user = Meteor.user().profile;
        if (score > user.highscore) {
          Meteor.users.update({ _id: Meteor.userId()}, {$set:{ "profile.highscore": score}});
        }
  }
    $('#myModal').modal();
    return Meteor.clearInterval(interval);
  }
};

//--------------------------------------------------------------------------------------------
if (Meteor.isClient) {

  Session.setDefault('page', 'menu');

//Register Template---------------------------------------------------------------------------
  Template.register.events({
    'submit form': function(event) {
        event.preventDefault();
        var usernameVar = event.target.registerUsername.value;
        var passwordVar = event.target.registerPassword.value;
        //check whether account with username already exists
        // if (!accountExists(usernameVar)) {
          Accounts.createUser({
            username: usernameVar,
            password: passwordVar,
            profile: {
              highscore: 0
            }
         });
        // } else {
        //   console.log("Account with username " + usernameVar + " already exists.");
        // }
        
    }
});

//Login Template------------------------------------------------------------------------------
  Template.login.events({
    'submit form': function(event){
        event.preventDefault();
        var usernameVar = event.target.loginUsername.value;
        var passwordVar = event.target.loginPassword.value;
        Meteor.loginWithPassword(usernameVar, passwordVar);
    }
});

//Dashboard Template--------------------------------------------------------------------------
Template.dashboard.events({
    'click .logout': function(event){
        event.preventDefault();
        Meteor.logout();
    }
});

Template.dashboard.helpers({
  username: function() {
      return Meteor.user().username;
    }
});

//D3 Visualization----------------------------------------------------------------------------
var row;
var col;
var text;
var grid;
var gridWidth = 600;
var gridHeight = 600;
var numSquares = 10;

//Build grid
  function buildGrid(svg, letters) {
    var data = gridVals(gridWidth, numSquares);

    grid = d3.select("body")
    .append("svg")
    .attr("width", gridWidth)
    .attr("height", gridHeight);

    row = grid.selectAll(".row")
    .data(data)
    .enter().append("svg:g")
    .attr("class", "row");

    col = row.selectAll(".cell")
    .data(function (d) {return d;})
    .enter().append("svg:rect")
    .attr("stroke-width", 5)
    .attr("class", "cell")
    .attr("x", function(d) {return d.x;})
    .attr("y", function(d) { return d.y;})
    .attr("width", function(d) {return d.width;})
    .attr("height", function(d) { return d.height; })
    .on('mouseover', function() {
      d3.select(this)
      .style('fill', '#00aacc');
    })
    .on('mouseout', function() {
      d3.select(this)
      .style('fill', '#FFF');
    })
    .on('click', function(d) {
     inputWord += d.letter; //add letter to the word being formed
     Session.set('word', inputWord);
     console.log("word so far: " + inputWord);
    })
    .style("fill", '#FFF')
    .style("stroke", '#000');

    text = row.selectAll("text")
    .data(function(d) { return d;})
    .enter().append("svg:text")
    .style("pointer-events", "none")
    .text(function(d) {return d.letter;})
    .attr("text-anchor", "middle")
    .attr("x", function(d) {return d.x + gridWidth/numSquares/2;})
    .attr("y", function(d) {return d.y + gridWidth/numSquares/2;})
    .style("font-size","20px")
    }

    //Randomly generate letters to populate word board (Vowels and the letter 's' appear more times than consonants)
    function gridVals(gridWidth, numSquares) {
      var data = new Array();
      var squareSize = gridWidth / numSquares;
      var startX = squareSize;
      var startY = squareSize;
      var xpos = startX;
      var ypos = startY;
      var possible = "AAABCDEEEFGHIIJKLMNOOPQRSSTUUVWXYZAABCDEEEFGHIIJKLMNOOPQRSSTUUVWXYZAABCDEEEFGHIIJKLMNOOPQRSSTUUVWXYZ";

      for (var i = 0; i < numSquares; i++) {
        data.push(new Array());
        for (var j = 0; j < numSquares; j++) {
          data[i].push({
            x: xpos,
            y: ypos,
            width: squareSize,
            height: squareSize,
            letter: possible.charAt(Math.floor(Math.random()*100))
          });
          xpos += squareSize;
        }
        xpos = startX;
        ypos += squareSize;
      }
      // console.log(data);
      return data;
    }

 
//Body Template-------------------------------------------------------------------------------
  Template.body.helpers({
    displayWord: function() {
      return Words.find()
    },

    displayInputWord: function() {
      return Session.get('word');
    },

    displayScore: function() {
      score = 0;
      var foundWords = Words.find();

      foundWords.forEach(function(word) {
        score += word.points;
      }) ;
      console.log(score);
      return score;
    },

    isPage: function(page){
      return Session.equals('page', page)
    },

    displayHighscore: function() {
      return Meteor.user().profile.highscore;
      // console.log("Meteor.user: ");
      // console.log(Meteor.user());
      // return Meteor.user();
    },

    time: function() {
      return Session.get("time");
    }
    
  });
  
  Template.body.events({
    'click #play': function() {
      Session.set('page', 'play')
      Meteor.call('clearWordCollection');
      clock = 60;
      Session.set("time", clock)
      d3.selectAll("svg").remove();
      interval = Meteor.setInterval(timeLeft, 1000);
    },

    'click #new': function() {
    // Session.set('page', 'play')
    location.reload(); 
      // Meteor.call('clearWordCollection');
      // clock = 60;
      // Session.set("time", clock)
      // d3.selectAll("svg").remove();

      // interval = Meteor.setInterval(timeLeft, 1000);
      // updateVals();
    },

    'click #backtomenu': function() {
      Session.set('page', 'menu')
      d3.selectAll("svg").remove();
    },

    'click #submit': function () {
      //Check whether the word exists; if it does, add to collection.
      var word = inputWord.toLowerCase();  
      Meteor.call('checkWord', word, function(error, result) {
        // console.log(result);
        if (result == "[]") {
          console.log("word does not exist");
        } else { 
          Meteor.call('addWord', word);
        }
      });
      Session.set('word', "");
      inputWord = "";
    },

    'click #clearWord': function() {
      Session.set('word', "");
      inputWord = "";
    },

    'click #end': function() {
      clock = 0;
    }
  });

  //Wordboard template------------------------------------------------------------------------
  Template.wordBoard.helpers({
    'grid': function() {
      buildGrid();
    }
  });

  //Leaderboard template----------------------------------------------------------------------
  Template.leaderboard.helpers({
      'player': function(){
            var currentUserId = Meteor.userId();
            return Meteor.users.find({}, {sort:{profile: {highscore: -1}, username: 1}});
        }
      });
}

//--------------------------------------------------------------------------------------------
if (Meteor.isServer) {

  var wordnikURL = "http://api.wordnik.com:80/v4/word.json/";
  
  Meteor.methods({
    
    'checkWord': function(input) {
      var fullURL = wordnikURL + input + "/definitions?limit=1&includeRelated=true&sourceDictionaries=all&useCanonical=false&includeTags=false&api_key=ad8cc021015d19e68e51106dc8e066b47010002571f18099f";
      var response = HTTP.call("GET", fullURL);
      return response.content;
    },

    'addWord': function(word){
      Words.insert({
        word: word,
        points: word.length*2
      });
    },

    'clearWordCollection': function() {
      var foundWords = Words.find();
      console.log(foundWords);
      foundWords.forEach(function(word) {
        Words.remove(word);
      }) ;
    }

  });
}