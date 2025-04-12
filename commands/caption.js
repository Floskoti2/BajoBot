const Canvas = require('canvas');
//Canvas.registerFont('C:/Users/User/Desktop/BajoBot/Fonts/FuturaExtraBlackCondensedRegular.otf', { family: 'CustomFont' });


module.exports = {
  name: 'caption',
  async execute(message, args) {

    
    // Find an image to use
    let imageAttachment = null;
    
    // Check if the command message has an attachment
    if (message.attachments.size > 0) {
      imageAttachment = message.attachments.first();
    }
    
    // If no attachment in this message, check if it's a reply to a message with an image
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
    
    // If still no image found, search recent messages
    if (!imageAttachment) {
      const messages = await message.channel.messages.fetch({ limit: 10 });
      
      for (const [_, msg] of messages) {
        if (msg.attachments.size > 0) {
          imageAttachment = msg.attachments.first();
          break;
        }
      }
    }
    
    // If no image was found
    if (!imageAttachment) {
      return message.reply('No image found. Please attach an image, reply to a message with an image, or use the command after an image has been posted.');
    }
    
    const image = await Canvas.loadImage(imageAttachment.url);
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
    ctx.font = `${height/4/3}px CustomFont`;
    ctx.fillStyle = 'black';
    const text = args.join(' ');
    const textWidth = ctx.measureText(text).width;
    const x = (width- textWidth) / 2;

    ctx.fillText(text, x, height/4/3 * 2);

    ctx.drawImage(image, 0, height/4, width, height);
    const buffer = canvas.toBuffer();
    
    message.channel.send({ files: [{ attachment: buffer, name: 'output.png' }] });
  }
};