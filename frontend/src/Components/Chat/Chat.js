import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import styles from './Chat.module.css';
import { makeRequest } from '../../Services/apiUtility';

const userId = localStorage.getItem('userId');

function Chat() {
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [people, setPeople] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    // Function to fetch connected users
    const fetchConnectedUsers = async () => {
        try {
            const response = await makeRequest({
                method: 'GET',
                url: 'https://localhost:3000/api/users/connections'
            });
            const users = response.data.connections;
            const usersWithFullNames = await Promise.all(users.map(async (user) => {
                const userInfoResponse = await makeRequest({
                    method: 'GET',
                    url: `https://localhost:3000/api/users/info/${user._id}`
                });
                return {
                    ...user,
                    fullName: `${userInfoResponse.data.name} ${userInfoResponse.data.surname}`
                };
            }));
            setPeople(usersWithFullNames);
        } catch (error) {
            console.error('Error fetching connected users:', error);
        }
    };

    // Function to fetch messages for the selected person
    const fetchMessages = async (personId) => {
        try {
            const response = await makeRequest({
                method: 'GET',
                url: `https://localhost:3000/api/message/`
            });

            const conversationList = response.data;
            const conversation = conversationList.find(conv => conv.user._id === personId);

            if (conversation) {
                const response2 = await makeRequest({
                    method: 'GET',
                    url: `https://localhost:3000/api/message/${conversation.conversationId}`
                });

                return response2.data.messages; // Return the messages from the conversation
            } else {
                return [];  // Return empty array if no conversation found
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Function to poll for new messages
    const pollMessages = async () => {
        if (activeChat) {
            const newMessages = await fetchMessages(activeChat._id);
            setMessages(newMessages); // Update messages with fetched messages
        }
    };

    const handlePersonClick = async (person) => {
        setActiveChat(person);
        const messages = await fetchMessages(person._id); // Fetch messages for the selected user
        setMessages(messages); // Set messages in state to display
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() && activeChat) {
            try {
                await makeRequest({
                    method: 'POST',
                    url: 'https://localhost:3000/api/message/send',
                    data: {
                        recipientId: activeChat._id,
                        content: newMessage
                    }
                });

                // Add the new message to the local messages state
                setMessages([...messages, { sender: userId, content: newMessage }]);
                setNewMessage(''); // Clear the input field after sending
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    // Fetch connected users when the component mounts
    useEffect(() => {
        fetchConnectedUsers(); // Initial fetch for connected users

        // Set up polling for messages every 1 seconds (1000ms)
        const intervalId = setInterval(pollMessages, 1000);

        // Clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [activeChat]); // Dependency array ensures this effect runs when activeChat changes

    return (
        <div className={styles.chatPage}>
            <Header />
            <div className={styles.chat}>
                {/* People list container */}
                <div className={styles.peopleContainer}>
                    <div>
                        <div className={styles.peopleHeader}>
                            Chats
                        </div>
                        <div className={styles.peopleList}>
                            {people.map((person, index) => (
                                <div
                                    key={index}
                                    className={`${styles.person} ${activeChat && activeChat._id === person._id ? styles.activePerson : ''}`}
                                    onClick={() => handlePersonClick(person)}
                                >
                                    {person.fullName}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Active chat container */}
                <div className={styles.chatContainer}>
                    <div className={styles.chatHeader}>
                        Chat with {activeChat ? activeChat.fullName : 'Select a user'}
                    </div>
                    <div className={styles.messageContainer}>
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`${styles.message} ${message.sender === userId ? styles.myMessage : styles.theirMessage}`}
                            >
                                {message.content}
                            </div>
                        ))}
                    </div>
                    {/* Input field for sending a message */}
                    <div className={styles.messageInputContainer}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} // Send message by pressing Enter
                            placeholder="Write your message"
                            className={styles.messageInput}
                        />
                        <button className={styles.sendButton} onClick={handleSendMessage}>
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chat;
