import leoProfanity from "leo-profanity";
// import { dictionary } from "profanity-i18n";
import profanity from "profanity-i18n";

// const dictionaryContainer = pkg.default || pkg;

let dictionary = null;

const internalModule = await import("./../../node_modules/profanity-i18n/src/dictionary/dictionary.js");

dictionary = internalModule.dictionary;
console.log("second try");


//add arabic profanity
leoProfanity.add([...dictionary]);

// load the dictionary
leoProfanity.loadDictionary();

export function cleanText(text) {
  return (leoProfanity.clean(profanity.filter(text)));

}

export function containsBadWords(text) {
  return leoProfanity.check(text) || profanity.contains(text);
}

