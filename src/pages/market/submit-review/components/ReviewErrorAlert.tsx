import React from 'react';

interface ReviewErrorAlertProps {
  message: string;
}

const ReviewErrorAlert: React.FC<ReviewErrorAlertProps> = ({ message }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
};

export default ReviewErrorAlert;
