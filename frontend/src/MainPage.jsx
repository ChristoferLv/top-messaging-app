import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { checkChatWith, fetchAllUsers, fetchMessagesOfChat, fetchMyChats, fetchPicture, logOut, sendFirstMessage, sendMessage } from "./api/requests";
import { AuthContext } from "./AuthContext";
import MyContacts from "./components/MyContacts";
import ProfilePage from "./components/Profile";
import UserPicture from "./components/UserPicture";
import { io } from 'socket.io-client';
import MidiaMessage from "./components/MidiaMessage";

// let socket = null;

function MainPage() {
    const [socket, setSocket] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [chatsList, setChatsList] = useState([]);
    const [typingMessage, setTypingMessage] = useState("");
    const { user, isLoading } = useContext(AuthContext);
    const containerRef = useRef(null);
    const [chatingUser, setChatingUser] = useState(null);
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);

    const sortedChatsList = chatsList.toSorted((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    const [viewChats, setViewChats] = useState(true);
    const [showProfile, setshowProfile] = useState(false);
    const fetchChats = useCallback(async () => {
        try {
            const chats = await fetchMyChats();
            setChatsList(chats.data);
        } catch (e) {
            console.log(e);
        }
    }, []);

    const getMessagesOfChat = useCallback(async () => {
        try {
            const messages = await fetchMessagesOfChat(chat.id);
            if (messages) {
                setMessages(messages.data);
            }
        } catch (e) {
            console.log(e);
        }
    }, [chat]);



    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                setChat(null);
                setChatingUser(null);
            }
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, []);

    useEffect(() => {
        function onConnect() {
            console.log("connected")
        }

        function onDisconnect() {
            console.log("disconnected")
        }

        function onFooEvent(value) {
            console.log("foor", value)
            const chatId = value.split(":")[1];
            console.log(chat.id, chatId)
            if (chat && chat.id == chatId) {
                console.log("get messages with socket")
                getMessagesOfChat();
            } else {
                console.log("refetching chats")
                fetchChats();
            }
        }

        if (socket) {
            socket.on('connect', onConnect);
            socket.on('disconnect', onDisconnect);
            socket.on('olha a mensagem', onFooEvent);
        }
        return () => {
            console.log("cleaning up")
            if (socket) {
                socket.off('connect', onConnect);
                socket.off('disconnect', onDisconnect);
                socket.off('olha a mensagem', onFooEvent);
            }
        };
    }, [socket, chat]);

    useEffect(() => {
        if (user && !isLoading) {
            const storagedToken = localStorage.getItem('token');
            const socket = io("http://localhost:3000", {
                auth: {
                    token: storagedToken
                }
            });
            socket.connect();
            setSocket(socket)
        }
    }, [user, isLoading]);



    // useEffect(() => {
    //     async function getAllUsers() {
    //         try {
    //             const users = await fetchAllUsers();
    //             console.log(users)
    //             setUsersList(users.data);
    //         } catch (e) {
    //             console.log(e);
    //         }

    //     }
    //     getAllUsers();
    // }, []);

    useEffect(() => {
        fetchChats();
    }, []);



    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages]); // Fires every time the messages array updates

    useEffect(() => {
        if (chat != null) {
            // console.log("get the messages")
            getMessagesOfChat();
        }
    }, [chat])


    async function handleSelectUser(userId) {
        setChat(null);
        setMessages(null);
        setshowProfile(false);
        setViewChats(true);
        const chatExistsData = await checkChatWith(userId);
        setChatingUser(chatExistsData.data.user);
        if (chatExistsData.isChat) {
            setChat(chatExistsData.data.chat);
        } else {
            setChat(null);
        }
    }

    async function handleSendMessage(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        console.log(data)

        fileInputRef.current.value = "";
        if (!chat) {
            const result = await sendFirstMessage(chatingUser, data);
            if (result) {
                setChat(result.data.chat);
                fetchChats();
            }
        } else {
            const result = await sendMessage(chat.id, data);
            if (result) {
                const newChats = chatsList.map((newChat) => {
                    if (newChat.chatId == chat.id) {
                        return { ...newChat, updated_at: new Date().toISOString(), lastMessage: result.data }
                    }
                    return newChat;
                });
                setChatsList(newChats);
            }
        }
        const newMessages = await fetchMessagesOfChat(chat.id);
        if (newMessages) {
            setMessages(newMessages.data);
        }
        setTypingMessage("");
    }

    function handleTypingMessage(e) {
        setTypingMessage(e.target.value);
    }

    function handleToggleSidePane() {
        setViewChats(c => !c);
    }

    function handleToggleProfile() {
        setshowProfile(c => !c);
    }

    function handleLogout() {
        logOut();
    }

    console.log("chats list", chatsList)
    console.log("sorted chats list", sortedChatsList)

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
        // const result = await sendPicture(data);
        if (result) {
            setPicture(result.data);
        }
    }

    return (

        <>
            <div className="main-page">
                {viewChats ? (
                    <div className="side-pane">
                        <div className="logout-btn" onClick={handleLogout}>
                            <div className="icon logout-icon"></div>
                            <p>Log out</p>
                        </div>
                        <div className="main-header">
                            <p className="app-title">WhatsUp</p>
                            <div className="profile-btn" onClick={handleToggleProfile}>
                                <UserPicture userId={user.id} />
                                <p>Olá {user.username}</p>
                            </div>
                            <div onClick={(e) => handleToggleSidePane()} className="new-chat-btn">
                                <p>New Chat</p>
                                <div className="icon new-chat-icon"></div>
                            </div>
                        </div>
                        {sortedChatsList.length > 0 ? sortedChatsList.map((chatItem) => {
                            return <div key={chatItem.userId} className="user-item" onClick={(e) => handleSelectUser(chatItem.userId)}>
                                <UserPicture userId={chatItem.userId} />
                                <div className="user-item-data">
                                    <p>{chatItem.userId} - {chatItem.username}</p>
                                    <p>{chatItem.lastMessage.senderId == user.id ? "You" : chatItem.username}: {chatItem.lastMessage.content}</p>
                                    <p>{new Date(chatItem.updated_at).toISOString()}</p>
                                </div>
                            </div>
                        }) : <p>No users</p>}
                    </div>) : (
                    <MyContacts closeContactsList={handleToggleSidePane} selectUser={handleSelectUser} />
                )}
                {showProfile ? (
                    <ProfilePage />
                ) : (
                    chatingUser ? (
                        <div className="chat-pane">
                            <div className="chat-header">
                                <UserPicture userId={chatingUser.id} />
                                <p>{chatingUser.username}</p>
                            </div>
                            <div className="chat-body">
                                <div className="messages-list" ref={containerRef}>
                                    {/* <p>Messages</p> */}
                                    {messages && messages.map((message) => {
                                        if (message.type == "MIDIA")
                                            return <div data-time={message.created_at} key={message.id} className={`msg ${message.senderId == user.id ? "sent" : "rcvd"}`}>
                                                <MidiaMessage midiaId={message.id} />
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
                    ) : (
                        <NoChatHolder />
                    )
                )}
            </div >
        </>
    )

}


export default MainPage;



function NoChatHolder() {
    return (
        <div className="holder">
            <div className="holder-content">
                <div className="hold-img"></div>
                <p className="welcome">Welcome 🙂</p>
                <p className="hold-text">Send and receive messages in the best place ✉️</p>
            </div>
        </div>
    )
}

