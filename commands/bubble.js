const Canvas = require('canvas');
const GIFEncoder = require('gif-encoder-2');
const { Readable } = require('stream');

module.exports = {
  name: 'bubble',
  async execute(message) {
    // Find an image
    let imageAttachment = null;
    
    if (message.attachments.size > 0) {
      imageAttachment = message.attachments.first();
    } else if (message.reference) {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedMessage.attachments.size > 0) {
        imageAttachment = repliedMessage.attachments.first();
      }
    } else {
      const messages = await message.channel.messages.fetch({ limit: 10 });
      for (const [_, msg] of messages) {
        if (msg.attachments.size > 0) {
          imageAttachment = msg.attachments.first();
          break;
        }
      }
    }
    
    if (!imageAttachment) {
      return message.reply('No image found.');
    }

    const image = await Canvas.loadImage(imageAttachment.url);
    const width = image.width;
    const height = image.height;
    
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw image
    ctx.drawImage(image, 0, 0, width, height);
    
    // Make all dimensions proportional to image size
    // Bubble settings
    const bubbleHeightRatio = 1.0; // Bubble height as proportion of image height
    const bubbleHeight = Math.round(height * bubbleHeightRatio);
    const bubbleWidth = width + Math.round(width * 0.05); // Width slightly larger than image
    const bubbleX = -Math.round(width * 0.02); // Small negative margin
    
    // Visible portion as proportion of bubble height
    const visiblePortionRatio = 0.17;
    const visiblePortion = Math.round(bubbleHeight * visiblePortionRatio);
    const bubbleY = -bubbleHeight + visiblePortion;
    
    // Corner radius scaled with image size
    const cornerRadius = Math.round(Math.min(width, height) * 0.2);

    // Set bubble color
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgb(28,29,34)`;

    drawRoundedRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, cornerRadius);
    
    ctx.beginPath();
    // Position for the base of the tail on the right side of the bubble
    const tailBaseX = bubbleX + bubbleWidth * 0.75; // Position at 3/4 of the bubble width
    const tailBaseY = bubbleY + bubbleHeight;
    
    // Width of the tail where it connects to the bubble - scaled with image width
    const tailBaseWidth = Math.round(width * 0.05);
    
    // Start at the left edge of the tail's base - adjusted for better shape
    ctx.moveTo(tailBaseX - (tailBaseWidth/3), tailBaseY);
    
    // Tail height proportional to image height
    const tailHeight = Math.round(height * 0.2);
    
    // Draw to the point of the triangle
    const pointX = tailBaseX - tailBaseWidth;
    const pointY = tailBaseY + tailHeight;
    ctx.lineTo(pointX, pointY);
    
    // Draw back to the right edge of the tail's base
    ctx.lineTo(tailBaseX + tailBaseWidth/2, tailBaseY);
    ctx.closePath();
    ctx.fill();
    
    // Create GIF
    const encoder = new GIFEncoder(width, height);
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(1000);
    encoder.setQuality(10);
    encoder.addFrame(ctx);
    encoder.finish();
    
    const buffer = encoder.out.getData();
    const stream = Readable.from(buffer);
    
    message.channel.send({
      files: [{
        attachment: stream,
        name: 'bubble.gif'
      }]
    });
  }
};

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}