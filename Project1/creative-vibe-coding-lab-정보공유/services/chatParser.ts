import { ParsedMessage } from '../types';

// Regex patterns for KakaoTalk export
const DATE_REGEX = /--------------- (\d{4}년 \d{1,2}월 \d{1,2}일 .*?) ---------------/;
const MSG_REGEX = /\[(.*?)\] \[(.*?)\] (.*)/;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const parseChatFile = (text: string): ParsedMessage[] => {
  const lines = text.split('\n');
  const messages: ParsedMessage[] = [];
  
  let currentDate = '';
  let currentMessage: ParsedMessage | null = null;

  lines.forEach((line) => {
    line = line.trim();
    if (!line) return;

    // Check for Date Header
    const dateMatch = line.match(DATE_REGEX);
    if (dateMatch) {
      currentDate = dateMatch[1];
      return;
    }

    // Check for New Message Start
    const msgMatch = line.match(MSG_REGEX);
    if (msgMatch) {
      // Push previous message if exists
      if (currentMessage) {
        messages.push(currentMessage);
      }
      
      currentMessage = {
        sender: msgMatch[1],
        time: msgMatch[2],
        date: currentDate,
        content: msgMatch[3],
      };
    } else if (currentMessage) {
      // Multiline message continuation
      currentMessage.content += `\n${line}`;
    }
  });

  // Push last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  // Filter only messages containing URLs
  return messages.filter(msg => URL_REGEX.test(msg.content));
};

export const extractUrls = (content: string): string[] => {
  const matches = content.match(URL_REGEX);
  if (!matches) return [];
  // Clean trailing punctuation that might be captured (e.g., "google.com.")
  return matches.map(url => url.replace(/[.,;!?)]+$/, ''));
};
