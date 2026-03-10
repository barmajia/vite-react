import { ChatWindow } from '@/features/messaging/components/ChatWindow';

export const Chat = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Chat</h1>
      <div className="bg-card border rounded-lg h-[600px]">
        <ChatWindow />
      </div>
    </div>
  );
};
