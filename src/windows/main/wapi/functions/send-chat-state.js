module.exports = {
  /**
   * The state you want to set for the chat. Can be TYPING (1), RECRDING (2) or PAUSED (3);
   * @param {number} state
   * @param {string} chatId
   * @returns {boolean} true if success, false otherwise
   */
  async sendChatstate(state, chatId) {
    switch (state) {
      case 0:
        await window.Store.ChatStates.sendChatStateComposing(chatId);
        break;
      case 1:
        await window.Store.ChatStates.sendChatStateRecording(chatId);
        break;
      case 2:
        await window.Store.ChatStates.sendChatStatePaused(chatId);
        break;
      default:
        return false;
    }
    return true;
  }
}