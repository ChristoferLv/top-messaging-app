import { useContext, useEffect, useRef, useState } from "react";
import { checkChatWith, fetchAllUsers, fetchMessagesOfChat, sendFirstMessage, sendMessage } from "./api/requests";
import { AuthContext } from "./AuthContext";
import MyContacts from "./components/MyContacts";

function MainPage() {
    const [usersList, setUsersList] = useState([]);
    const { user, isLoading } = useContext(AuthContext);
    const containerRef = useRef(null);

    const [viewChats, setViewChats] = useState(true);


    useEffect(() => {
        async function getAllUsers() {
            try {
                const users = await fetchAllUsers();
                console.log(users)
                setUsersList(users.data);
            } catch (e) {
                console.log(e);
            }

        }
        getAllUsers();
    }, []);

    const [chatingUser, setChatingUser] = useState(null);
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);


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
        setViewChats(true);
        const chatExistsData = await checkChatWith(userId);
        console.log(chatExistsData)
        if (chatExistsData.isChat) {
            setChat(chatExistsData.data);
        } else {
            setChat(null);
        }
        console.log(chatingUser)
        setChatingUser(userId)
    }

    async function handleSendMessage(e) {
        e.preventDefault();
        console.log(e.target.children[0].value)
        if (!chat) {
            const result = await sendFirstMessage(chatingUser, e.target.children[0].value);
            console.log(result)
            if (result) {
                setChat(result.data.chat);
            }
        } else {
            const result = await sendMessage(chat.id, e.target.children[0].value);
            console.log("more messages result", result)
        }
        const newMessages = await fetchMessagesOfChat(chat.id);
        if (newMessages) {
            setMessages(newMessages.data);
        }
    }

    function handleToggleSidePane() {
        setViewChats(c => !c);
    }

    console.log(messages)

    return (

        <>
            <div className="main-page">
                {viewChats ? (

                    <div className="side-pane">
                        <p>Olá {user.username}</p>
                        <div onClick={(e) => handleToggleSidePane()} className="new-chat">
                            New chat +
                        </div>
                        {usersList.length > 0 ? usersList.map((user) => {
                            return <div key={user.id} className="user-item" onClick={(e) => handleSelectUser(user.id)}>
                                <p>{user.id} - {user.username}</p>
                            </div>
                        }) : <p>No users</p>}
                    </div>) : (
                    <MyContacts closeContactsList={handleToggleSidePane} selectUser={handleSelectUser} />
                )}
                <div className="chat-pane">
                    {chatingUser ? (
                        <>
                            <div className="chat-page"><p>Chat with {chatingUser}</p> - {chat ? <p>chat: {chat.id}</p> : <p>First message</p>}</div>
                            <div className="chat-body" ref={containerRef}><p>Messages</p>
                                {messages && messages.map((message) => {
                                    return <div key={message.id} className={`message ${message.senderId == user.id ? "own-message" : ""}`}>
                                        <p>{message.id} - {message.content}</p>
                                    </div>
                                })}
                            </div>
                            <div className="chat-controls">
                                <form onSubmit={handleSendMessage} action="">
                                    <input type="text" name="" id="" />
                                    <button type="submit">Send</button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <p>Chating with no one</p>
                    )

                    }
                </div>
            </div>
        </>
    )

}


export default MainPage;