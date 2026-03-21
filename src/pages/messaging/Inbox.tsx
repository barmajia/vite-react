import { ConversationList } from "@/features/messaging/components/ConversationList";

export const Inbox = () => {
  return (
    <div className="container mx-auto py-8 pt-20">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="bg-card border rounded-lg h-[600px]">
        <ConversationList />
      </div>
    </div>
  );
};
