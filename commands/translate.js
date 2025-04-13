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