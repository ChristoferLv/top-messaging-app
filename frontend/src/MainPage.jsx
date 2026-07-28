import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { checkChatWith, deleteGroup, fetchAllUsers, fetchMessagesOfChat, fetchMessagesOfGroup, fetchMyChats, fetchPicture, logOut, sendFirstMessage, sendGroupMessage, sendMessage } from "./api/requests";
import { AuthContext } from "./AuthContext";
import MyContacts from "./components/MyContacts";
import ProfilePage from "./components/Profile";
import UserPicture from "./components/UserPicture";
import { io } from 'socket.io-client';
import MidiaMessage from "./components/MidiaMessage";
import { ChatType } from "./defaults";
import NewGroupPage from "./components/NewGroupPage";
import GroupDetailsPage from "./components/GroupDetailsPage";
import socketIO from "./socket";
import GroupChatPanel from "./components/GroupChat";
import NormalChatPanel from "./components/NormalChat";
import ContactsPane from "./components/ContactsPane";

// let socket = null;

function MainPage() {
    const [socket, setSocket] = useState(null);
    // const [usersList, setUsersList] = useState([]);
    const [chatsList, setChatsList] = useState([]);
    // const [typingMessage, setTypingMessage] = useState("");
    const { user, isLoading } = useContext(AuthContext);
    // const containerRef = useRef(null);
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    // const [seeGroup, setSeeGroup] = useState(-1);
    const [update, setUpdate] = useState(0);

    const sortedChatsList = chatsList.toSorted((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    const [viewChats, setViewChats] = useState(true);
    const [showProfile, setshowProfile] = useState(-1);
    const [createGroup, setCteateGroup] = useState(false);

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
            if (chat != null) {
                if (chat.chatType == "GROUP") {
                    const messages = await fetchMessagesOfGroup(chat.groupId);
                    if (messages) {
                        setMessages(messages.data);
                    }
                    return;
                }
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



    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                setChat(null);
                setCteateGroup(false);
                setshowProfile(-1);
            }
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, []);

    useEffect(() => {
        function newMessageEvent(value) {
            fetchChats();
        }

        function updateStatusEvent(value) {
            const newChatsList = chatsList.map((chatItem) => {
                if (chatItem.chatType == ChatType.NORMAL && chatItem.id == value.id) {
                    return { ...chatItem, isOnline: value.status };
                }
                return chatItem;
            });
            setChatsList(newChatsList);
            if (chat) {
                if (chat.user.id == value.id) {
                    setChat({...chat, user:{...chat.user, isOnline:value.status}})
                }
            }
        }

        if (socket) {
            socket.on('new-message', newMessageEvent);
            socket.on('update-status', updateStatusEvent);
        }
        return () => {
            if (socket) {
                socket.off('new-message', newMessageEvent);
                socket.off('update-status', updateStatusEvent);
            }
        };
    }, [socket, chat, chatsList]);

    useEffect(() => {
        if (user && !isLoading) {
            const storagedToken = localStorage.getItem('token');
            socketIO.auth = { token: storagedToken }
            const connection = socketIO.connect();
            setSocket(connection);
        }
    }, [user, isLoading]);

    useEffect(() => {
        fetchChats();
    }, []);

    async function handleSelectUser(newChat) {
        setMessages(null);
        // setSeeGroup(-1);
        setshowProfile(-1);
        setViewChats(true);
        setCteateGroup(false);
        if (newChat.chatType == "GROUP") {
            setMessages(messages);
            setChat(newChat);
            return;
        }
        const chatExistsData = await checkChatWith(newChat.id);

        setChat(chatExistsData.data);
    }

    function handleToggleSidePane() {
        setViewChats(c => !c);
    }

    function handleShowCreateGroup() {
        setCteateGroup(c => !c);
    }

    function handleLogout() {
        logOut();
    }

    console.log("chats list", chatsList)
    console.log("sorted chats list", sortedChatsList)
    console.log("chat", chat, chat?.chatType)

    async function seeUserProfile(userId) {
        // setSeeGroup(-1);
        setCteateGroup(false);
        setshowProfile(userId);
    }

    async function closeUserProfile(userId) {
        setshowProfile(-1);
    }

    async function seeGroupDetails(groupId) {
        setSeeGroup(groupId);
    }

    async function closeGroupDetails() {
        setSeeGroup(-1);
    }

    function groupDeletion() {
        fetchChats();
        setChat(null);
    }


    let mainPane = <NoChatHolder />;

    if (false) {
        mainPane = <GroupDetailsPage groupId={seeGroup} close={closeGroupDetails} refetchChats={fetchChats} handleDelete={groupDeletion} setUpdate={setUpdate} />
    } else if (createGroup) {
        mainPane = <NewGroupPage close={handleShowCreateGroup} refetchChats={fetchChats} />
    }
    else if (showProfile != -1) {
        mainPane = <ProfilePage userId={showProfile} close={closeUserProfile} setUpdate={setUpdate} />
    } else if (chat) {
        if (chat.chatType == "GROUP") {
            mainPane = <GroupChatPanel chat={chat} fetchChats={fetchChats} chatsList={chatsList} setChatsList={setChatsList} groupDeletion={groupDeletion} groupId={chat.groupId} messages={messages} setUpdate={setUpdate} />
        } else {
            mainPane = <NormalChatPanel chat={chat} chatsList={chatsList} fetchChats={fetchChats} setChatsList={setChatsList} />
        }
    }

    return (
        <>
            <div className="main-page">
                {viewChats ? (
                    <ContactsPane user={user} chatsList={sortedChatsList} selectUser={handleSelectUser} logout={handleLogout} createGroup={handleShowCreateGroup} seeUserProfile={seeUserProfile} update={update} />
                ) : (
                    <MyContacts closeContactsList={handleToggleSidePane} selectUser={handleSelectUser} createGroup={handleShowCreateGroup} />
                )}
                {mainPane}
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

