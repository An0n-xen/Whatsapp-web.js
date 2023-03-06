const { Client, LocalAuth, Buttons, List, Order } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
// const axios = require("axios");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const client = new Client({
  authStrategy: new LocalAuth(),
});

// Part for Rebel
async function PostRequest(command) {
  // const header = {
  //   "Content-Type": "application/json;charset=UTF-8",
  //   "Access-Control-Allow-Origin": "*",
  //   Accept: "application/json",
  // };

  // data = { statement: command };
  // let res = await axios.post("http://127.0.0.1:4433/", data, {
  //   header,
  // });

  // return res.data;

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: command,
    temperature: 0.3,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 0.0,
    presence_penalty: 0.6,
    stop: [" Human:", " AI:"],
  });
  return response.data["choices"][0]["text"];
}

let Strikers = {
  Members: [],
};
var n = 0;
let _switch = false;

// Strike checker
const getMembers = () => {
  Strikers["Members"] = [];
  client.getChats().then((chat) => {
    chat.forEach((chats) => {
      if (chats.name == "Test") {
        groupCheck = chats.participants;

        groupCheck.forEach((user) => {
          member_data = { number: user["id"]["user"], strikes: 0 };
          Strikers["Members"].push(member_data);
        });
      }
    });
  });
};

let StrickCheck = (msg, _offender) => {
  _offender = _offender.split("@")[0];
  Strikers["Members"].forEach((member) => {
    if (member.number == _offender) {
      if (member.strikes == 2) {
        msg.reply("Be Gone");
        //   removing user
        groupMon.removeParticipants([msg.author]);

        // Rescanning group members
        getMembers();
      } else {
        member.strikes += 1;
        msg.reply(
          "Dont spam Group please" + "\n" + "Strick: " + member.strikes,
        );
      }
    }
  });
};

// Setting helper functions
let Msgtype = (msgData, _ingrp) => {
  if (_ingrp) {
    // Checking message type
    if (msgData.type == "image") {
      // Checking offender and number of strikes
      Strikers["Members"].forEach((user) => {
        if (msgData.author.split("@")[0] == user["number"]) {
          if (!user["isAdmin"]) {
            StrickCheck(msgData, msgData.author);
          } else {
            console.log("is admin");
          }
        }
      });
    } else if (msgData.type == "video") {
      // Checking offender and number of strikes
      Strikers["Members"].forEach((user) => {
        if (msgData.author.split("@")[0] == user["number"]) {
          if (!user["isAdmin"]) {
            StrickCheck(msgData, msgData.author);
          } else {
            console.log("is admin");
          }
        }
      });
    } else {
      // Sending Message to rebel
      command = msgData.body.split(":");
      if (command.length == 2) {
        (async () => {
          response = await PostRequest(command[1]);
          if (_switch) {
            client.sendMessage(msgData.from, response);
          } else {
            client.sendMessage(msgData.author, response);
          }

          console.log(msgData.author + ":  " + command[1]);
        })();
      }
    }
  } else {
    command = msgData.body.split(":");
    if (command[1] == "Switch") {
      if (_switch == false) {
        _switch = true;
        client.sendMessage(msgData.from, `switch changed ${_switch}`);
      } else {
        _switch = false;
        client.sendMessage(msgData.from, `switch changed ${_switch}`);
      }
    }
    if (command.length == 2) {
      (async () => {
        response = await PostRequest(command[1]);
        client.sendMessage(msgData.from, response);
        console.log(msgData.from + ":  " + command[1]);
      })();
    }
  }
};

// Reply chats privately
let participantsCheck = (groupPart, _msg) => {
  groupPart.forEach((individuals) => {
    if (individuals.id._serialized == _msg.from) {
      Msgtype(_msg, 0);
    }
  });
};

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
  client.getChats().then((chat) => {
    // Setting group to monitor
    chat.forEach((chatObj) => {
      // Enter group name here

      if (
        chatObj.name.includes("Test")
        // chatObj.name.includes("Aaenics") &&
        // chatObj.name.includes("Senators")
      ) {
        groupMon = chatObj;

        // getting group participants
        GroupPart = groupMon.participants;
        GroupPart.forEach((user) => {
          member_data = {
            number: user["id"]["user"],
            isAdmin: user["isAdmin"],
            strikes: 0,
          };

          Strikers["Members"].push(member_data);
        });
      }
    });
  });
});

async function getgroups() {
  client.getChats().then((chat) => {
    // Setting group to monitor
    chat.forEach((chatObj) => {
      // Enter group name here

      if (
        chatObj.name.includes("Test")
        // chatObj.name.includes("Aaenics") &&
        // chatObj.name.includes("Senators")
      ) {
        groupMon = chatObj;

        // getting group participants
        GroupPart = groupMon.participants;
        GroupPart.forEach((user) => {
          member_data = {
            number: user["id"]["user"],
            isAdmin: user["isAdmin"],
            strikes: 0,
          };

          Strikers["Members"].push(member_data);
        });
      }
    });
  });
}

// Messages
client.on("message", async (msg) => {
  // Getting message sender
  msg.getChat().then((MsgFrom) => {
    if (MsgFrom.name === groupMon.name) {
      // Checking message type

      Msgtype(msg, 1);
      //   console.log(msg);
    } else {
      participantsCheck(GroupPart, msg);
    }
  });
});

// New member join
client.on("group_join", async (param) => {
  const chat = await param.getChat();

  await chat.sendMessage(
    `Welcome to Test +${param.id.participant.split("@")[0]}`,
  );

  console.log("new member added");
  // client.sendMessage(groupMon.id._serialized, "Welcome to Test");
});

//  Member remove
client.on("group_leave", async (param) => {
  const chat = await param.getChat();

  await chat.sendMessage(
    `Goodbye +${param.id.participant.split("@")[0]} have a nice life`,
  );

  console.log("member was removed");
});

client.initialize();
