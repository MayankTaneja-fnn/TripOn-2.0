class ChatHistory:
    def __init__(self, max_turns=5):
        self.history = []
        self.max_turns = max_turns

    def add_turn(self, user_query, assistant_response):
        """Adds a turn to the history."""
        self.history.append({"role": "user", "content": user_query})
        self.history.append({"role": "assistant", "content": assistant_response})
        
        # Keep only the last N turns
        if len(self.history) > self.max_turns * 2:
            self.history = self.history[-(self.max_turns * 2):]

    def get_messages(self):
        """Returns history formatted for LLM."""
        return self.history
