/*
const config = require('../config.json');
const deepl = require('deepl-node');

module.exports = {
  name: 'translate',
  async execute(message, args) {
    const authKey = config.deeplToken; // Replace with your key
    const translator = new deepl.Translator(authKey);

    (async () => {
        const result = await translator.translateText('Hello, world!', null, 'fr');
        console.log(result.text);
    })();
  }
};
*/
const config = require('../config.json');
const deepl = require('deepl-node');
const Canvas = require('canvas');
const Tesseract = require('tesseract.js');
const { createWriteStream } = require('fs');
const path = require('path');
const axios = require('axios');
const GIFEncoder = require('gif-encoder-2');
const { Readable } = require('stream');

module.exports = {
  name: 'translate',
  async execute(message, args) {
    let imageAttachment = null;

    if (message.attachments.size > 0) {
      imageAttachment = message.attachments.first();
    }

    if (!imageAttachment && message.reference) {
      try {
        const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (repliedMessage.attachments.size > 0) {
          imageAttachment = repliedMessage.attachments.first();
        }
      } catch (error) {
        console.error('Error fetching replied message:', error);
      }
    }

    if (!imageAttachment) {
      const messages = await message.channel.messages.fetch({ limit: 10 });
      for (const [_, msg] of messages) {
        if (msg.attachments.size > 0) {
          imageAttachment = msg.attachments.first();
          break;
        }
      }
    }

    if (!imageAttachment) {
      return message.reply('No image found. Please attach or reply to an image.');
    }

    // Load the image
    const image = await Canvas.loadImage(imageAttachment.url);
    const canvas = Canvas.createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    // Crop the top section of the image where the text is
    const topHeight = Math.floor(image.height * 0.2);
    const croppedCanvas = Canvas.createCanvas(image.width, topHeight);
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(canvas, 0, 0, image.width, topHeight, 0, 0, image.width, topHeight);

    // Save cropped image to buffer
    const buffer = croppedCanvas.toBuffer('image/png');

    try {
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
        logger: m => console.log(m) // Optional: log OCR progress
      });

      if (text.trim()) {
        const authKey = config.deeplToken; // Replace with your key
        const translator = new deepl.Translator(authKey);
    
        (async () => {
            const result = await translator.translateText(text.trim(), 'SL', 'en-GB');
            console.log(result.text);

            const width = image.width;
            const height = image.height;
            // Continue with the original code using the found image
            const canvas = Canvas.createCanvas(width, height+height/5);
            console.log(width)
            const ctx = canvas.getContext('2d');
        
            // Background for text
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height/4);
            // Bold centered text
            ctx.font = `${height/4/3}px Bold`; 
            ctx.fillStyle = 'black';
            const newText = result.text
            const textWidth = ctx.measureText(newText).width;
            const x = (width- textWidth) / 2;
        
            ctx.fillText(newText, x, height/4/3 * 2);
        
            ctx.drawImage(image, 0, height/4, width, height);
            
            const encoder = new GIFEncoder(width, height + height/5);
                encoder.start();
                encoder.setRepeat(0); // 0 = loop forever
                encoder.setDelay(1000); // Frame delay in ms
                encoder.setQuality(10);
            
                encoder.addFrame(ctx);
                encoder.finish();
            
                const buffer = encoder.out.getData();
                const stream = Readable.from(buffer);
            
                message.channel.send({
                    files: [{
                    attachment: stream,
                    name: 'test.gif'
                    }]
                });
            
        })();
      } else {
        message.reply("Couldn't find any readable text in the top portion of the image.");
      }
    } catch (err) {
      console.error('OCR failed:', err);
      message.reply('Failed to read the text from the image.');
    }
  }
};
