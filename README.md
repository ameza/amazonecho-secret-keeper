# Secret Keeper

Secret Keeper is an amazon echo skill that allows you to share your deepest secrets anonymously with other Alexa Owners in a public or private way. 

**Introduction**

Sometimes we have some secrets but we can't find the right person to share them with, so I thought Alexa might be the 
ideal place to do it anonymously.  Wouldn't be fun to hear secrets from all over the world? What if we could exchange 
secret messages with other users through Alexa? well... that's the goal of Alexa's Secret. 


**Making Alexa Social**

Most of the existing Alexa skills do not allow interaction with other Alexa owners so I wanted to create a channel to 
provide that. Most of the input you can provide to other skills is constrained to a handful of words, 
I did some research, and most of the custom skills that allow free input, they fail in one thing, they never get it right. 
So I tried be focused on that issue.

**Programming Story**

First of all just to be in context, I'm working with nodejs, lambda and mongodb. 

The main goal here is to store secrets, for that a central point of storage is needed so mongodb (mlab and mongoose)
was my choice, no particular reason, I'm more familiar with it and I wanted to code as fast as possible. 

I wanted to have two different types of secrets (public and private), my current architecture is based on controllers
so a controller to handle the db operations was needed, this is where the SecretController comes in,
allows to: add secrets, get a random public secret, and get private secret by password.

In order to have private secrets a password was needed, and here is when my First Challenge appears, normal passwords
are not a good choice in a voice environment, so I had come up with something simple like using 3 simple words as a
password, this sounds like a good idea but in practice Alexa gets easily confused, so I ended up using numbers instead
of words for simplicity, thanks to the NUMBER slots I was getting better results. The PasswordController is in charge
of providing us with two numbers to be used as passwords for the private secrets. eg. "My numbers are 900 and 800"
So far so good, as I explained earlier, getting the free input was my Second Challenge, I noticed the experience with
other free form input skills was really poor, and I truly wanted to provide at least a better experience. 

Going through the documentation I noticed that literal fields evolved into custom slots. I was getting bad results using
either one, just half of my sentence or a single word, pretty much the same as the other skills I found in the Alexa App.
I realized that my custom slot was missing training, or similar examples, I decided to train my slot with thousands
of secrets I found online, by providing my custom slot with those secrets as examples I was able to get better results on
my free form input.

The process of finding those secrets and cleaning them to be used in my slot was really hard, the slot is currently using
around 23000 secrets as examples, it's not perfect but covers the basic structure of common secrets and provides a better
experience in most of the sentences. Secrets must be short.

Finally after putting all the pieces together, I decide to had sounds and pauses, to provide a better experience for the
user and I also tried to make Alexa looks like she is truly interested on your secret.

**Integration with Raspberry PI**
I put the Alexa Voice Service on my raspberry pi, so in the demo I exchange secrets between my real Amazo Echo and
my Alexa Voice Service on the raspberry pi.
