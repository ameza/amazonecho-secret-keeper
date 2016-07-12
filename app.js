var alexa = require('alexa-app');
var app = new alexa.app('secret');
var mongoose = require('mongoose');
var config = require('./config/config');
var secretsController = require('./controllers/secretsController');
var passwordController = require('./controllers/passwordController');

mongoose.connect("MONGO DB PATH",{}, function (err) {
    if (err) {
        console.log(err);
    }
    else {
        console.log("connected");
    }
});


exports.handler = function(event, context) {

    console.info("Request:", event.request);

    if(event.request.intent) {
        if(event.request.intent.slots) {
            console.info('Slots:', event.request.intent.slots);
        }
    }
    else{
        console.log('here');
    }

    // Send requests to the alexa-app framework for routing
    app.lambda()(event, context);
};

app.sessionEnded(function(request,response) {
    // Clean up the user's server-side stuff, if necessary
    response.clearSession();
    // No response necessary
});

app.pre = function (request, response, type) {
    if(process.env.ALEXA_APP_ID) {
        if (request.sessionDetails.application.applicationId != 'amzn1.echo-sdk-ams.app.'+config.alexaAppId) {
            // Fail silently
            response.send();
        }
    }
};


// TODO: change this message before production release
app.error = function(error, request, response) {
        console.log(error);
        response.say("Something went wrong the Secret Keeper app: ");
    exitIntent(request,response);
};

app.launch(function (request, response){
    response.say("Welcome to Secret Keeper... you can say tell me a secret <break time='200ms'/>, keep my secret <break time='200ms'/>, or help.");
    response.shouldEndSession(false,"You can say: tell me a secret, or keep my secret.");

});


function OnHelpIntent (request, response){

    var message=["To hear random public secrets say:<break time='100ms'/> tell me a secret and then continue. <audio src='https://s3.amazonaws.com/tsatsatzu-alexa/sound/tech/OPTIMIS.mp3'></audio> To hear a private secret say:<break time='100ms'/> my numbers are:<break time='100ms'/>  followed by your first number," +
    "and then your second number.<break time='200ms'/> for example: my numbers are 800 and 900.<audio src='https://s3.amazonaws.com/tsatsatzu-alexa/sound/tech/OPTIMIS.mp3'></audio> To leave a public or private secret say:<break time='100ms'/> keep my secret followed by your secret. <break time='500ms'/> After that you can say public <break time='100ms'/>or private to select your secret's privacy." +
    "<audio src='https://s3.amazonaws.com/tsatsatzu-alexa/sound/tech/OPTIMIS.mp3'></audio>You can say tell me a secret <break time='200ms'/>, keep my secret <break time='200ms'/>, or help."].join("<break time='500ms'/>");


    response.say(message);
    response.shouldEndSession(false, "You can say: tell me a secret, or keep my secret.");
};


//app.intent(null, exitIntent)


app.intent('OnHelpIntent', {
    "utterances":["help","what can I ask you",
        "get help",
        "what do you do",
        "how can I use you",
        "help me"]
},OnHelpIntent)


function OnAboutIntent (request, response){

    var message=["Secret Keeper is an Amazon Echo Skill Created by Andres Meza in Costa Rica. Secret Keeper allows you to listen or share secrets with other alexa owners in a public or private way, " +
    "public secrets are available to everybody and private secrets are protected by a password that can be easily shared. For more info visit www.andresmeza.com.",
        "You can say tell me a secret or keep my secret?"
       ].join("<break time='500ms'/>");

    response.say(message);
    response.card("Alexas's Secret by Andrés Meza","Secret Keeper is an Amazon Echo Skill Created by Andres Meza in Costa Rica. Secret Keeper allows you to listen or share secrets with other alexa owners in a public or private way, " +
        "public secrets are available to everybody and private secrets are protected by a password that can be easily shared. For more info visit www.andresmeza.com.");
    response.shouldEndSession(false, "You can say: tell me a secret, or keep my secret.");
};
app.intent('OnAboutIntent', {
    "utterances":["about","Who created this app", "Who created this skill"]
},OnAboutIntent)


app.intent('OnTellMeIntent', {
        "utterances": ["tell me a secret", "I wanna hear a secret", "Tell me some secrets"]
    }, OnTellMeIntent);

function OnTellMeIntent(request, response){

    response.say("I'll tell you some secrets,<break time='500ms'/> if you have a password for a private secret say: my numbers are<break time='200ms'/> followed by your first number and then<break time='100ms'/> your sencond number, otherwise say continue to hear public secrets <break time='500ms'/>")
    response.shouldEndSession(false,"You can say: my numbers are 800 and 900, or just continue to hear public secrets.");
    response.send();
}

app.intent('OnPasswordIntent', {
    "slots":{"NUMBERONE":"AMAZON.NUMBER", "NUMBERTWO":"AMAZON.NUMBER"},
    "utterances":[ "my numbers are {NUMBERONE} and {NUMBERTWO}", "my numbers are {NUMBERONE} {NUMBERTWO}"]

}, OnPasswordIntent);

function OnPasswordIntent(request, response){

    var number1= request.slot('NUMBERONE')

    var number2= request.slot('NUMBERTWO');

    if (number1 && number2) {

        var password=number1+"-"+number2

        secretsController.GetPrivateSecret(password, function (err, data) {
            if (err) {
                response.say("There was a problem getting the secrets" + err);
            }
            if (data){
                response.say("Your secret is:<break time='500ms'/>"+ data.Text + ".<break time='500ms'/>  Say another or next to hear more secrets");
                response.shouldEndSession(false, "You can say: more, next, another or stop.");
                response.send();
            }
            else
            {
                response.say("I couldn't find a secret with those numbers, please try again, say my numbers are followed by your first number and then your second number, for example: my numbers are 800 and 900 ");
                response.shouldEndSession(false, "You say my numbers are, followed by your first number and then your second number,for example: my numbers are 800 and 900");
                response.send();
            }
        })
    }
    else
    {

        response.say("I need at least two numbers to unlock your secret");
        response.shouldEndSession(false, "You can say my numbers are, followed by your first number and then your second number, for example: my numbers are 800 and 900");
        response.send();
    }

    return false;


}


app.intent('OnContinueIntent', {
    "utterances": ["continue", "next", "another","more"]
}, OnContinueIntent);

function OnContinueIntent(request, response){

   secretsController.GetPublicSecret(function(err, data){
       if (err){
           response.say("There was a problem getting the secrets"+err);
       }
       if (data && data.Text){
            response.say(data.Text+".<break time='500ms'/>  Say more or next to hear more secrets");
            response.shouldEndSession(false,"You can say: more, next, another or just stop.");
            response.send();
       }
       else{
           response.say("No more secrets");
           response.shouldEndSession(false,"You can say: more, next, another or just stop.");
           response.send();
       }
   })

   return false;
}




app.intent('OnKeepMeIntent', {
    "utterances":["Keep my secret","keep me a secret","I wanna tell you {a|my} secret", "I have a secret for you"]
},OnKeepMeIntent);


function OnKeepMeIntent (request,response) {

    response.say("Nice, a new secret... Remember to be brief <break time='500ms'/> I'll be ready to hear your secret after the sound... <audio src='https://s3.amazonaws.com/tsatsatzu-alexa/sound/tech/OPTIMIS.mp3'></audio>");
    response.shouldEndSession(false,"I would like to hear some secrets, come on!!, just say your secret");
    response.send();

}



app.intent('OnSecretIntent',
    {
        "slots":{"SECRET":"LIST_OF_SECRETS"},
        "utterances":[ "{SECRET}"]
    }, OnSecretIntent);

function OnSecretIntent(request, response){
    var currentSecret= request.slot('SECRET');
    if (currentSecret!='')
    {

        response.say("Your secret is: <break time='500ms'/>"+currentSecret+ "<break time='500ms'/> did I get it right ?");
        response.session('privacy', 0);
        response.session('secret',currentSecret);
    }
    else {
        response.session('privacy', 0);
        response.session('secret', null);
        response.say("I couldn't get your secret");
    }

    response.shouldEndSession(false, "You can say yes or no");
    response.send();
}




app.intent('OnYesIntent', {
    "utterances":["yes", "private","of course","okay","ok"]
},OnYesIntent);

function OnYesIntent(request, response){


    if (request && request.sessionAttributes && request.sessionAttributes.privacy && request.sessionAttributes.privacy===1) {

        if (request && request.sessionAttributes && request.sessionAttributes.secret) {

            passwordController.getPassword(function (err, password) {

                if (err) {
                    response.say("Error generating a password "+err)
                }
                if (password) {
                    secretsController.AddSecret(request.sessionAttributes.secret, password, function (err2, secret) {

                        if (err2){
                            response.say("Error adding secret "+err2)
                        }
                        if (secret) {
                            var newPassword = password.replace("-","<break time='250ms'/> and <break time='250ms'/>");
                            var message="I'll make sure your secret is safe.\r\nShare the following line with other users so they can hear your private secret:\r\n"+
                                "Listen to my secret on Alexa's Secret by saying: My numbers are "+password.replace("-"," and ")+"\r\nRemember to delete this card.";

                            response.session('privacy', 0);
                            response.session('secret', null);
                            response.say("Wonderful! Your secret is now in good hands.<break time='100ms'/> The following numbers are a password to access your secret.<break time='500ms'/>" +
                                         "Pay attetion to the 2 numbers <break time='200ms'/> Your numbers are:<break time='200ms'/>"  + newPassword + "<break time='200ms'/> Once again: " + newPassword+"<break time='500ms'/>. Your numbers are available in the Alexa App.<break time='300ms'/> Thank you for sharing your secrets with me, bye.");
                            response.card("Alexas's Secret by Andrés Meza",message);
                            response.shouldEndSession(true);
                            response.send();
                        }

                    })
                }
            });

        }
        else
        {
            response.say("No secret in session")
        }





    }
    else {
        if (request && request.sessionAttributes && request.sessionAttributes.secret) {
            response.say("Awesome!!<break time='500ms'/> Remember all the secrets are anonymously " +
                "stored,<break time='500ms'/> you can make your secret available to everybody by saying: " +
                "public! <break time='500ms'/> or keep it to yourself by saying: private!,<break time='100ms'/> " +

                "Should I keep it public<break time='25ms'/> or private?");
            response.session('privacy', 1);
        }
        else {
            response.say("I need to hear your secret first")
        }
        response.shouldEndSession(false, "You can say public or private");
        response.send();
    }

    return false;
}

app.intent('OnNoIntent', {
    "utterances":["No","public","nope","dont"]
},OnNoIntent);

function OnNoIntent(request, response){

    var noAnswerMessage=""
    if (request && request.sessionAttributes && request.sessionAttributes.privacy) {


        secretsController.AddSecret(request.sessionAttributes.secret, "", function (err2, secret) {

            if (err2){
                response.say("Error adding secret "+err2)
                response.shouldEndSession(true);
                response.send();
            }
            if (secret) {
                var message="Your secret is now anonymously public.";
                response.session('privacy', 0);
                response.session('secret', null);
                response.say("Perfect, your secret is now anonymously public, thank you for sharing your secrets with me, bye")
                response.card("Alexas's Secret by Andrés Meza",message);
                response.shouldEndSession(true);
                response.send();
            }

        });

    }
    else {
        if (request && request.sessionAttributes && request.sessionAttributes.secret) {
            response.session('secret', null);
            response.say("aww, let's try again, Remember to be brief <break time='500ms'/> please let me hear your secret after the sound... <audio src='https://s3.amazonaws.com/tsatsatzu-alexa/sound/tech/OPTIMIS.mp3'></audio>");
            response.shouldEndSession(false, "Go ahead tell me your secret, I'm all microphones");
        }
        else {
            response.say("I need to hear your secret first")
            response.shouldEndSession(false, "Go ahead tell me your secret, I'm all microphones");
        }
        response.send();
    }



    return false;
}



app.intent('OnExitIntent', {
        "utterances":["leave",
            "quit",
            "bye",
            "good bye",
            "stop",
            "enough",
            "please stop",
            "cancel"]
},exitIntent);


function exitIntent(request,response) {
    response.clearSession(); // or: response.clearSession('key') to clear a single value
    response.say("Thank you for using Secret Keeper, Good bye");
    response.send();
};



// Output the schema
console.log( "\n\nSCHEMA:\n\n"+app.schema()+"\n\n" );
// Output sample utterances
console.log( "\n\nUTTERANCES:\n\n"+app.utterances()+"\n\n" );



