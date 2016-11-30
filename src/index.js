/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

var Alexa = require('alexa-sdk');

var states = {
    STARTMODE: '_STARTMODE',                // Prompt the user to start or restart the game.
    ASKMODE: '_ASKMODE',                    // Alexa is asking user the questions.
    DESCRIPTIONMODE: '_DESCRIPTIONMODE'     // Alexa is describing the final choice and prompting to start again or quit
};

var torchTaken = false;
var mushroomInInventory = false;
var mushroomConsumed = false;
// Questions
var nodes = [{ "node": 1, "message": "You awaken confused in a cave in almost complete darkness. A single torch is lit and the air smells of putrid rotting flesh. You see a mysterious glowing chest, a dark path down the cave, and a small door, what do you wish to do?", "open door": 2, "take torch": 3, "go down the cave": 4, "go to the chest": 8, "consume mushroom": 6 },

              //open door
             { "node": 2, "message": "You open the wooden door to a room packed to the brim with dead bodies. Some bodies fall on you when you opened the door and you can't enter because there are literally so many bodies. The stench is just awful, if I were to guess it's at least like 42 disease-infested bodies in the room. There is no possible way you can enter, you should probably go back.", "leave the door": 4},

             //take torch
             { "node": 3, "message": "You take the torch in your left hand and continue to look around. You see a mysterious glowing chest, a dark path down the cave, and a small door, what do you wish to do?","open door": 2, "take torch": 3, "go down the cave": 4, "open chest": 5, "consume mushroom": 6 },

             //go down cave
             { "node": 4, "message": "You proceed down the cave and come accross a small terrifying disgusting creature. He is coughing relentlessly and looks as if he hasn't ate in months. He speaks - 'GIVE ME THE MAGICAL MUSHROOM!'. How do you respond? ", "here it is": 8, "no it's mine": 9 },

             //open chest
             { "node": 5, "message": "You open the chest to find a single plump green spotted mushroom, what do you want to do with the mushroom? (leave it? eat it? put it in inventory?)", "take the mushroom":7, "go back": 9, "eat the mushroom": 6},

             //consume mushroom
             { "node": 6, "message": "After consuming the mushroom, you lose function and die. Good game, thanks for playing. A small creature tosses you into a room full of dead bodies, Would you like to play again or rot here eternally?", "play again": 1, "rot here": 13 },

             //put mushroom in inventory
             { "node": 7, "message": "You place the weird mushroom in your back pocket. You see a dark path down the cave and a small door, what do you wish to do?", "go down the cave": 4, "open the door": 2 },

             //chest riddle
             { "node": 8, "message": "The glowing chest has an etching on the lid that reads 'speak aloud the Big Oh runtime of binary search on a sorted list to open me'.", "log n": 5, "leave the chest" : 1},

             //default room
             { "node": 9, "message": "You're in a cave with a single lit torch.  You see a mysterious glowing chest, a dark path down the cave, and a small door, what do you wish to do?", "open door": 2, "take torch": 3, "go down the cave": 4, "open chest": 8, "consume mushroom": 6},

             //gollum doesn't recieve mushroom
             { "node": 10, "message": "WHY WOULDN'T YOU GIVE ME THE MUSHROOM? I WOULD'VE SHOWED YOU THE WAY OUT IF YOU DID. Perhaps I still will if you can answer my riddle 'Thirty white horses on a red hill, First they champ, Then they stamp, Then they stand still.'", "teeth": 11},

             //answer gollums riddle
             {"node": 11, "message": "TEETH! Correct, Now follow me for the way out!             Congratulations, You Win!"},

            //give gollum mushroom
            {"node": 12, "message": "YES! MY PRECIOUS! Follow me to find the way out of the cave!         Congratulations, You Win!"},

            {"node": 13, "message": "Goodnight."},

            {"node": 14, "message": "You proceed down the cave without a source of light and suddenly get jumped by an orc-like figure! You die. A small creature tosses you into a room full of dead bodies, Would you like to play again or rot here eternally?","play again": 1, "rot here": 13}

             //default room without torch

             //default room without torch and door chest
];

// this is used for keep track of visted nodes when we test for loops in the tree
var visited;

// These are messages that Alexa says to the user during conversation

// This is the intial welcome message
var welcomeMessage = "Welcome to our Bina Term Project, are you ready to play?";

// This is the message that is repeated if the response to the initial welcome message is not heard
var repeatWelcomeMessage = "Say yes to start the game or no to quit.";

// this is the message that is repeated if Alexa does not hear/understand the reponse to the welcome message
var promptToStartMessage = "Say yes to continue, or no to end the game.";

// This is the prompt during the game when Alexa doesnt hear or understand a yes / no reply
var promptToSayYesNo = "Say a phrase to react to the scenario you're in.";

// This is the response to the user after the final question when Alex decides on what group choice the user should be given
var decisionMessage = "I think you would make a good";

// This is the prompt to ask the user if they would like to hear a short description of thier chosen profession or to play again
var playAgainMessage = "Say 'tell me more' to hear a short description for this profession, or do you want to play again?";

// this is the help message during the setup at the beginning of the game
var helpMessage = "Welcome to dungeons and dragons";

// This is the goodbye message when the user has asked to quit the game
var goodbyeMessage = "Ok, see you next time!";

var speechNotFoundMessage = "Could not find speech for node";

var nodeNotFoundMessage = "In nodes array could not find node";

var descriptionNotFoundMessage = "Could not find description for node";

var loopsDetectedMessage = "A repeated path was detected on the node tree, please fix before continuing";

var utteranceTellMeMore = "tell me more";

var utterancePlayAgain = "play again";

// the first node that we will use
var START_NODE = 1;

// --------------- Handlers -----------------------

// Called when the session starts.
exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(newSessionHandler, startGameHandlers, askQuestionHandlers, descriptionHandlers);
    alexa.execute();
};

// set state to start up and  welcome the user
var newSessionHandler = {
  'LaunchRequest': function () {
    this.handler.state = states.STARTMODE;
    this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
  },'AMAZON.HelpIntent': function () {
    this.handler.state = states.STARTMODE;
    this.emit(':ask', helpMessage, helpMessage);
  },
  'Unhandled': function () {
    this.handler.state = states.STARTMODE;
    this.emit(':ask', promptToStartMessage, promptToStartMessage);
  }
};

// --------------- Functions that control the skill's behavior -----------------------

// Called at the start of the game, picks and asks first question for the user
var startGameHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    'AMAZON.YesIntent': function () {

        // ---------------------------------------------------------------
        // check to see if there are any loops in the node tree - this section can be removed in production code
        visited = [nodes.length];
        var loopFound = helper.debugFunction_walkNode(START_NODE);
        // if( loopFound === true)
        // {
        //     // comment out this line if you know that there are no loops in your decision tree
        //      this.emit(':tell', loopsDetectedMessage);
        // }
        // ---------------------------------------------------------------

        // set state to asking questions
        this.handler.state = states.ASKMODE;

        // ask first question, the response will be handled in the askQuestionHandler
        var message = helper.getSpeechForNode(START_NODE);

        // record the node we are on
        this.attributes.currentNode = START_NODE;

        // ask the first question
        this.emit(':ask', message, message);
    },
    'AMAZON.NoIntent': function () {
        // Handle No intent.
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.StartOverIntent': function () {
         this.emit(':ask', promptToStartMessage, promptToStartMessage);
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', helpMessage, helpMessage);
    },
    'Unhandled': function () {
        this.emit(':ask', promptToStartMessage, promptToStartMessage);
    }
});


// user will have been asked a question when this intent is called. We want to look at their yes/no
// response and then ask another question. If we have asked more than the requested number of questions Alexa will
// make a choice, inform the user and then ask if they want to play again
var askQuestionHandlers = Alexa.CreateStateHandler(states.ASKMODE, {

    'AMAZON.YesIntent': function () {
        // Handle Yes intent.
        helper.yesOrNo(this,'yes');
    },
    'AMAZON.NoIntent': function () {
        // Handle No intent.
         helper.yesOrNo(this, 'no');
    },
    'GoDownCaveIntent': function () {
        // Handle Yes intent.
        if(torchTaken == false) {
          this.attributes.currentNode = 14;
          var message = helper.getSpeechForNode(this.attributes.currentNode);
          this.emit(':ask',message, message);
        }
        else {
          this.attributes.currentNode = 4
          var message = helper.getSpeechForNode(this.attributes.currentNode);
          this.emit(':ask',message,message);
        }
    },
    'OpenDoorIntent': function () {
      this.attributes.currentNode = 2;
      var message = helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask', message, message);
    },
    'GoToChestIntent': function () {
      this.attributes.currentNode = 8;
      var message = helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask', message, message);
    },
    'TakeTorchIntent': function () {
      torchTaken = true;
      this.attributes.currentNode = 3;
      var message = helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask', message, message);
    },
    'ConsumeMushroomIntent': function () {
      this.attributes.currentNode = 6;
      var message = helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask', message, message);
    },
    'PutMushroomInInventoryIntent': function () {
      if(this.attributes.currentNode == 5) {
        mushroomInInventory = true;
        this.attributes.currentNode = 7;
      }
      var message = helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask', message, message);
    },
    'GiveMushroomIntent': function () {
      if(mushroomInInventory) {
        this.attributes.currentNode = 12;
      }
      else {
        this.attributes.currentNode = 10;
      }
      var message = helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask', message, message);
    },
    'DontGiveMushroomIntent': function () {
      if(this.attributes.currentNode ==4) {
        this.attributes.currentNode = 10; //able to advance
      }
      var message= helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask',message,message);
    },
    'AnswerGollumRiddleIntent': function () {
      if(this.attributes.currentNode == 10) {
        this.attributes.currentNode = 11;//able to advance
      }
      var message= helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask',message,message);
    },
    'AnswerChestRiddleIntent': function () {
      if(this.attributes.currentNode == 8) {
        mushroomInInventory = true;
        this.attributes.currentNode = 5;
      }
      var message = helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask', message, message);
    },
    'GoToDefaultIntent': function () {
      this.attributes.currentNode = 9;
      var message = helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask', message, message);
    },
    'PlayAgainIntent': function () {
      this.attributes.currentNode = 1;
      torchTaken = false;
      mushroomInInventory = false;
      mushroomConsumed = false;
      var message = helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask', message, message);
    },
    'RotIntent': function () {
      this.attributes.currentNode = 13;
      var message = helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask', message, message);
    },
    'RepeatIntent': function () {
      var message= helper.getSpeechForNode(this.attributes.currentNode);
      this.emit(':ask',message,message);
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', promptToSayYesNo, promptToSayYesNo);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.StartOverIntent': function () {
        // reset the game state to start mode
        this.handler.state = states.STARTMODE;
        this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
    },
    'Unhandled': function () {
        this.emit(':ask', promptToSayYesNo, promptToSayYesNo);
    }
});

// user has heard the final choice and has been asked if they want to hear the description or to play again
var descriptionHandlers = Alexa.CreateStateHandler(states.DESCRIPTIONMODE, {

 'AMAZON.YesIntent': function () {
        // Handle Yes intent.
        // reset the game state to start mode
        this.handler.state = states.STARTMODE;
        this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
    },
    'AMAZON.NoIntent': function () {
        // Handle No intent.
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', promptToSayYesNo, promptToSayYesNo);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.StartOverIntent': function () {
        // reset the game state to start mode
        this.handler.state = states.STARTMODE;
        this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
    },
    'DescriptionIntent': function () {
        //var reply = this.event.request.intent.slots.Description.value;
        //console.log('HEARD: ' + reply);
        helper.giveDescription(this);
      },

    'Unhandled': function () {
        this.emit(':ask', promptToSayYesNo, promptToSayYesNo);
    }
});

// --------------- Helper Functions  -----------------------

var helper = {

    // gives the user more information on their final choice
    giveDescription: function (context) {

        // get the speech for the child node
        var description = helper.getDescriptionForNode(context.attributes.currentNode);
        var message = description + ', ' + repeatWelcomeMessage;

        context.emit(':ask', message, message);
    },

    // logic to provide the responses to the yes or no responses to the main questions
    yesOrNo: function (context, reply) {

        // this is a question node so we need to see if the user picked yes or no
        var nextNodeId = helper.getNextNode(context.attributes.currentNode, reply);

        // error in node data
        if (nextNodeId == -1)
        {
            context.handler.state = states.STARTMODE;

            // the current node was not found in the nodes array
            // this is due to the current node in the nodes array having a yes / no node id for a node that does not exist
            context.emit(':tell', nodeNotFoundMessage, nodeNotFoundMessage);
        }

        // get the speech for the child node
        var message = helper.getSpeechForNode(nextNodeId);

        // have we made a decision
        if (helper.isAnswerNode(nextNodeId) === true) {

            // set the game state to description mode
            context.handler.state = states.DESCRIPTIONMODE;

            // append the play again prompt to the decision and speak it
            message = decisionMessage + ' ' + message + ' ,' + playAgainMessage;
        }

        // set the current node to next node we want to go to
        context.attributes.currentNode = nextNodeId;

        context.emit(':ask', message, message);
    },

    // gets the description for the given node id
    getDescriptionForNode: function (nodeId) {

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == nodeId) {
                return nodes[i].description;
            }
        }
        return descriptionNotFoundMessage + nodeId;
    },

    // returns the speech for the provided node id
    getSpeechForNode: function (nodeId) {

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == nodeId) {
                return nodes[i].message;
            }
        }
        return speechNotFoundMessage + nodeId;
    },

    // checks to see if this node is an choice node or a decision node
    isAnswerNode: function (nodeId) {

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == nodeId) {
                if (nodes[i].yes === 0 && nodes[i].no === 0) {
                    return true;
                }
            }
        }
        return false;
    },

    // gets the next node to traverse to based on the yes no response
    getNextNode: function (nodeId, yesNo) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == nodeId) {
                if (yesNo == "yes" || yesNo == "moldy") {
                    return nodes[i].yes;
                }
                return nodes[i].no;
            }
        }
        // error condition, didnt find a matching node id. Cause will be a yes / no entry in the array but with no corrosponding array entry
        return -1;
    },

    // Recursively walks the node tree looking for nodes already visited
    // This method could be changed if you want to implement another type of checking mechanism
    // This should be run on debug builds only not production
    // returns false if node tree path does not contain any previously visited nodes, true if it finds one
    debugFunction_walkNode: function (nodeId) {

        // console.log("Walking node: " + nodeId);

        if( helper.isAnswerNode(nodeId) === true) {
            // found an answer node - this path to this node does not contain a previously visted node
            // so we will return without recursing further

            // console.log("Answer node found");
             return false;
        }

        // mark this question node as visited
        if( helper.debugFunction_AddToVisited(nodeId) === false)
        {
            // node was not added to the visited list as it already exists, this indicates a duplicate path in the tree
            return true;
        }

        // console.log("Recursing yes path");
        var yesNode = helper.getNextNode(nodeId, "yes");
        var duplicatePathHit = helper.debugFunction_walkNode(yesNode);

        if( duplicatePathHit === true){
            return true;
        }

        // console.log("Recursing no");
        var noNode = helper.getNextNode(nodeId, "no");
        duplicatePathHit = helper.debugFunction_walkNode(noNode);

        if( duplicatePathHit === true){
            return true;
        }

        // the paths below this node returned no duplicates
        return false;
    },

    // checks to see if this node has previously been visited
    // if it has it will be set to 1 in the array and we return false (exists)
    // if it hasnt we set it to 1 and return true (added)
    debugFunction_AddToVisited: function (nodeId) {

        if (visited[nodeId] === 1) {
            // node previously added - duplicate exists
            // console.log("Node was previously visited - duplicate detected");
            return false;
        }

        // was not found so add it as a visited node
        visited[nodeId] = 1;
        return true;
    }
};
