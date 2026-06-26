import { chatService } from "../services/chatService.js";

export const chatController = {
  async sendMessage(req, res, next) {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message cannot be empty." });
      }

      const reply = await chatService.askAI({
        message: message.trim(),
        userEmail: req.user.email,
        userRole: req.user.role
      });

      return res.status(200).json({ reply });
    } catch (error) {
      console.error("Chat Controller Error:", error);
      return res.status(500).json({ error: error.message || "Internal server error in AI Assistant." });
    }
  }
};
