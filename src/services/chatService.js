class ChatService {
    constructor() {
        this.userConversations = new Map();
    }

    getConversationId(user) {
        return this.userConversations.get(user) || '';
    }

    setConversationId(user, conversationId) {
        if (conversationId) {
            this.userConversations.set(user, conversationId);
        }
    }
}

module.exports = new ChatService(); 