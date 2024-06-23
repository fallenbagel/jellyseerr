import { defineMessages as intlDefineMessages } from 'react-intl';

export default function defineMessages(
  prefix: string,
  messages: Record<string, string>
) {
  const modifiedMessages: Record<
    string,
    { id: string; defaultMessage: string }
  > = {};
  for (const key of Object.keys(messages)) {
    modifiedMessages[key] = {
      id: prefix + '.' + key,
      defaultMessage: messages[key],
    };
  }
  return intlDefineMessages(modifiedMessages);
}
