import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ChatType } from "../defaults";
import GroupDetailsPage from "./GroupDetailsPage";
import UserPicture from "./UserPicture";
import { AuthContext } from "../AuthContext";
import { fetchMessagesOfChat, sendFirstMessage, sendMessage, sendPicture, } from "../api/requests";
import MidiaMessage from "./MidiaMessage";
import socketIO from "../socket";

function NormalChatPanel({ chat, chatsList, setChatsList, fetchChats }) {
    const { user, isLoading } = useContext(AuthContext);
    const [seeGroupDetails, setSeeGroupDetails] = useState(false);
    const containerRef = useRef(null);
    const [typingMessage, setTypingMessage] = useState("");
    const [messages, setMessages] = useState([]);

    const getMessagesOfChat = useCallback(async () => {
        try {
            console.log("chatt", chat)
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

    function closeGroupDetails() {
        setSeeGroupDetails(false);
    }

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (chat != null) {
            console.log("get the messages")
            getMessagesOfChat();
        }
        setTypingMessage("");
    }, [chat])

    useEffect(() => {
        console.log("socket updated", socketIO)
        console.log("connected===", socketIO)

        function test(value) {
            console.log("TEST RECEIVED", value)
        }

        function onFooEvent(value) {
            console.log("inside on foo")
            console.log("foor", value)
            const chatId = value.split(":")[1];
            if (chat) {
                console.log("yes chat", chat)
                console.log(chat.chat?.chatType, ChatType.NORMAL, chat.chat?.id, chatId, chat.chat?.id == chatId,)
                console.log(chat.chatType == ChatType.GROUP && chat.groupId == chatId)
                if (chat.chat?.chatType == ChatType.NORMAL && chat.chat?.id == chatId) {
                    console.log("refetch via socket=======")
                    getMessagesOfChat();
                }
            }
        }

        if (socketIO.connected) {
            socketIO.on("test", test)
            socketIO.on('olha a mensagem', onFooEvent);
        }
        return () => {
            console.log("cleaning up")
            if (socketIO) {
                socketIO.off("test", test)
                socketIO.off('olha a mensagem', onFooEvent);
            }
        };
    }, [chat]);

    async function handleSendMessage(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        console.log(data)
        fileInputRef.current.value = "";
        if (data.midia.size > 5000000) {
            alert("Maximum midia size is 5MB.");
            return;
        }

        if (data.message.length < 1 && data.midia.size == 0) {
            return;
        }
        console.log(chat)
        if (!chat.chat) {
            const result = await sendFirstMessage(chat.user.id, data);
            if (result) {
                console.log("new chat data", result.data)
                setChat(result.data);
                fetchChats();
                const newMessages = await fetchMessagesOfChat(result.chat.id);
                if (newMessages) {
                    setMessages(newMessages.data);
                }
            }
        } else {
            console.log("sending")
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
        console.log("typing", e.target.value)
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

    // async function handlePictureSubmit(e) {
    //     console.log("sending picture")
    //     e.preventDefault();
    //     const data = Object.fromEntries(new FormData(e.target).entries());
    //     const result = await sendPicture(data);
    //     if (result) {
    //         setPicture(result.data);
    //     }
    // }


    return (

        <div className="chat-pane">
            <div className="chat-header" onClick={() => seeUserProfile(chat.user.id)}>
                <UserPicture id={chat.user.id} type={chat.chatType} />
                <p>{chat.user.username}</p>
            </div>
            <div className="chat-body">
                <div className="messages-list" ref={containerRef}>
                    {/* <p>Messages</p> */}
                    {messages && messages.map((message) => {
                        if (message.type == "MIDIA")
                            return <div data-time={message.created_at} key={message.id} className={`msg ${message.senderId == user.id ? "sent" : "rcvd"}`}>
                                <MidiaMessage midiaId={message.id} origin={ChatType.NORMAL} />
                            </div>
                        return <div data-time={message.created_at} key={message.id} className={`msg ${message.senderId == user.id ? "sent" : "rcvd"}`}>
                            <p>{message.id} - {message.content}</p>
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





export default NormalChatPanel;