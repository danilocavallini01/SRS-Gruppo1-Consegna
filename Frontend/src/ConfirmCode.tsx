import { URI } from "./secret";

interface ConfirmCodeProps {
  code: string;
  onConfirmed: () => void;
}

export default function ConfirmCode({ code, onConfirmed }: ConfirmCodeProps) {
  const handleConfirm = async () => {
    try {
      const response = await fetch(`${URI}/api/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        console.log('Code confirmed successfully');
        onConfirmed();
      } else {
        console.error('Failed to confirm code');
      }
    } catch (error) {
      console.error('Error confirming code:', error);
    }
  };

  return (
    <div className="mb-3">
      <button className="btn btn-warning" onClick={handleConfirm}>
        ✅ Confirm Code
      </button>
    </div>
  );
}
