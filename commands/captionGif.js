const fs = require('fs');
const path = require('path');
const Canvas = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const gifFrames = require('gif-frames');
const { Readable } = require('stream');

module.exports = {
  name: 'captiongif',
  async execute(message, args) {
    let imageAttachment = null;

    if (message.attachments.size > 0) {
      imageAttachment = message.attachments.first();
    } else if (message.reference) {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedMessage.attachments.size > 0) {
        imageAttachment = repliedMessage.attachments.first();
      }
    }

    if (!imageAttachment || !imageAttachment.name.endsWith('.gif')) {
      return message.reply('Please provide a GIF (either attached or replied to).');
    }

    const captionText = args.join(' ') || '';

    // Download the GIF to a temp file
    const tempPath = path.join(__dirname, 'temp_input.gif');
    const response = await fetch(imageAttachment.url);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);

    const frames = await gifFrames({ url: tempPath, frames: 'all', outputType: 'canvas' });

    const width = frames[0].getImage().width;
    const height = frames[0].getImage().height;
    const textHeight = 40;

    const encoder = new GIFEncoder(width, height + textHeight);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setQuality(10);

    for (const frame of frames) {
      const frameCanvas = Canvas.createCanvas(width, height + textHeight);
      const ctx = frameCanvas.getContext('2d');

      // Background for text
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, textHeight);

      // Caption text
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(captionText, width / 2, textHeight * 0.7);

      // Draw the original GIF frame below the text
      ctx.drawImage(frame.getImage(), 0, textHeight);

      encoder.setDelay(frame.frameInfo.delay * 10); // Delay in ms
      encoder.addFrame(ctx);
    }

    encoder.finish();

    const outputBuffer = encoder.out.getData();
    const stream = Readable.from(outputBuffer);

    await message.channel.send({
      files: [{ attachment: stream, name: 'captioned.gif' }]
    });

    fs.unlinkSync(tempPath);
  }
};
