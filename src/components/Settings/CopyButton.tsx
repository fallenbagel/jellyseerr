import defineMessages from '@app/utils/defineMessages';
import { ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useClipboard from 'react-use-clipboard';

const messages = defineMessages('components.Settings', {
  copied: 'Copied API key to clipboard.',
});

const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
  const intl = useIntl();
  const [isCopied, setCopied] = useClipboard(textToCopy, {
    successDuration: 1000,
  });
  const { addToast } = useToasts();

  useEffect(() => {
    if (isCopied) {
      addToast(intl.formatMessage(messages.copied), {
        appearance: 'info',
        autoDismiss: true,
      });
    }
  }, [isCopied, addToast, intl]);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setCopied();
      }}
      className="input-action"
    >
      <ClipboardDocumentIcon />
    </button>
  );
};

export default CopyButton;
