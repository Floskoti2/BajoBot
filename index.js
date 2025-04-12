/**const { Client, GatewayIntentBits } = require('discord.js');
const Canvas = require('canvas');
const fs = require('fs');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log('Bot is ready');
});

client.on('messageCreate', async message => {
  if (message.content.startsWith('!addtext')) {
    const canvas = Canvas.createCanvas(500, 500);
    const ctx = canvas.getContext('2d');

    const image = await Canvas.loadImage('image.png'); // make sure this file exists
    ctx.drawImage(image, 0, 50, 500, 450); // draw image lower to make room for text

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, 50); // white bar at top

    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = 'black';
    const text = 'Hello from bot!';
    const textWidth = ctx.measureText(text).width;
    const x = (canvas.width - textWidth) / 2;

    // Draw centered text
    ctx.fillText(text, x, 35);

    const buffer = canvas.toBuffer();
    message.channel.send({ files: [{ attachment: buffer, name: 'output.png' }] });
  }
});

client.login(config.token);

*/
const config = require('./config.json');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

// Load command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.once('ready', () => {
  console.log('Bot is ready!');
});

client.on('messageCreate', message => {
  if (!message.content.startsWith('!') || message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/); // remove "!" and split
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (command) {
   command.execute(message, args);
  }
});

client.login(config.token);