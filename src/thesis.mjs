import { bindThesisChat } from './thesis-chat.mjs';
export const thesisStarters = ["AI's bottleneck is power, not chips", 'GLP-1s reshape food and healthcare', 'Aging drives a healthcare bull market', "India's retail consumption growth amid rising disposable income"];
export const bindCustomThesis = (root, entry = null) => bindThesisChat(root, entry);
