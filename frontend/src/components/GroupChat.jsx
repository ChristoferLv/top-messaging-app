import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ChatType } from "../defaults";
import GroupDetailsPage from "./GroupDetailsPage";
import UserPicture from "./UserPicture";
import { AuthContext } from "../AuthContext";
import { fetchMessagesOfGroup, sendGroupMessage } from "../api/requests";
import MidiaMessage from "./MidiaMessage";
import socketIO from "../socket";

function GroupChatPanel({ chat, chatsList, setChatsList, fetchChats, groupDeletion }) {
    const { user, isLoading } = useContext(AuthContext);
    const [seeGroupDetails, setSeeGroupDetails] = useState(false);
    const containerRef = useRef(null);
    const [typingMessage, setTypingMessage] = useState("");
    const [messages, setMessages] = useState([]);

    const getMessagesOfChat = useCallback(async () => {
        try {
            if (chat != null) {
                if (chat.chatType == "GROUP") {
                    const messages = await fetchMessagesOfGroup(chat.groupId);
                    if (messages) {
                        setMessages(messages.data);
                    }
                    return;
                }
            }
        } catch (e) {
            console.log(e);
        }
    }, [chat]);

    function closeGroupDetails() {
        setSeeGroupDetails(false);
    }

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages, seeGroupDetails]);

    useEffect(() => {
        if (chat != null) {
            getMessagesOfChat();
        }
        setTypingMessage("");
    }, [chat])

    useEffect(() => {
        function onFooEvent(value) {
            const chatId = value.split(":")[1];
            if (chat) {
                getMessagesOfChat();
            }
        }

        if (socketIO.connected) {
            socketIO.on('olha a mensagem', onFooEvent);
        }
        return () => {
            if (socketIO) {
                socketIO.off('olha a mensagem', onFooEvent);
            }
        };
    }, [chat]);

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

        if (chat?.chatType == "GROUP") {
            const result = await sendGroupMessage(chat.groupId, data);
            if (result) {
                const newChats = chatsList.map((newChat) => {
                    if (newChat.chatId == chat.id) {
                        return { ...newChat, updated_at: new Date().toISOString(), lastMessage: result.data }
                    }
                    return newChat;
                });
                setChatsList(newChats);
            }

            const newMessages = await fetchMessagesOfGroup(chat.groupId);
            if (newMessages) {
                setMessages(newMessages.data);
            }

            setTypingMessage("");
            return;
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

    async function handlePictureSubmit(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const result = await sendPicture(data);
        if (result) {
            setPicture(result.data);
        }
    }


    return (

        seeGroupDetails ? <GroupDetailsPage groupId={chat.groupId} close={closeGroupDetails} refetchChats={fetchChats} handleDelete={groupDeletion} />
            :
            <div className="chat-pane">
                <div className="chat-header" onClick={() => { setSeeGroupDetails(true) }}>
                    <UserPicture id={chat.groupId} type={ChatType.GROUP} />
                    <p>{chat.username}</p>
                </div>
                <div className="chat-body">
                    <div className="messages-list" ref={containerRef}>
                        {messages && messages.map((message) => {
                            if (message.type == "MIDIA")
                                return <div data-time={message.created_at} key={message.id} className={`msg ${message.senderId == user.id ? "sent" : "rcvd"}`}>
                                    <MidiaMessage midiaId={message.id} origin={ChatType.GROUP} />
                                </div>
                            return <div data-time={message.created_at} key={message.id} className={`msg ${message.senderId == user.id ? "sent" : "rcvd"}`}>
                                <p>{message.content}</p>
                                <p className="message-time">{new Date(message.created_at).toLocaleString()}</p>
                            </div>
                        })}
                    </div>
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
                        <input type="text" name="message" value={typingMessage} placeholder="Type your message" onChange={(e) => handleTypingMessage(e)} />
                        <button className="send-picture"
                            type="button"
                            onClick={handleClickAttach}
                        ><img src="../public/attach-icon.png" alt="" />
                        </button>
                    </form>
                </div>
            </div>
    );
}





export default GroupChatPanel;