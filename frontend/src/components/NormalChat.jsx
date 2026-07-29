import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ChatType } from "../defaults";
import GroupDetailsPage from "./GroupDetailsPage";
import UserPicture from "./UserPicture";
import { AuthContext } from "../AuthContext";
import { fetchMessagesOfChat, sendFirstMessage, sendMessage, sendPicture, } from "../api/requests";
import MidiaMessage from "./MidiaMessage";
import socketIO from "../socket";
import ProfilePage from "./Profile";

function NormalChatPanel({ chat, chatsList, setChatsList, fetchChats, setChat }) {
    const { user, isLoading } = useContext(AuthContext);
    const containerRef = useRef(null);
    const [typingMessage, setTypingMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [seeProfile, setSeeProfile] = useState(false);

    const getMessagesOfChat = useCallback(async () => {
        try {
            if (chat != null) {
                if (chat.chat != null) {
                    const messages = await fetchMessagesOfChat(chat.chat.id);
                    if (messages) {
                        setMessages(messages.data);
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    }, [chat]);

    function keydownArea(event) {
        if (event.key === 'Enter') {
            if (!event.shiftKey) {
                event.preventDefault(); 
                const form = event.target.closest('form');
                if (form) {
                    form.requestSubmit();
                }
            }
        }
    }

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages, seeProfile]);

    useEffect(() => {
        setMessages(null);
        if (chat != null) {
            getMessagesOfChat();
        }
        setTypingMessage("");
    }, [chat.user.id])

    useEffect(() => {
        function newMessageEvent(value) {
            const chatId = value.split(":")[1];
            if (chat) {
                if (chat.chat?.chatType == ChatType.NORMAL && chat.chat?.id == chatId) {
                    getMessagesOfChat();
                }
            }
        }

        if (socketIO.connected) {
            socketIO.on('new-message', newMessageEvent);
        }
        return () => {
            if (socketIO) {
                socketIO.off('new-message', newMessageEvent);
            }
        };
    }, [chat.user.id, chat.chat?.id]);

    async function handleSendMessage(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        fileInputRef.current.value = "";
        if (data.midia.size > 5000000) {
            alert("Maximum midia size is 5MB.");
            return;
        }

        if (data.message.length < 1 && data.midia.size == 0) {
            return;
        }

        if (!chat.chat) {
            const result = await sendFirstMessage(chat.user.id, data);
            if (result) {
                setChat(result.data);
                fetchChats();
                console.log(result)
                const newMessages = await fetchMessagesOfChat(result.data.chat.id);
                if (newMessages) {
                    setMessages(newMessages.data);
                }
            }
        } else {
            const result = await sendMessage(chat.chat.id, data);
            if (result) {
                const newChats = chatsList.map((newChat) => {
                    if (newChat.chatId == chat.chat.id) {
                        return { ...newChat, updated_at: new Date().toISOString(), lastMessage: result.data }
                    }
                    return newChat;
                });
                setChatsList(newChats);
            }
            const newMessages = await fetchMessagesOfChat(chat.chat.id);
            if (newMessages) {
                setMessages(newMessages.data);
            }
        }
        setTypingMessage("");
    }

    function handleTypingMessage(e) {
        if (e.target.value.length > 20000) {
            alert("Maximum message length is 20000 characters.")
            return;
        }
        setTypingMessage(e.target.value);
    }

    const fileInputRef = useRef(null);

    function handleClickAttach(e) {
        fileInputRef.current.click();
    }

    async function handleUploadImage(e) {
        e.target.parentElement.requestSubmit();
    }

    function seeUserProfile() {
        setSeeProfile(true);
    }

    function closeProfile() {
        setSeeProfile(false);
    }

    return (

        seeProfile ? <ProfilePage userId={chat.user.id} close={closeProfile} />
            :
            <div className="chat-pane">
                <div className="chat-header" onClick={() => seeUserProfile(chat.user.id)}>
                    <UserPicture id={chat.user.id} type={chat.chatType} isOnline={chat.user.isOnline}/>
                    <p>{chat.user.username}</p>
                </div>
                <div className="chat-body">
                    <div className="messages-list" ref={containerRef}>
                        {messages && messages.map((message) => {
                            if (message.type == "MIDIA")
                                return <div data-time={message.created_at} key={message.id} className={`msg ${message.senderId == user.id ? "sent" : "rcvd"}`}>
                                    <MidiaMessage midiaId={message.id} origin={ChatType.NORMAL} />
                                </div>
                            return <div data-time={message.created_at} key={message.id} className={`msg ${message.senderId == user.id ? "sent" : "rcvd"}`}>
                                <textarea readOnly value={message.content} />
                                <p className="message-time">{new Date(message.created_at).toLocaleString()}</p>
                            </div>
                        })}
                    </div>
                    <div className="chat-controls">
                        <form onSubmit={handleSendMessage} action="">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                name="midia"
                                style={{ display: "none" }}
                                onChange={handleUploadImage}
                            />
                            <textarea onKeyDown={keydownArea} type="text" name="message" value={typingMessage} placeholder="Type your message" onChange={(e) => handleTypingMessage(e)} />
                            <button className="send-picture"
                                type="button"
                                onClick={handleClickAttach}
                            ><img src="../public/attach-icon.png" alt="" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

    );
}





export default NormalChatPanel;