import React, { useState, useEffect } from 'react';

const messages = [
  "Căn phòng lại chìm vào im lặng...",
  "Tiếng kim loại rít lên não nề...",
  "Bóng tối dường như đặc quánh lại...",
  "Một tiếng thở dài não nề vang lên từ góc phòng.",
  "Thời gian trôi đi thật chậm chạp trong hầm.",
];

const LoadingOverlay: React.FC = () => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-40 animate-fadeIn">
      <div className="text-center">
        <div className="animate-pulse font-display text-2xl text-green-400 mb-4">
            ...
        </div>
        <p className="text-lg text-green-300/80 italic">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
