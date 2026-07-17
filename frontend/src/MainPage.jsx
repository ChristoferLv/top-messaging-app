import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { checkChatWith, fetchAllUsers, fetchMessagesOfChat, fetchMyChats, fetchPicture, logOut, sendFirstMessage, sendMessage } from "./api/requests";
import { AuthContext } from "./AuthContext";
import MyContacts from "./components/MyContacts";
import ProfilePage from "./components/Profile";
import UserPicture from "./components/UserPicture";

function MainPage() {
    const [usersList, setUsersList] = useState([]);
    const [chatsList, setChatsList] = useState([]);
    const [typingMessage, setTypingMessage] = useState("");
    const { user, isLoading } = useContext(AuthContext);
    const containerRef = useRef(null);
    const sortedChatsList = chatsList.sort((a, b) => b.updated_at - a.updated_at);
    const [chatingUser, setChatingUser] = useState(null);
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);

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
        async function getMessagesOfChat() {
            try {
                const messages = await fetchMessagesOfChat(chat.id);
                if (messages) {
                    setMessages(messages.data);
                }
            } catch (e) {
                console.log(e);
            }

        }
        if (chat != null)
            getMessagesOfChat();
    }, [chat])


    async function handleSelectUser(userId) {
        setChat(null);
        setMessages(null);
        setshowProfile(false);
        setViewChats(true);
        const chatExistsData = await checkChatWith(userId);
        if (chatExistsData.isChat) {
            setChat(chatExistsData.data);
        } else {
            setChat(null);
        }
        setChatingUser(userId)
    }

    async function handleSendMessage(e) {
        e.preventDefault();
        if (!chat) {
            const result = await sendFirstMessage(chatingUser, typingMessage);
            if (result) {
                setChat(result.data.chat);
                fetchChats();
            }
        } else {
            const result = await sendMessage(chat.id, typingMessage);
            if (result) {
                const newChats = chatsList.map((newChat) => {
                    if (newChat.chatId == chat.id) {
                        return { ...newChat, updated_at: new Date(), lastMessage: result.data }
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

    return (

        <>
            <div className="main-page">
                {viewChats ? (
                    <div className="side-pane">
                        <div className="logout-btn" onClick={handleLogout}>
                            <div className="icon logout-icon"></div>
                            <p>Log out</p>
                        </div>
                        <div className="profile-btn" onClick={handleToggleProfile}>
                            <p>Olá {user.username}</p>
                        </div>
                        <div onClick={(e) => handleToggleSidePane()} className="new-chat-btn">
                            <p>New Chat</p>
                            <div className="icon new-chat-icon"></div>
                        </div>
                        {sortedChatsList.length > 0 ? sortedChatsList.map((chatItem) => {
                            return <div key={chatItem.userId} className="user-item" onClick={(e) => handleSelectUser(chatItem.userId)}>
                                <UserPicture userId={chatItem.userId}/>
                                <div className="user-item-data">
                                    <p>{chatItem.userId} - {chatItem.username}</p>
                                    <p>{chatItem.lastMessage.senderId == user.id ? "You" : chatItem.username}: {chatItem.lastMessage.content}</p>
                                    <p>{new Date(chatItem.updated_at).toLocaleString()}</p>
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
                            <UserPicture userId={chatingUser} />
                            <div className="chat-page"><p>Chat with {chatingUser}</p> - {chat ? <p>chat: {chat.id}</p> : <p>First message</p>}</div>
                            <div className="chat-body" ref={containerRef}>
                                {/* <p>Messages</p> */}
                                {messages && messages.map((message) => {
                                    return <div data-time={message.created_at} key={message.id} className={`msg ${message.senderId == user.id ? "sent" : "rcvd"}`}>
                                        <p>{message.id} - {message.content}</p>
                                        <p className="message-time">{new Date(message.created_at).toLocaleString()}</p>
                                    </div>
                                })}
                            </div>
                            <div className="chat-controls">
                                <form onSubmit={handleSendMessage} action="">
                                    <input type="text" value={typingMessage} onChange={(e) => handleTypingMessage(e)} />
                                    <button type="submit">Send</button>
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

