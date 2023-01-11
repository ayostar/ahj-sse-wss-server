class Bot {
  getBotText() {
    const botText = [
      'Профессионалом делает не диплом и не репутация, а именно знания и понимание всего относящегося к делу',
      'Так уж мы устроены, что большинство из нас готовы совершенствоваться только осознавая, что другого выхода нет',
      'Точные знания - основа точных прогнозов',
      'Ум отчасти в том и состоит, чтобы отсекать разрешимые и важные для вас задачи от второстепенных',
      'Количественной оценкой ума может служить доля принимаемых человеком правильных решений. И опять же, насколько я могу судить, людей, принимающих правильные решения в достаточно широкой сфере, можно считать умными вообще',
      'Ум - дело наживное, и, как правило, умнее оказываются те, кто быстрее совершенствуется и не стесняется учиться постоянно',
      'Самостоятельно изучайте наши ошибки, чтобы не повторять их, а делать свои собственные',
      'Ценность информации заранее неизвестна никому',
      'Игроки интеллектуальных игр - это люди, умеющие соображать в нетривиальных обстоятельствах',
      'Интеллектуалу зачастую трудно принять решение - особенно если наличествующих сведений недостаточно для однозначного решения. Так что некоторый диктаторский склад ума и впрямь необходим',
      'Новые теории в науке опровергаются так же непрерывно, как и создаются. Если что-то, несмотря на многочисленные попытки, осталось не опровергнутым - это надёжно по крайней мере для текущей работы. Если не опровергнуто достаточно давно - то скорее всего останется верным',
    ];
    const index = Math.floor(Math.random() * botText.length);

    return botText[index];
  }
}

const WS = require('ws');
const { v4: uuid } = require('uuid');
const clients = {};
let usernames = ['Вассерманыч'];
let messages = [];

const port = process.env.PORT || 7070;
const wss = new WS.Server({ port });

wss.on('connection', (ws) => {
  const id = uuid();
  clients[id] = ws;
  console.log(`New client connected ${id}`);
  ws.send(JSON.stringify({ renderUsers: true, names: usernames }));
  if (messages.length !== 0) {
    ws.send(JSON.stringify({ renderMessages: true, messages: messages }));
  }

  ws.on('message', (rawMessage) => {
    const message = JSON.parse(rawMessage);

    if (message.chooseUsername) {
      if (usernames.every((name) => name !== message.username)) {
        usernames.push(message.username);
        clients[id].username = message.username;
        const name = clients[id].username;

        for (const id in clients) {
          if (clients[id].username === name) {
            clients[id].send(
              JSON.stringify({ nameIsFree: true, name: message.username })
            );
          } else {
            clients[id].send(
              JSON.stringify({ renderNames: true, name: message.username })
            );
          }
        }
        return;
      } else {
        clients[id].send(JSON.stringify({ nameIsFree: false }));
        return;
      }
    }

    if (message.chatMessage) {
      const date = new Date().getTime();
      const name = clients[id].username;

      messages.push({
        name: name,
        message: message.messageText,
        date: date,
      });

      for (const id in clients) {
        if (clients[id].username === name) {
          clients[id].send(
            JSON.stringify({
              renderOwnMessage: true,
              name: 'You',
              message: message.messageText,
              date: date,
            })
          );
        } else {
          clients[id].send(
            JSON.stringify({
              renderMessage: true,
              name: name,
              message: message.messageText,
              date: date,
            })
          );
        }
      }
    }

    if (message.chatMessage) {
      const date = new Date().getTime();
      const name = 'Вассерманыч';

      const bot = new Bot();
      let botMsg = bot.getBotText();
      const delay = Math.floor(Math.random() * (botMsg.length * 100));
      setTimeout(() => {
        messages.push({
          name: name,
          message: botMsg,
          date: date,
        });
        ws.send(
          JSON.stringify({
            renderMessage: true,
            name: name,
            message: botMsg,
            date: date,
          })
        );
      }, delay);
    }
  });

  ws.on('close', () => {
    usernames = usernames.filter((name) => name !== clients[id].username);
    for (const index in clients) {
      clients[index].send(
        JSON.stringify({ closeUser: true, name: clients[id].username })
      );
    }
    console.log(usernames);
    delete clients[id];
  });
});
